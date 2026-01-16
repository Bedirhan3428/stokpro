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
  // limit ve orderBy buradan silindi
} from "firebase/firestore";

import { db, firebaseEnabled, auth } from "../firebase";

const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "";
const LEGACY_ARTIFACT_DOC_ID =
  process.env.REACT_APP_FIREBASE_LEGACY_ARTIFACT ||
  process.env.REACT_APP_FIREBASE_LEGACY_ARTIFACT_ID ||
  "";

/* ---------- Guards ---------- */
function ensureDb() {
  if (!firebaseEnabled || !db) throw new Error("Firestore başlatılmadı.");
  if (!ARTIFACT_DOC_ID) throw new Error("REACT_APP_FIREBASE_ARTIFACTS_COLLECTION tanımlı değil.");
}

function getUidOrThrow() {
  const u = auth.currentUser;
  if (!u) throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
  return u.uid;
}

/* ---------- Helpers ---------- */
async function readArtifactCollection(artifactId, pathSegments) {
  const colRef = collection(db, "artifacts", artifactId, ...pathSegments);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ------------------ CUSTOMERS ------------------ */
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
    name: String(customer.name || ""),
    phone: customer.phone ? String(customer.phone) : null,
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

/* Tahsilat ekleme (transaction) */
export async function addCustomerPayment(customerId, { amount = 0, note = "" } = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId gerekli.");

  return runTransaction(db, async (tx) => {
    const custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
    const custSnap = await tx.get(custRef);
    if (!custSnap.exists()) throw new Error("Müşteri bulunamadı.");

    const mevcutBakiye = Number(custSnap.data()?.balance || 0);
    const odeme = Number(amount || 0);
    if (isNaN(odeme) || odeme <= 0) throw new Error("Geçerli bir tutar girin.");
    if (mevcutBakiye <= 0) throw new Error("Müşterinin borcu yok.");
    if (odeme > mevcutBakiye) throw new Error(`Ödeme bakiyeyi aşamaz (${mevcutBakiye}).`);

    const yeniBakiye = mevcutBakiye - odeme;
    tx.update(custRef, { balance: yeniBakiye, updatedAt: new Date().toISOString() });

    const paymentsCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "payments");
    const paymentRef = doc(paymentsCol);
    tx.set(paymentRef, {
      amount: odeme,
      note: String(note || ""),
      createdAt: new Date().toISOString()
    });

    const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
    const ledgerRef = doc(ledgerCol);
    const musteriAdi = custSnap.data()?.name || customerId;
    tx.set(ledgerRef, {
      type: "income",
      amount: odeme,
      description: `Müşteri ödemesi (${musteriAdi})`,
      lines: [
        { account: "Kasa", debit: odeme, credit: 0 },
        { account: `AR:${customerId}`, debit: 0, credit: odeme }
      ],
      createdAt: new Date().toISOString()
    });

    return { paymentId: paymentRef.id, newBalance: yeniBakiye };
  });
}

/* ------------------ SATIŞ TAMAMLAMA ------------------ */
export async function finalizeSaleTransaction({ items = [], paymentType = "cash", customerId = null, totals = {} } = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!Array.isArray(items) || items.length === 0) throw new Error("Sepet boş.");

  return runTransaction(db, async (tx) => {
    const productRefs = items.map((it) => doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", it.productId));
    const productSnaps = [];
    // Promise.all kullanarak paralel okuma yapıyoruz, bu kısım iyi.
    for (const pref of productRefs) productSnaps.push(await tx.get(pref));

    let custRef = null;
    let custSnap = null;
    let customerName = null;
    if (paymentType === "credit" && customerId) {
      custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
      custSnap = await tx.get(custRef);
      if (!custSnap.exists()) throw new Error("Veresiye satış için müşteri bulunamadı.");
      customerName = custSnap.data()?.name || null;
    }

    // Stok kontrolleri
    productSnaps.forEach((pSnap, i) => {
      if (!pSnap.exists()) throw new Error(`Ürün bulunamadı: ${items[i].productId}`);
      const stok = Number(pSnap.data().stock || 0);
      if (stok < items[i].qty) throw new Error(`Yetersiz stok: ${pSnap.data().name || items[i].productId}`);
    });

    // Stok güncellemeleri
    productSnaps.forEach((pSnap, i) => {
      const stok = Number(pSnap.data().stock || 0);
      tx.update(productRefs[i], { stock: stok - items[i].qty, updatedAt: new Date().toISOString() });
    });

    const saleRef = doc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales"));
    const saleItems = items.map((it) => ({
      productId: it.productId,
      name: it.name || null,
      qty: it.qty,
      price: it.price
    }));
    const hesaplananToplam = saleItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 0)), 0);
    const gelenToplam = totals?.total ?? totals?.subtotal ?? totals?.amount ?? null;
    const toplamTutar = Number(gelenToplam ?? hesaplananToplam ?? 0);

    // Satış belgesi
    tx.set(saleRef, {
      items: saleItems,
      saleType: paymentType,
      customerId: customerId || null,
      customerName: customerName || null,
      totals: { total: toplamTutar },
      createdAt: new Date().toISOString()
    });

    // Veresiye ise müşteri güncellemesi
    if (paymentType === "credit" && customerId && custRef && custSnap) {
      const mevcut = Number(custSnap.data()?.balance || 0);
      tx.update(custRef, { balance: mevcut + toplamTutar, updatedAt: new Date().toISOString() });

      const custSalesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "sales");
      const custSaleRef = doc(custSalesCol);
      tx.set(custSaleRef, {
        saleId: saleRef.id,
        customerName: customerName || null,
        items: saleItems,
        totals: { total: toplamTutar },
        saleType: paymentType,
        createdAt: new Date().toISOString()
      });
    }

    try {
      const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
      const ledgerRef = doc(ledgerCol);
      const lines = [];
      if (paymentType === "cash") lines.push({ account: "Kasa", debit: toplamTutar, credit: 0 });
      else if (paymentType === "credit") lines.push({ account: `AR:${customerId}`, debit: toplamTutar, credit: 0 });
      else lines.push({ account: "Kasa", debit: toplamTutar, credit: 0 });
      lines.push({ account: "Satış Geliri", debit: 0, credit: toplamTutar });

      const desc = paymentType === "credit"
        ? `Satış (Veresiye${customerName ? ` - ${customerName}` : ""})`
        : "Satış (Nakit)";

      tx.set(ledgerRef, {
        description: desc,
        lines,
        createdAt: new Date().toISOString()
      });
    } catch {
      /* ledger yazılamazsa işlemi durdurma */
    }

    return { saleId: saleRef.id };
  });
}

