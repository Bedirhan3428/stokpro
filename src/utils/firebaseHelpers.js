import { hashKey, generateTerminalKey, maskKey } from './cryptoUtils';
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
import { invalidateAndRefreshMasterCache } from "./masterDataCache";
import { logUserActivity } from "./telemetryLogger";

const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";
const LEGACY_ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_LEGACY_ARTIFACT ||
  process.env.REACT_APP_FIREBASE_LEGACY_ARTIFACT ||
  process.env.REACT_APP_FIREBASE_LEGACY_ARTIFACT_ID ||
  "1:330292329201:web:d19827937fb863ea490750";

/* ---------- Guards ---------- */
function ensureDb() {
  if (!firebaseEnabled || !db) throw new Error("Firestore başlatılmadı.");
  if (!ARTIFACT_DOC_ID) throw new Error("FIREBASE_ARTIFACTS_COLLECTION tanımlı değil.");
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

  logUserActivity("CUSTOMER_CREATE", `Yeni Cari/Müşteri Eklendi: ${customer.name || 'İsimsiz'}`, {
    customerId: ref.id,
    name: customer.name || "",
    phone: customer.phone || null
  }).catch(() => {});

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

  const res = await runTransaction(db, async (tx) => {
    const custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
    const custSnap = await tx.get(custRef);
    if (!custSnap.exists()) throw new Error("Müşteri bulunamadı.");

    const mevcutBakiye = Number(custSnap.data()?.balance || 0);
    const odeme = Number(amount || 0);
    if (isNaN(odeme) || odeme <= 0) throw new Error("Geçerli bir tutar girin.");

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

    return { paymentId: paymentRef.id, newBalance: yeniBakiye, customerName: musteriAdi };
  });

  logUserActivity("CUSTOMER_PAYMENT", `Tahsilat Alındı: ${amount} ₺ (${res.customerName || customerId})`, {
    customerId,
    amount: Number(amount || 0),
    note: String(note || ""),
    newBalance: res.newBalance
  }).catch(() => {});

  return { paymentId: res.paymentId, newBalance: res.newBalance };
}

/* ------------------ SATIŞ TAMAMLAMA ------------------ */
export async function finalizeSaleTransaction({ items = [], paymentType = "cash", saleType = null, customerId = null, customerName: passedCustName = null, totals = {}, total = null } = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!Array.isArray(items) || items.length === 0) throw new Error("Sepet boş.");

  const activePayType = saleType || paymentType || "cash";

  const saleResult = await runTransaction(db, async (tx) => {
    // 1. Ürün ID'lerini güvenli çöz (eski veriler ve yeni verilerle %100 uyumluluk)
    const validItems = items.map((it) => {
      const pId = String(it.productId || it.id || "").trim();
      if (!pId) throw new Error(`Ürün ID'si bulunamadı (${it.name || 'Bilinmeyen Ürün'}).`);
      return {
        id: pId,
        productId: pId,
        name: String(it.name || "Ürün").trim(),
        qty: Number(it.qty || 1),
        price: Number(it.price || 0)
      };
    });

    const productRefs = validItems.map((it) => doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", it.productId));
    const productSnaps = [];
    for (const pref of productRefs) productSnaps.push(await tx.get(pref));

    let custRef = null;
    let custSnap = null;
    let finalCustName = passedCustName || null;
    if (activePayType === "credit" && customerId) {
      custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
      custSnap = await tx.get(custRef);
      if (custSnap.exists()) {
        finalCustName = custSnap.data()?.name || finalCustName;
      }
    }

    // Stok güncellemeleri (Asla eksiye düşmez, en az 0 Adet olarak sabitlenir)
    productSnaps.forEach((pSnap, i) => {
      if (pSnap.exists()) {
        const stok = Number(pSnap.data().stock || 0);
        const yeniStok = Math.max(0, stok - validItems[i].qty);
        tx.update(productRefs[i], { stock: yeniStok, updatedAt: new Date().toISOString() });
      }
    });

    const saleRef = doc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales"));
    const saleItems = validItems.map((it) => ({
      id: it.id,
      productId: it.productId,
      name: it.name,
      qty: it.qty,
      price: it.price
    }));
    const hesaplananToplam = saleItems.reduce((s, it) => s + (it.price * it.qty), 0);
    const gelenToplam = totals?.total ?? totals?.subtotal ?? totals?.amount ?? total ?? null;
    const toplamTutar = Number(gelenToplam ?? hesaplananToplam ?? 0);

    // Satış belgesi
    tx.set(saleRef, {
      items: saleItems,
      saleType: activePayType,
      paymentType: activePayType,
      total: toplamTutar,
      customerId: customerId || null,
      customerName: finalCustName || null,
      totals: { total: toplamTutar },
      createdAt: new Date().toISOString()
    });

    // Veresiye ise müşteri güncellemesi
    if (activePayType === "credit" && customerId && custRef && custSnap && custSnap.exists()) {
      const mevcut = Number(custSnap.data()?.balance || 0);
      tx.update(custRef, { balance: mevcut + toplamTutar, updatedAt: new Date().toISOString() });

      const custSalesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "sales");
      const custSaleRef = doc(custSalesCol);
      tx.set(custSaleRef, {
        saleId: saleRef.id,
        customerName: finalCustName || null,
        items: saleItems,
        total: toplamTutar,
        totals: { total: toplamTutar },
        saleType: activePayType,
        createdAt: new Date().toISOString()
      });
    }

    try {
      const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
      const ledgerRef = doc(ledgerCol);
      const lines = [];
      if (activePayType === "cash") lines.push({ account: "Kasa", debit: toplamTutar, credit: 0 });
      else if (activePayType === "credit") lines.push({ account: `AR:${customerId}`, debit: toplamTutar, credit: 0 });
      else lines.push({ account: "Kasa", debit: toplamTutar, credit: 0 });
      lines.push({ account: "Satış Geliri", debit: 0, credit: toplamTutar });

      const desc = activePayType === "credit"
        ? `Satış (Veresiye${finalCustName ? ` - ${finalCustName}` : ""})`
        : "Satış (Nakit)";

      tx.set(ledgerRef, {
        description: desc,
        lines,
        createdAt: new Date().toISOString()
      });
    } catch {
      /* ledger yazılamazsa işlemi durdurma */
    }

    invalidateAndRefreshMasterCache().catch(() => {});

    return {
      id: saleRef.id,
      items: saleItems,
      total: toplamTutar,
      saleType: activePayType,
      customerName: finalCustName
    };
  });

  const payLabel = saleResult.saleType === "credit" ? "Veresiye" : saleResult.saleType === "card" ? "Kredi Kartı" : "Nakit";
  logUserActivity("SALE_CREATE", `Yeni Satış: ${saleResult.total} ₺ (${payLabel})`, {
    saleId: saleResult.id,
    total: saleResult.total,
    saleType: saleResult.saleType,
    customerName: saleResult.customerName || null,
    itemsCount: saleResult.items?.length || 0,
    itemsSummary: saleResult.items?.map(it => `${it.name} x${it.qty} (${it.price}₺)`).join(", ")
  }).catch(() => {});

  return saleResult;
}

