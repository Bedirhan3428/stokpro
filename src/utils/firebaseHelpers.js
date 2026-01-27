import {
  collection,
  addDoc,
  getDocs,
  doc,
  runTransaction,
  getDoc,
  query,
  updateDoc,
  writeBatch,
  deleteDoc,
  where,
  setDoc
} from "firebase/firestore";

import { db, firebaseEnabled, auth } from "../firebase";

const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "";

function ensureDb() {
  if (!firebaseEnabled || !db) throw new Error("Firestore başlatılmadı.");
  if (!ARTIFACT_DOC_ID) throw new Error("Ayar eksik.");
}

function getUidOrThrow() {
  const u = auth.currentUser;
  if (!u) throw new Error("Oturum yok.");
  return u.uid;
}

/* ==========================================================
   1. ÜRÜN YÖNETİMİ (gorselUrl eklendi)
   ========================================================== */

export async function listProductsForCurrentUser() {
  ensureDb();
  const uid = getUidOrThrow();
  const colRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products");
  const snapshot = await getDocs(query(colRef));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Ürün Ekle - İsim nasılsa gorselUrl de öyle
export async function addProduct(product) {
  ensureDb();
  const uid = getUidOrThrow();
  const colRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products");

  // Düz mantık kayıt
  const veri = {
    name: product.name,
    barcode: product.barcode || "",
    category: product.category || "Genel",
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    gorselUrl: product.gorselUrl || "", // Dümdüz string alanı
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(colRef, veri);
  return docRef.id;
}

// Ürün Güncelle
export async function updateProduct(productId, updates) {
  ensureDb();
  const uid = getUidOrThrow();
  const docRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", productId);
  
  // Ne gelirse güncelle (gorselUrl dahil)
  await updateDoc(docRef, { 
    ...updates, 
    updatedAt: new Date().toISOString() 
  });
  return true;
}

export async function deleteProduct(productId) {
  ensureDb();
  const uid = getUidOrThrow();
  const docRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", productId);
  await deleteDoc(docRef);
  return true;
}

/* ==========================================================
   2. MÜŞTERİLER
   ========================================================== */
export async function listCustomers() {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCustomer(customer = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  const ref = await addDoc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers"), {
    name: customer.name || "",
    phone: customer.phone || "",
    createdAt: new Date().toISOString(),
    balance: 0
  });
  return ref.id;
}

export async function getCustomer(customerId) {
  ensureDb();
  const uid = getUidOrThrow();
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listCustomerSales(customerId) {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "sales"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listCustomerPayments(customerId) {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "payments"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCustomerPayment(customerId, { amount = 0, note = "" } = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  return runTransaction(db, async (tx) => {
    const custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
    const custSnap = await tx.get(custRef);
    if (!custSnap.exists()) throw new Error("Müşteri yok.");

    const mevcut = Number(custSnap.data()?.balance || 0);
    const odeme = Number(amount || 0);
    const yeni = mevcut - odeme;

    tx.update(custRef, { balance: yeni, updatedAt: new Date().toISOString() });

    const payRef = doc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "payments"));
    tx.set(payRef, { amount: odeme, note: note || "", createdAt: new Date().toISOString() });

    const ledRef = doc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger"));
    tx.set(ledRef, {
      type: "income",
      amount: odeme,
      description: `Tahsilat: ${custSnap.data()?.name}`,
      lines: [{ account: "Kasa", debit: odeme, credit: 0 }, { account: `AR:${customerId}`, debit: 0, credit: odeme }],
      createdAt: new Date().toISOString()
    });
    return { paymentId: payRef.id };
  });
}

/* ==========================================================
   3. SATIŞ & KASA
   ========================================================== */
export async function finalizeSaleTransaction({ items = [], paymentType = "cash", customerId = null, totals = {} } = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  return runTransaction(db, async (tx) => {
    // Basitleştirilmiş stok düşümü ve satış kaydı
    const saleItems = items.map(it => ({
      productId: it.productId,
      name: it.name,
      qty: it.qty,
      price: it.price
    }));
    
    // Stok düş
    for (const item of items) {
       const pRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", item.productId);
       const pSnap = await tx.get(pRef);
       if (pSnap.exists()) {
         const oldStock = Number(pSnap.data().stock || 0);
         tx.update(pRef, { stock: oldStock - item.qty });
       }
    }

    const total = Number(totals.total || 0);
    const saleRef = doc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales"));
    
    tx.set(saleRef, {
      items: saleItems,
      saleType: paymentType,
      customerId: customerId || null,
      totals: { total },
      createdAt: new Date().toISOString()
    });

    // Veresiye ise bakiye güncelle
    if (paymentType === "credit" && customerId) {
      const cRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
      const cSnap = await tx.get(cRef);
      if (cSnap.exists()) {
        tx.update(cRef, { balance: Number(cSnap.data().balance || 0) + total });
      }
    }
    return { saleId: saleRef.id };
  });
}

export async function listSales() {
  ensureDb();
  const uid = getUidOrThrow();
  const snap = await getDocs(query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listRecentSales() {
  const all = await listSales();
  return all.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0, 100);
}

export async function listLedger() {
  ensureDb();
  const uid = getUidOrThrow();
  const snap = await getDocs(query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addLedgerEntry(entry) {
  ensureDb();
  const uid = getUidOrThrow();
  const ref = await addDoc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger"), {
    ...entry, createdAt: new Date().toISOString()
  });
  return ref.id;
}

// Helper exports
export async function updateSale(id, data) {
  const uid = getUidOrThrow();
  await updateDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales", id), data);
  return true;
}
export async function deleteSale(id) {
  const uid = getUidOrThrow();
  await deleteDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales", id));
  return true;
}
export async function updateLedgerEntry(id, data) {
  const uid = getUidOrThrow();
  await updateDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger", id), data);
  return true;
}
export async function deleteLedgerEntry(id) {
  const uid = getUidOrThrow();
  await deleteDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger", id));
  return true;
}
export async function updateCustomer(id, data) {
  const uid = getUidOrThrow();
  await updateDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", id), data);
  return true;
}
export async function setCustomerBalance(id, bal) {
  const uid = getUidOrThrow();
  await updateDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", id), { balance: Number(bal) });
  return true;
}
export async function deleteCustomer(id) {
  const uid = getUidOrThrow();
  await deleteDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", id));
  return true;
}

/* ==========================================================
   4. LEGACY/PROFILE
   ========================================================== */
export async function listLegacyIncomes() { return []; }
export async function listLegacyExpenses() { return []; }
export async function listLegacySales() { return []; }
export async function updateLegacyDocument() { return true; }
export async function deleteLegacyDocument() { return true; }
export async function addLegacyIncome() { return {}; }
export async function addLegacyExpense() { return {}; }

export async function createUserProfile(p) {
  const uid = getUidOrThrow();
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
  await setDoc(ref, p);
  return { id: "user_doc" };
}
export async function getUserProfile() {
  const uid = auth.currentUser?.uid;
  if(!uid) return null;
  const snap = await getDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc"));
  return snap.exists() ? snap.data() : null;
}
export async function updateUserProfile(uid, d) {
  await updateDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc"), d);
  return true;
}

const firebaseHelpers = {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct,
  listCustomers,
  addCustomer,
  getCustomer,
  listCustomerSales,
  listCustomerPayments,
  addCustomerPayment,
  updateCustomer,
  setCustomerBalance,
  deleteCustomer,
  finalizeSaleTransaction,
  listLedger,
  listSales,
  listRecentSales,
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  updateSale,
  deleteSale,
  listLegacyIncomes,
  listLegacyExpenses,
  listLegacySales,
  addLegacyIncome,
  addLegacyExpense,
  updateLegacyDocument,
  deleteLegacyDocument,
  createUserProfile,
  getUserProfile,
  updateUserProfile
};
export default firebaseHelpers;