/* ------------------ OKUMALAR ------------------ */
export async function listSales() {
  ensureDb();
  const uid = getUidOrThrow();
  // DİKKAT: Bu fonksiyon tüm satışları çeker. Çok veri varsa yavaşlar.
  // Mümkünse listRecentSales kullanın.
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Performans için limitli satış çekme
export async function listRecentSales(limitCount = 100) {
  ensureDb();
  const uid = getUidOrThrow();
  const salesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales");
  
  // Eğer tarih alanı "createdAt" string ISO ise orderBy string çalışır.
  // Ancak en sağlıklısı memoryde sıralamaktır eğer index sorunu varsa.
  // Index oluşturduysan: query(salesCol, orderBy("createdAt", "desc"), limit(limitCount));
  // Şimdilik index hatası vermemesi için düz çekip sort ediyoruz ama limit koyamıyoruz (Firestore limitations without index)
  // Eğer index varsa aşağıdakini açabilirsin.
  // const q = query(salesCol, orderBy("createdAt", "desc"), limit(limitCount));
  
  // Güvenli yöntem (Index gerektirmez ama tüm docs okur, o yüzden manuel limitliyoruz):
  const q = query(salesCol); // Index varsa buraya orderBy eklenebilir.
  const snap = await getDocs(q);
  
  let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  
  return results.slice(0, Number(limitCount || 100));
}

export async function listLedger() {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* Genel muhasebe girişleri */
export async function addLedgerEntry(entry = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  const ref = await addDoc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger"), {
    type: entry.type || "income",
    description: entry.description || "",
    amount: Number(entry.amount || 0),
    createdAt: new Date().toISOString()
  });
  return ref.id;
}

/* ------------------ GÜNCELLE / SİL ------------------ */
export async function updateSale(saleId, updates = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!saleId) throw new Error("saleId gerekli.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales", saleId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
  return true;
}

export async function deleteSale(saleId) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!saleId) throw new Error("saleId gerekli.");

  const saleRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales", saleId);
  await deleteDoc(saleRef);

  const customersCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers");
  const custSnap = await getDocs(customersCol);
  for (const c of custSnap.docs) {
    const custSalesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", c.id, "sales");
    const q2 = query(custSalesCol, where("saleId", "==", saleId));
    const snap2 = await getDocs(q2);
    for (const sdoc of snap2.docs) {
      await deleteDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", c.id, "sales", sdoc.id));
    }
  }
  return true;
}

export async function updateLedgerEntry(ledgerId, updates = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!ledgerId) throw new Error("ledgerId gerekli.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger", ledgerId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
  return true;
}

export async function deleteLedgerEntry(ledgerId) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!ledgerId) throw new Error("ledgerId gerekli.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger", ledgerId);
  await deleteDoc(ref);
  return true;
}