/* ------------------ OKUMALAR ------------------ */
export async function listSales() {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Performans için limitli satış çekme (Memory sort)
export async function listRecentSales(limitCount = 100) {
  ensureDb();
  const uid = getUidOrThrow();
  const salesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales");

  // NOT: Karmaşık query (orderBy + limit) index gerektireceğinden 
  // tüm datayı çekip memory'de sıralıyoruz. 
  // Çok büyük verilerde index oluşturup query değiştirmek gerekir.
  const q = query(salesCol); 
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

  const entryType = entry.type === "expense" ? "Gider" : "Gelir";
  logUserActivity(entry.type === "expense" ? "EXPENSE_CREATE" : "INCOME_CREATE", `Kasa/Muhasebe ${entryType} Kaydı: ${entry.amount} ₺`, {
    ledgerId: ref.id,
    type: entry.type || "income",
    amount: Number(entry.amount || 0),
    description: entry.description || ""
  }).catch(() => {});

  return ref.id;
}

/* ------------------ GÜNCELLE / SİL ------------------ */
export async function updateSale(saleId, updates = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!saleId) throw new Error("saleId gerekli.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales", saleId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });

  logUserActivity("SALE_UPDATE", `Satış Güncellendi (ID: ${saleId})`, { saleId, updates }).catch(() => {});
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

  logUserActivity("SALE_DELETE", `Satış Silindi (ID: ${saleId})`, { saleId }).catch(() => {});
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

  logUserActivity("TRANSACTION_DELETE", `Kasa/Muhasebe Kaydı Silindi (ID: ${ledgerId})`, { ledgerId }).catch(() => {});
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
  invalidateAndRefreshMasterCache().catch(() => {});

  logUserActivity("CUSTOMER_DELETE", `Müşteri Silindi (ID: ${customerId})`, { customerId }).catch(() => {});

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

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 100);

  const initialTerminalKey = profile.terminalKey || generateTerminalKey();
  const terminalKeyHash = profile.terminalKeyHash || (await hashKey(initialTerminalKey));

  const defaultProfile = {
    terminalKeyHash,
    terminalKeyMasked: maskKey(initialTerminalKey),
    name: profile.name ? String(profile.name) : "",
    email: profile.email ? String(profile.email) : null,
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    privacyAccepted: true,
    subscriptionStatus: "active_lifetime",
    subscriptionEndDate: endDate.toISOString(),
    plan: "free_forever",
    createdAt: new Date().toISOString(),
    ...profile
  };

  await setDoc(ref, defaultProfile, { merge: true });
  invalidateAndRefreshMasterCache().catch(() => {});
  return { id: ref.id || "user_doc", ...defaultProfile };
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

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 100);
  const lifetimeIso = endDate.toISOString();

  if (!snap.exists()) {
    const newProf = {
      name: currentUser?.displayName || "İşletme Yetkilisi",
      email: currentUser?.email || "",
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
      privacyAccepted: true,
      subscriptionStatus: "active_lifetime",
      subscriptionEndDate: lifetimeIso,
      plan: "free_forever",
      createdAt: new Date().toISOString()
    };
    await setDoc(ref, newProf, { merge: true }).catch(() => {});
    return { id: "user_doc", ...newProf };
  }

  const data = snap.data() || {};
  let needsUpdate = false;
  const updates = {};

  if (data.termsAccepted !== true) {
    data.termsAccepted = true;
    updates.termsAccepted = true;
    updates.termsAcceptedAt = data.termsAcceptedAt || new Date().toISOString();
    updates.privacyAccepted = true;
    needsUpdate = true;
  }

  if (!data.subscriptionStatus || data.subscriptionStatus === "trial" || data.subscriptionStatus === "expired") {
    data.subscriptionStatus = "active_lifetime";
    data.subscriptionEndDate = lifetimeIso;
    data.plan = "free_forever";
    updates.subscriptionStatus = "active_lifetime";
    updates.subscriptionEndDate = lifetimeIso;
    updates.plan = "free_forever";
    needsUpdate = true;
  }

  if (needsUpdate) {
    await setDoc(ref, updates, { merge: true }).catch(() => {});
  }

  return { id: snap.id || "user_doc", ...data };
}

