/**
 * StokPro Akıllı Master Veri Önbelleği & Arka Plan Senkronizasyon Motoru (Master Data Cache)
 * 
 * Bu modül, uygulamanın TÜM verilerini (Stok/Ürünler, Satışlar, Muhasebe, Giderler,
 * Müşteriler, Tahsilatlar, Ek Gelirler ve Profil) TEK BİR SEFERDE tarayıcının 
 * yerel deposuna (LocalStorage / Memory Cache) kaydeder.
 * 
 * Mimari:
 * 1. Sayfa Geçişleri (0ms Işık Hızında): Sayfa ve modül geçişlerinde ASLA ağ beklenmez.
 *    Veri anında yerel bellekten / LocalStorage'dan 0ms'de sunulur.
 * 2. Değişiklik Anı (0ms Instant Write): Kullanıcı veri girdiğinde anında LocalStorage'a 0ms'de
 *    yazılır ve Firebase'e arka planda işlenir.
 * 3. Arka Plan Gecikmeli Senkronizasyon (3 Saniye Sonra): İşlemden birkaç saniye sonra
 *    sunucudan veriler sessizce çekilerek LocalStorage ve Master JSON dokümanı güncellenir.
 */

import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  listSales,
  listLedger,
  listCustomers,
  listCustomerPayments,
  listLegacyIncomes,
  listLegacyExpenses,
  getUserProfile
} from "./firebaseHelpers";
import { listProductsForCurrentUser } from "./artifactUserProducts";

const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

// BELLEK İÇİ ANLIK CACHE (MEMORY CACHE)
let memoryStore = null;
let listeners = new Set();
let delayedSyncTimer = null;

function getCacheKey(uid) {
  return `stokpro_master_store_v2_${uid}`;
}

/**
 * Tarayıcı yerel deposundan veriyi anında okur (0ms delay)
 */
export function readLocalStorage(uid) {
  if (typeof window === "undefined" || !uid) return null;
  try {
    const raw = localStorage.getItem(getCacheKey(uid));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("LocalStorage okuma hatası:", e);
    return null;
  }
}

/**
 * Tarayıcı yerel deposuna veriyi kaydeder
 */
export function writeLocalStorage(uid, data) {
  if (typeof window === "undefined" || !uid) return;
  try {
    localStorage.setItem(getCacheKey(uid), JSON.stringify(data));
  } catch (e) {
    console.error("LocalStorage yazma hatası:", e);
  }
}

/**
 * Tarayıcı yerel deposundaki (LocalStorage) veriyi ANINDA VE DİREKT olarak 0ms'de güncelleyen fonksiyon.
 */
export function updateLocalStorageDirectly(updaterFn) {
  const user = auth.currentUser;
  const uid = user?.uid;
  if (typeof window === "undefined") return null;

  let current = memoryStore;
  if (!current && uid) {
    current = readLocalStorage(uid);
  }
  if (!current) {
    current = { products: [], sales: [], customers: [], custPayments: [], incomes: [], expenses: [], ledger: [], profile: null, meta: {} };
  }

  try {
    const cloned = JSON.parse(JSON.stringify(current));
    const updated = updaterFn(cloned);
    if (updated) {
      updated.meta = { ...updated.meta, lastSyncedAt: new Date().toISOString() };
      memoryStore = updated;
      if (uid) {
        writeLocalStorage(uid, updated);
      }
      notifyListeners();
      
      // BİRKAÇ SANİYE SONRA ARKA PLANDA SUNUCUDAN VERİYİ ÇEK VE JSON'U GÜNCELLE
      scheduleDelayedServerSync(3200);
      return updated;
    }
  } catch (e) {
    console.error("Direct LocalStorage güncelleme hatası:", e);
  }
  return memoryStore;
}

/**
 * Firebase güncellenirken aynı anda MASTER JSON belgesini de Firestore'a yazan fonksiyon.
 */