/* ------------------ MÜŞTERİ BAKİYE / SİLME ------------------ */
export async function updateCustomer(customerId, updates = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId gerekli.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
  const toUpdate = {
    ...(typeof updates.name !== "undefined" ? { name: String(updates.name || "") } : {}),
    ...(typeof updates.phone !== "undefined" ? { phone: updates.phone ? String(updates.phone) : null } : {}),
    updatedAt: new Date().toISOString()
  };
  await updateDoc(ref, toUpdate);
  return true;
}

export async function setCustomerBalance(customerId, newBalance, note = "") {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId gerekli.");

  return runTransaction(db, async (tx) => {
    const custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
    const custSnap = await tx.get(custRef);
    if (!custSnap.exists()) throw new Error("Müşteri bulunamadı.");

    const mevcut = Number(custSnap.data()?.balance || 0);
    const hedef = Number(newBalance || 0);
    const fark = hedef - mevcut;

    tx.update(custRef, { balance: hedef, updatedAt: new Date().toISOString() });

    if (fark < 0) {
      const tutar = Math.abs(fark);
      const paymentsCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "payments");
      tx.set(doc(paymentsCol), {
        amount: tutar,
        note: `Manuel bakiye düşümü: ${note || ""}`,
        createdAt: new Date().toISOString()
      });

      const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
      tx.set(doc(ledgerCol), {
        description: `Manuel ödeme: ${custSnap.data()?.name || customerId} (${note || ""})`,
        lines: [
          { account: "Kasa", debit: tutar, credit: 0 },
          { account: `AR:${customerId}`, debit: 0, credit: tutar }
        ],
        createdAt: new Date().toISOString()
      });
    } else if (fark > 0) {
      const adjCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "adjustments");
      tx.set(doc(adjCol), {
        amount: fark,
        note: `Manuel bakiye artışı: ${note || ""}`,
        createdAt: new Date().toISOString()
      });

      const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
      tx.set(doc(ledgerCol), {
        description: `Manuel bakiye artışı: ${custSnap.data()?.name || customerId} (${note || ""})`,
        lines: [
          { account: `AR:${customerId}`, debit: fark, credit: 0 },
          { account: "Satış Geliri", debit: 0, credit: fark }
        ],
        createdAt: new Date().toISOString()
      });
    }

    return { oldBalance: mevcut, newBalance: hedef };
  });
}

export async function deleteCustomer(customerId) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId gerekli.");

  async function deleteCollectionDocs(pathSegments) {
    const colRef = collection(db, ...pathSegments);
    const snap = await getDocs(colRef);
    if (snap.empty) return 0;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(doc(db, ...pathSegments, d.id)));
    await batch.commit();
    return snap.size;
  }

  const base = ["artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId];
  await deleteCollectionDocs([...base, "payments"]);
  await deleteCollectionDocs([...base, "sales"]);
  await deleteCollectionDocs([...base, "adjustments"]);

  await deleteDoc(doc(db, ...base));
  return true;
}

/* ------------------ LEGACY OKUMA ------------------ */
const CANDIDATE_PATHS_FOR = {
  incomes: [
    (uid) => ["users", uid, "incomes"],
    () => ["incomes"],
    (uid) => ["users", uid, "finance", "incomes"],
    () => ["finance", "incomes"]
  ],
  expenses: [
    (uid) => ["users", uid, "expenses"],
    () => ["expenses"],
    (uid) => ["users", uid, "finance", "expenses"],
    () => ["finance", "expenses"]
  ],
  sales: [
    (uid) => ["users", uid, "sales"],
    () => ["sales"],
    (uid) => ["users", uid, "orders"],
    () => ["orders"],
    (uid) => ["users", uid, "history", "sales"],
    () => ["history", "sales"]
  ]
};

async function tryPathsAndCollect(artifactId, uid, colName) {
  const results = [];
  const tried = new Set();
  const candidates = CANDIDATE_PATHS_FOR[colName] || [];
  for (const pathFn of candidates) {
    const pathSegments = pathFn(uid);
    const key = pathSegments.join("/");
    if (tried.has(key)) continue;
    tried.add(key);
    try {
      const docs = await readArtifactCollection(artifactId, pathSegments);
      docs.forEach((d) => results.push({ ...d, sourceArtifact: artifactId, sourcePath: key }));
    } catch {
      /* yoksa geç */
    }
  }
  return results;
}

function uniqByIdAndPath(items) {
  const map = new Map();
  for (const it of items) {
    const key = `${it.id}::${it.sourcePath}::${it.sourceArtifact}`;
    if (!map.has(key)) map.set(key, it);
  }
  return Array.from(map.values());
}