/* ------------------ PROFİL GÜNCELLEME (YENİ) ------------------ */
export async function updateUserProfile(uid, data = {}) {
  ensureDb();
  if (!uid) throw new Error("Kullanıcı ID (uid) gerekli.");

  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");

  await setDoc(ref, { 
    ...data, 
    updatedAt: new Date().toISOString() 
  }, { merge: true });

  invalidateAndRefreshMasterCache().catch(() => {});
  return true;
}

/* ------------------ ONBOARDING ANKETİ KAYIT VE LİSTELEME ------------------ */
export async function saveSurveyResponse(surveyData = {}, targetUid = null) {
  ensureDb();
  const currentUser = auth.currentUser;
  const uid = targetUid || (currentUser ? currentUser.uid : null);
  if (!uid) throw new Error("Kullanıcı ID (uid) bulunamadı.");

  const payload = {
    uid,
    email: currentUser?.email || surveyData.email || "",
    displayName: currentUser?.displayName || surveyData.displayName || surveyData.name || "",
    sector: surveyData.sector || "Genel",
    sectorKey: surveyData.sectorKey || "genel",
    customSector: surveyData.customSector || "",
    primaryNeed: surveyData.primaryNeed || "Genel",
    needKey: surveyData.needKey || "genel",
    skipped: Boolean(surveyData.onboardingSkipped || surveyData.skipped),
    completedAt: surveyData.completedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Profil altına yaz
  const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
  await setDoc(profileRef, {
    ...payload,
    onboardingCompleted: true,
    onboardingSkipped: payload.skipped,
    onboardingCompletedAt: payload.completedAt
  }, { merge: true });

  // 2. Global anketler havuzuna yaz (artifacts/{ARTIFACT_DOC_ID}/surveys/{uid})
  try {
    const surveyDocRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "surveys", uid);
    await setDoc(surveyDocRef, payload, { merge: true });
  } catch (err) {
    console.warn("Global survey doc kaydedilemedi:", err);
  }

  invalidateAndRefreshMasterCache().catch(() => {});
  return payload;
}

export async function listAllSurveys() {
  ensureDb();
  let list = [];
  try {
    const surveysRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "surveys");
    const snap = await getDocs(surveysRef);
    list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Surveys koleksiyonu okunamadı:", err);
  }

  // Eğer surveys koleksiyonu boş veya kullanıcılar doğrudan profilde kayıtlıysa users'ı da tara
  try {
    const usersRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "users");
    const usersSnap = await getDocs(usersRef);
    const existingUids = new Set(list.map(s => s.uid || s.id));

    for (const uDoc of usersSnap.docs) {
      if (!existingUids.has(uDoc.id)) {
        try {
          const pRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uDoc.id, "profile", "user_doc");
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const pData = pSnap.data();
            if (pData.sector || pData.onboardingCompleted || pData.primaryNeed) {
              list.push({
                id: uDoc.id,
                uid: uDoc.id,
                email: pData.email || uDoc.data()?.email || "—",
                displayName: pData.name || pData.displayName || "—",
                sector: pData.sector || "Genel",
                sectorKey: pData.sectorKey || "genel",
                customSector: pData.customSector || "",
                primaryNeed: pData.primaryNeed || "Genel",
                needKey: pData.needKey || "genel",
                skipped: Boolean(pData.onboardingSkipped),
                completedAt: pData.onboardingCompletedAt || pData.createdAt || new Date().toISOString()
              });
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Users koleksiyonu taranırken hata:", err);
  }

  // Tarihe göre yeniden eskiye sırala
  list.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
  return list;
}

const firebaseHelpers = {
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
  updateUserProfile, 
  saveSurveyResponse,
  listAllSurveys,
  updateLegacyDocument,
  deleteLegacyDocument
};

export default firebaseHelpers; 