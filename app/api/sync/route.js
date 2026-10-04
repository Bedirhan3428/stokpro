import { NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { doc, getDoc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
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
    const {
      uid,
      keyHash,
      masterData,
      deletedProductIds = [],
      deletedCustomerIds = [],
    } = body || {};

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

    const pData = pSnap && pSnap.exists() ? pSnap.data() : null;
    const uData = uSnap && uSnap.exists() ? uSnap.data() : null;

    let isAuthorized = false;

    // Hash Kontrolü (terminalKeyHash veya productKeyHash)
    if (pData?.terminalKeyHash && pData.terminalKeyHash === keyHash) {
      isAuthorized = true;
    } else if (uData?.terminalKeyHash && uData.terminalKeyHash === keyHash) {
      isAuthorized = true;
    } else if (pData?.productKeyHash && pData.productKeyHash === keyHash) {
      isAuthorized = true;
    } else if (uData?.productKeyHash && uData.productKeyHash === keyHash) {
      isAuthorized = true;
    } else if (keyHash === hashKeySync(uid)) {
      // UID tabanlı acil durum eşleşmesi
      isAuthorized = true;
    } else if (pData?.terminalKey) {
      try {
        if (hashKeySync(pData.terminalKey) === keyHash) isAuthorized = true;
      } catch {}
    } else if (uData?.terminalKey) {
      try {
        if (hashKeySync(uData.terminalKey) === keyHash) isAuthorized = true;
      } catch {}
    }

    // 2. YETKİ DENETİMİ
    if (!isAuthorized) {
      console.warn(`Yetkisiz senkronizasyon denemesi: UID ${uid}`);
      return NextResponse.json(
        { error: "Yetki reddedildi: Terminal anahtar hash'i eşleşmedi." },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. ÇİFT YÖNLÜ AKILLI SENKRONİZASYON (TWO-WAY SMART MERGE)
    const allProducts = Array.isArray(masterData.products) ? masterData.products : [];
    const allCustomers = Array.isArray(masterData.customers) ? masterData.customers : [];
    const lastBackupAt = masterData.lastBackupAt || new Date().toISOString();

    const incomingProductIds = new Set(allProducts.map((p) => String(p.id)).filter(Boolean));
    const deletedProductIdsSet = new Set((deletedProductIds || []).map(String));
    const incomingCustomerIds = new Set(allCustomers.map((c) => String(c.id)).filter(Boolean));
    const deletedCustomerIdsSet = new Set((deletedCustomerIds || []).map(String));

    const newFromCloudProducts = [];
    const newFromCloudCustomers = [];
    const deletedOnCloudProductIds = [];
    const deletedOnCloudCustomerIds = [];

    // A) Ürünler Koleksiyonunu Oku ve İki Yönlü Karşılaştır
    try {
      const prodCollRef = collection(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'products');
      const existingProdsSnap = await getDocs(prodCollRef);

      if (!existingProdsSnap.empty) {
        let delBatch = writeBatch(db);
        let delCount = 0;

        for (const docSnap of existingProdsSnap.docs) {
          const docId = docSnap.id;
          const data = docSnap.data() || {};

          if (deletedProductIdsSet.has(docId)) {
            // Masaüstünden silinmiş ürün -> Firestore'dan kaldır
            delBatch.delete(docSnap.ref);
            delCount++;
            if (delCount >= 300) {
              await delBatch.commit();
              delBatch = writeBatch(db);
              delCount = 0;
            }
          } else if (!incomingProductIds.has(docId)) {
            // Masaüstünde yok VE masaüstü silmemiş:
            if (data.isActive === false || data.deletedAt) {
              // Web'den silinmiş! Masaüstüne bildir
              deletedOnCloudProductIds.push(docId);
            } else {
              // Web'den YENİ EKLENMİŞ! Silme, masaüstüne aktarmak için topla
              newFromCloudProducts.push({ id: docId, ...data });
            }
          }
        }

        if (delCount > 0) {
          await delBatch.commit();
        }
      }
    } catch (err) {
      console.warn('Ürün senkronizasyon tarama uyarısı:', err);
    }

    // B) Cariler Koleksiyonunu Oku ve İki Yönlü Karşılaştır
    try {
      const custCollRef = collection(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'customers');
      const existingCustsSnap = await getDocs(custCollRef);

      if (!existingCustsSnap.empty) {
        let delBatch = writeBatch(db);
        let delCount = 0;

        for (const docSnap of existingCustsSnap.docs) {
          const docId = docSnap.id;
          const data = docSnap.data() || {};

          if (deletedCustomerIdsSet.has(docId)) {
            // Masaüstünden silinmiş cari -> Firestore'dan kaldır
            delBatch.delete(docSnap.ref);
            delCount++;
            if (delCount >= 300) {
              await delBatch.commit();
              delBatch = writeBatch(db);
              delCount = 0;
            }
          } else if (!incomingCustomerIds.has(docId)) {
            // Masaüstünde yok VE masaüstü silmemiş:
            if (data.isActive === false || data.deletedAt) {
              deletedOnCloudCustomerIds.push(docId);
            } else {
              // Web'den YENİ EKLENMİŞ cari! Masaüstüne aktarmak için topla
              newFromCloudCustomers.push({ id: docId, ...data });
            }
          }
        }

        if (delCount > 0) {
          await delBatch.commit();
        }
      }
    } catch (err) {
      console.warn('Cari senkronizasyon tarama uyarısı:', err);
    }

    // C) Masaüstünden Gelen Güncel Ürünleri Yaz
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

    // D) Masaüstünden Gelen Güncel Carileri Yaz
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

    // E) Master Dokümanlar (Tüm aktif ürünler = allProducts + newFromCloudProducts)
    const combinedProducts = [...allProducts, ...newFromCloudProducts];
    const combinedCustomers = [...allCustomers, ...newFromCloudCustomers];
    const activeProductsCount = combinedProducts.filter((p) => p.isActive !== false && !p.deletedAt).length;
    const activeCustomersCount = combinedCustomers.filter((c) => c.isActive !== false && !c.deletedAt).length;

    // 1. master_backup dokümanı
    const masterBackupRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'master_backup', 'latest');
    await setDoc(
      masterBackupRef,
      {
        lastBackupAt,
        appVersion: masterData.appVersion || '1.0.0',
        productsCount: activeProductsCount,
        customersCount: activeCustomersCount,
        salesCount: masterData.sales?.length || 0,
        expensesCount: masterData.expenses?.length || 0,
        masterJsonString: JSON.stringify({
          ...masterData,
          products: combinedProducts,
          customers: combinedCustomers,
        }),
      },
      { merge: true }
    );

    // 2. master_json_doc dokümanı (web 0ms cache)
    const masterJsonRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'sync_meta', 'master_json_doc');
    await setDoc(
      masterJsonRef,
      {
        products: combinedProducts,
        customers: combinedCustomers,
        sales: masterData.sales || [],
        expenses: masterData.expenses || [],
        meta: {
          lastSyncedAt: lastBackupAt,
          versionTag: `v_server_${Date.now()}`,
          source: 'two_way_smart_sync',
        },
      },
      { merge: true }
    );

    // 3. version_doc (web cache invalidation)
    try {
      const versionRef = doc(db, 'artifacts', ARTIFACT_DOC_ID, 'users', uid, 'sync_meta', 'version_doc');
      await setDoc(versionRef, { versionTag: `v_${Date.now()}`, updatedAt: new Date().toISOString() }, { merge: true });
    } catch {}

    // 4. user root doc
    try {
      await setDoc(
        userRef,
        {
          productsCount: activeProductsCount,
          customersCount: activeCustomersCount,
          lastBackupAt,
          lastActiveAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {}

    return NextResponse.json(
      {
        success: true,
        message: `Çift yönlü senkronizasyon başarılı (${combinedProducts.length} ürün, ${combinedCustomers.length} cari eşleştirildi).`,
        productsCount: combinedProducts.length,
        customersCount: combinedCustomers.length,
        newFromCloud: {
          products: newFromCloudProducts,
          customers: newFromCloudCustomers,
        },
        deletedOnCloud: {
          productIds: deletedOnCloudProductIds,
          customerIds: deletedOnCloudCustomerIds,
        },
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