export async function listLegacyIncomes(forUid = null, artifactIdOverride = null) {
  ensureDb();
  const uid = forUid || getUidOrThrow();
  const artifactIds = artifactIdOverride
    ? [artifactIdOverride]
    : [ARTIFACT_DOC_ID].concat(LEGACY_ARTIFACT_DOC_ID && LEGACY_ARTIFACT_DOC_ID !== ARTIFACT_DOC_ID ? [LEGACY_ARTIFACT_DOC_ID] : []);
  let merged = [];
  for (const aid of artifactIds) merged.push(...(await tryPathsAndCollect(aid, uid, "incomes")).flat());
  merged = uniqByIdAndPath(merged);
  merged.sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
  return merged;
}

export async function listLegacyExpenses(forUid = null, artifactIdOverride = null) {
  ensureDb();
  const uid = forUid || getUidOrThrow();
  const artifactIds = artifactIdOverride
    ? [artifactIdOverride]
    : [ARTIFACT_DOC_ID].concat(LEGACY_ARTIFACT_DOC_ID && LEGACY_ARTIFACT_DOC_ID !== ARTIFACT_DOC_ID ? [LEGACY_ARTIFACT_DOC_ID] : []);
  let merged = [];
  for (const aid of artifactIds) merged.push(...(await tryPathsAndCollect(aid, uid, "expenses")).flat());
  merged = uniqByIdAndPath(merged);
  merged.sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
  return merged;
}

export async function listLegacySales(forUid = null, artifactIdOverride = null) {
  ensureDb();
  const uid = forUid || getUidOrThrow();
  const artifactIds = artifactIdOverride
    ? [artifactIdOverride]
    : [ARTIFACT_DOC_ID].concat(LEGACY_ARTIFACT_DOC_ID && LEGACY_ARTIFACT_DOC_ID !== ARTIFACT_DOC_ID ? [LEGACY_ARTIFACT_DOC_ID] : []);
  let merged = [];
  for (const aid of artifactIds) merged.push(...(await tryPathsAndCollect(aid, uid, "sales")).flat());
  merged = uniqByIdAndPath(merged);
  merged.sort((a, b) => new Date(b.createdAt || b.date || b.created_at || 0).getTime() - new Date(a.createdAt || a.date || a.created_at || 0).getTime());
  return merged;
}

/* ------------------ LEGACY GÜNCELLE / SİL ------------------ */
export async function updateLegacyDocument(sourceArtifact, sourcePath, docId, updates = {}) {
  ensureDb();
  if (!sourceArtifact || !sourcePath || !docId) throw new Error("Eksik parametre.");
  const pathSegments = Array.isArray(sourcePath) ? sourcePath : String(sourcePath).split("/").filter(Boolean);
  const ref = doc(db, "artifacts", sourceArtifact, ...pathSegments, docId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
  return true;
}

export async function deleteLegacyDocument(sourceArtifact, sourcePath, docId) {
  ensureDb();
  if (!sourceArtifact || !sourcePath || !docId) throw new Error("Eksik parametre.");
  const pathSegments = Array.isArray(sourcePath) ? sourcePath : String(sourcePath).split("/").filter(Boolean);
  await deleteDoc(doc(db, "artifacts", sourceArtifact, ...pathSegments, docId));
  return true;
}

/* ------------------ LEGACY GELİR/GİDER (PRIMARY) ------------------ */
export async function addLegacyIncome({ amount = 0, description = "" } = {}, forUid = null) {
  ensureDb();
  const uid = forUid || getUidOrThrow();
  const a = Number(amount || 0);
  if (isNaN(a) || a <= 0) throw new Error("Geçerli tutar girin.");
  const ref = await addDoc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "incomes"), {
    amount: a,
    description: String(description || ""),
    createdAt: new Date().toISOString()
  });
  return { id: ref.id };
}

export async function addLegacyExpense({ amount = 0, description = "" } = {}, forUid = null) {
  ensureDb();
  const uid = forUid || getUidOrThrow();
  const a = Number(amount || 0);
  if (isNaN(a) || a <= 0) throw new Error("Geçerli tutar girin.");
  const ref = await addDoc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "expenses"), {
    amount: a,
    description: String(description || ""),
    createdAt: new Date().toISOString()
  });
  return { id: ref.id };
}

/* ------------------ PROFİL ------------------ */
export async function createUserProfile(profile = {}, targetUid = null) {
  ensureDb();
  const uid = targetUid || getUidOrThrow();
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
  await setDoc(ref, {
    name: profile.name ? String(profile.name) : "",
    email: profile.email ? String(profile.email) : null,
    createdAt: new Date().toISOString(),
    ...profile
  });
  return { id: ref.id || "user_doc" };
}

export async function getUserProfile(targetUid = null) {
  ensureDb();
  const currentUser = auth.currentUser;
  const uid = targetUid || (currentUser ? currentUser.uid : null);

  if (!uid) {
    return null;
  }

  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id || "user_doc", ...snap.data() } : null;
}

/* ------------------ DEFAULT EXPORT ------------------ */
export default {
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
  createUserProfile,
  getUserProfile,
  updateLegacyDocument,
  deleteLegacyDocument
};