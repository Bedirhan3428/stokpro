import { NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { hashKeySync } from '../../../src/utils/cryptoUtils';

const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  '1:330292329201:web:d19827937fb863ea490750';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { uid, keyHash, masterData } = body || {};

    if (!uid || !keyHash || !masterData) {
      return NextResponse.json(
        { error: 'Eksik parametreler (uid, keyHash ve masterData gereklidir).' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Kullanıcı Profili ve Yetki Doğrulaması (Firestore üzerinden)
    const profileRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'profile', 'user_doc');
    const userRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid);

    const [pSnap, uSnap] = await Promise.all([
      getDoc(profileRef).catch(() => null),
      getDoc(userRef).catch(() => null),
    ]);

    const pData = pSnap && pSnap.exists() ? pSnap.data() : {};
    const uData = uSnap && uSnap.exists() ? uSnap.data() : {};

    // DB'de kayıtlı hash'ler (Plain key asla DB'de tutulmaz, sadece SHA-256 hash'i saklanır)
    const validHashes = new Set();

    if (pData.terminalKeyHash) validHashes.add(String(pData.terminalKeyHash).trim().toLowerCase());
    if (pData.deviceKeyHash) validHashes.add(String(pData.deviceKeyHash).trim().toLowerCase());
    if (pData.productKeyHash) validHashes.add(String(pData.productKeyHash).trim().toLowerCase());
    if (uData.terminalKeyHash) validHashes.add(String(uData.terminalKeyHash).trim().toLowerCase());
    if (uData.deviceKeyHash) validHashes.add(String(uData.deviceKeyHash).trim().toLowerCase());

    // Eski/Dönüşüm senaryoları: Eğer DB'de düz productKey varsa hash'leyip eşle
    if (pData.productKey) {
      validHashes.add(hashKeySync(pData.productKey).toLowerCase());
    }

    const cleanInputHash = String(keyHash).trim().toLowerCase();
    let isAuthorized = validHashes.has(cleanInputHash);

    // Eğer kullanıcı ilk defa terminal eşliyorsa ve terminalKeyHash henüz oluşmamışsa,
    // ilk eşleşme doğrulamasıyla hash'i DB'ye kalıcı güvenli anahtar olarak kaydet
    if (!isAuthorized && validHashes.size === 0) {
      isAuthorized = true;
      try {
        await setDoc(profileRef, { terminalKeyHash: cleanInputHash }, { merge: true });
      } catch {}
    }

    // 2. YETKİ DENETİMİ
    if (!isAuthorized) {
      console.warn(`Yetkisiz senkronizasyon denemesi: UID ${uid}`);
      return NextResponse.json(
        { error: 'Yetki reddedildi: Terminal anahtar hash\'i eşleşmedi.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. YETKİ VERİLDİ -> VERİLERİ DOĞRUDAN FIRESTORE VERİTABANINA YAZ
    const allProducts = Array.isArray(masterData.products) ? masterData.products : [];
    const allCustomers = Array.isArray(masterData.customers) ? masterData.customers : [];
    const lastBackupAt = masterData.lastBackupAt || new Date().toISOString();

    // a) Tek parça Master Yedek Dokümanı (artifacts/.../master_backup/latest)
    const masterBackupRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'master_backup', 'latest');
    await setDoc(
      masterBackupRef,
      {
        lastBackupAt,
        appVersion: masterData.appVersion || '1.0.0',
        productsCount: allProducts.length,
        customersCount: allCustomers.length,
        salesCount: masterData.sales?.length || 0,
        expensesCount: masterData.expenses?.length || 0,
        masterJsonString: JSON.stringify(masterData),
      },
      { merge: true }
    );

    // b) Web Uygulaması 0ms Master Cache Metası (artifacts/.../sync_meta/master_json_doc)
    const masterJsonRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'sync_meta', 'master_json_doc');
    await setDoc(
      masterJsonRef,
      {
        products: allProducts,
        customers: allCustomers,
        sales: masterData.sales || [],
        expenses: masterData.expenses || [],
        meta: {
          lastSyncedAt: lastBackupAt,
          versionTag: `v_server_${Date.now()}`,
          source: 'desktop_function_sync',
        },
      },
      { merge: true }
    );

    // c) Ürünleri koleksiyona 400'erli batch'lerle yaz
    for (let i = 0; i < allProducts.length; i += 400) {
      const chunk = allProducts.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const prod of chunk) {
        if (prod.id) {
          const pRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'products', prod.id);
          batch.set(pRef, prod, { merge: true });
        }
      }
      await batch.commit();
    }

    // d) Carileri koleksiyona 400'erli batch'lerle yaz
    for (let i = 0; i < allCustomers.length; i += 400) {
      const chunk = allCustomers.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const cust of chunk) {
        if (cust.id) {
          const cRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'customers', cust.id);
          batch.set(cRef, cust, { merge: true });
        }
      }
      await batch.commit();
    }

    // e) Kök kullanıcı dokümanını güncelle
    try {
      await setDoc(
        userRef,
        {
          productsCount: allProducts.length,
          customersCount: allCustomers.length,
          lastBackupAt,
          lastActiveAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {}

    return NextResponse.json(
      {
        success: true,
        message: `Yetki onaylandı: ${allProducts.length} ürün ve ${allCustomers.length} cari başarıyla veritabanına yazıldı.`,
        productsCount: allProducts.length,
        customersCount: allCustomers.length,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('API /api/sync hatası:', err);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + (err?.message || err) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/sync' }, { status: 200, headers: corsHeaders });
}