export async function updateMasterJsonDocInFirebase(customStore = null) {
  const user = auth.currentUser;
  const uid = user?.uid;
  if (!uid) return;

  try {
    const store = customStore || memoryStore || readLocalStorage(uid);
    if (!store) return;

    const masterJsonRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sync_meta", "master_json_doc");
    const versionRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sync_meta", "version_doc");

    const versionTag = `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const payload = {
      products: store.products || [],
      sales: store.sales || [],
      customers: store.customers || [],
      custPayments: store.custPayments || [],
      incomes: store.incomes || [],
      expenses: store.expenses || [],
      ledger: store.ledger || [],
      profile: store.profile || null,
      meta: {
        versionTag,
        updatedAt: new Date().toISOString()
      }
    };

    await setDoc(masterJsonRef, payload, { merge: true });
    await setDoc(versionRef, { versionTag, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("Master JSON Firestore güncelleme uyarısı:", err);
  }
}

/**
 * Birkaç saniye sonra arka planda sunucudan verileri çekip LocalStorage ve JSON'u güncelleyen zamanlayıcı
 */
export function scheduleDelayedServerSync(delayMs = 3200) {
  if (delayedSyncTimer) clearTimeout(delayedSyncTimer);
  delayedSyncTimer = setTimeout(() => {
    fetchFreshServerDataAndUpdateLocalStorage().catch(() => {});
  }, delayMs);
}

/**
 * Sunucudan tüm taze verileri arka planda çekip LocalStorage & JSON dokümanını güncelleyen fonksiyon
 */
async function fetchFreshServerDataAndUpdateLocalStorage() {
  const user = auth.currentUser;
  const uid = user?.uid;
  if (!uid) return;

  try {
    const [
      products,
      sales,
      customers,
      incomes,
      expenses,
      ledger,
      profile
    ] = await Promise.all([
      listProductsForCurrentUser().catch(() => []),
      listSales().catch(() => []),
      listCustomers().catch(() => []),
      listLegacyIncomes().catch(() => []),
      listLegacyExpenses().catch(() => []),
      listLedger().catch(() => []),
      getUserProfile().catch(() => null)
    ]);

    let custPayments = [];
    if (Array.isArray(customers) && customers.length > 0) {
      try {
        const payPromises = customers.map(c => listCustomerPayments(c.id).catch(() => []));
        const payResults = await Promise.all(payPromises);
        custPayments = payResults.flat();
      } catch { custPayments = []; }
    }

    const newVersionTag = `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newStore = {
      products,
      sales,
      customers,
      custPayments,
      incomes,
      expenses,
      ledger,
      profile,
      meta: {
        versionTag: newVersionTag,
        lastSyncedAt: new Date().toISOString(),
        isCached: true
      }
    };

    memoryStore = newStore;
    writeLocalStorage(uid, newStore);

    // Master JSON belgesini de sunucuda güncelle
    updateMasterJsonDocInFirebase(newStore).catch(() => {});

    notifyListeners();
  } catch (err) {
    console.warn("Arka plan sunucu güncelleme uyarısı:", err);
  }
}

/**
 * Tüm Uygulama Verisini Tek Seferde Senkronize Eden Ana Fonksiyon
 * @param {boolean} force - Zorla sunucudan çekilmesini sağlayan bayrak
 */
export async function syncFullMasterStore(force = false) {
  const user = auth.currentUser;
  const uid = user?.uid;
  
  if (!uid) {
    return memoryStore || {
      products: [], sales: [], customers: [], custPayments: [], incomes: [], expenses: [], ledger: [], profile: null, meta: {}
    };
  }

  // 1. Önce Bellek veya LocalStorage'dan anında 0ms döndür (SAYFA GEÇİŞLERİ İŞIK HIZINDA)
  if (!memoryStore) {
    const local = readLocalStorage(uid);
    if (local) {
      memoryStore = local;
      notifyListeners();
    }
  }

  if (memoryStore && !force) {
    // Arka planda birkaç saniye sonra sunucudan güncelle
    scheduleDelayedServerSync(4000);
    return memoryStore;
  }

  // 2. Zorlamalı senkronizasyon istenmişse sunucudan çek
  await fetchFreshServerDataAndUpdateLocalStorage();
  return memoryStore;
}

/**
 * Herhangi bir Ekleme/Silme/Güncelleme işleminden sonra önbelleği ve sunucuyu tetikleyen fonksiyon
 */
export async function invalidateAndRefreshMasterCache() {
  scheduleDelayedServerSync(1000);
  return memoryStore;
}

/**
 * Anlık Bellekteki Master Veri Snapshot'ı (0ms Hızlı Açılış)
 */
export function getMasterStoreSnapshot() {
  if (!memoryStore) {
    const uid = auth.currentUser?.uid;
    if (uid) memoryStore = readLocalStorage(uid);
  }
  return memoryStore || {
    products: [], sales: [], customers: [], custPayments: [], incomes: [], expenses: [], ledger: [], profile: null, meta: {}
  };
}

/**
 * Optimistic Güncelleme Fonksiyonu (Yerel Depoyu Anında 0ms'de Yeniler)
 */
export function updateMemoryStoreOptimistically(updaterFn) {
  return updateLocalStorageDirectly(updaterFn);
}

/**
 * React Bileşenleri İçin Veri Değişim Abonesi (Subscriber)
 */
export function subscribeToMasterStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach(fn => {
    try { fn(memoryStore); } catch (e) { console.error(e); }
  });
}
