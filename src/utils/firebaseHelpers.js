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
  setDoc,
  orderBy,
  limit as queryLimit
} from "firebase/firestore";
import { db, firebaseEnabled } from "../firebase";
import { auth } from "../firebase";

/* artifact ids from env */
const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "";
const LEGACY_ARTIFACT_DOC_ID =
  process.env.REACT_APP_FIREBASE_LEGACY_ARTIFACT ||
  process.env.REACT_APP_FIREBASE_LEGACY_ARTIFACT_ID ||
  "";

/* ---------- guards ---------- */
function ensureDb() {
  if (!firebaseEnabled || !db) throw new Error("Firestore not initialized.");
  if (!ARTIFACT_DOC_ID) throw new Error("ARTIFACT doc id not set. Set REACT_APP_FIREBASE_ARTIFACTS_COLLECTION in .env");
}
function getUidOrThrow() {
  const u = auth.currentUser;
  if (!u) throw new Error("No authenticated user. Please sign in.");
  return u.uid;
}

/* ---------- internal helper to read a collection under a specific artifact doc ---------- */
async function _getCollectionDocsFromArtifact(artifactId, pathSegments) {
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
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
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

/* Transactional: add a customer payment (decrease balance) */
export async function addCustomerPayment(customerId, { amount = 0, note = "" } = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId required.");
  return runTransaction(db, async (tx) => {
    const custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
    const custSnap = await tx.get(custRef);
    if (!custSnap.exists()) throw new Error("Customer not found.");
    const currentBalance = Number(custSnap.data()?.balance || 0);
    const pay = Number(amount || 0);
    if (isNaN(pay) || pay <= 0) throw new Error("Enter a valid amount.");

    if (currentBalance <= 0) {
      throw new Error("Customer has no outstanding balance.");
    }
    if (pay > currentBalance) {
      throw new Error(`Payment cannot exceed balance (${currentBalance}).`);
    }

    const newBalance = currentBalance - pay;
    tx.update(custRef, { balance: newBalance, updatedAt: new Date().toISOString() });

    const paymentsCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "payments");
    const paymentRef = doc(paymentsCol);
    tx.set(paymentRef, {
      amount: pay,
      note: String(note || ""),
      createdAt: new Date().toISOString()
    });

    // Ledger entry: mark as income and set an amount so dashboard/report picks it up.
    const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
    const ledgerRef = doc(ledgerCol);
    const customerName = custSnap.data()?.name || customerId;
    tx.set(ledgerRef, {
      type: "income", // important: dashboard sums ledger.type === "income"
      amount: pay, // important: also used by some report code
      description: `Customer payment (${customerName})`,
      lines: [
        { account: "Cash", debit: pay, credit: 0 },
        { account: `AR:${customerId}`, debit: 0, credit: pay }
      ],
      createdAt: new Date().toISOString()
    });

    return { paymentId: paymentRef.id, newBalance };
  });
}

/* ------------------ SALES: finalizeSaleTransaction ------------------ */
/**
 * finalizeSaleTransaction
 * - Saves sale document(s) under artifacts/{ARTIFACT_DOC_ID}/users/{uid}/sales
 * - Updates product stock (transactionally)
 * - ALSO: updates customer balance when paymentType === "credit" and writes a simple ledger entry + customer sales ref
 *
 * Important: Firestore transactions require that all reads happen before any writes.
 */
export async function finalizeSaleTransaction({ items = [], paymentType = "cash", customerId = null, totals = {} } = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty.");

  return runTransaction(db, async (tx) => {
    // 1) read product docs
    const productRefs = items.map((it) => doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", it.productId));
    const productSnaps = [];
    for (const pref of productRefs) {
      const snap = await tx.get(pref);
      productSnaps.push(snap);
    }

    // 2) if credit, read customer too
    let custRef = null;
    let custSnap = null;
    let customerName = null;
    if (paymentType === "credit" && customerId) {
      custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
      custSnap = await tx.get(custRef);
      if (!custSnap.exists()) {
        throw new Error("Customer not found for credit sale.");
      }
      customerName = custSnap.data()?.name || null;
    }

    // 3) validate stocks (reads already performed)
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const pSnap = productSnaps[i];
      if (!pSnap.exists()) throw new Error(`Product not found: ${it.productId}`);
      const data = pSnap.data();
      const currentStock = Number(data.stock || 0);
      if (currentStock < it.qty) throw new Error(`Insufficient stock for ${data.name || it.productId}`);
    }

    // 4) writes: deduct stock, create sale, update customer balance (if credit), ledger, customer sales pointer
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const pRef = productRefs[i];
      const pSnap = productSnaps[i];
      const data = pSnap.data();
      const currentStock = Number(data.stock || 0);
      tx.update(pRef, { stock: currentStock - it.qty, updatedAt: new Date().toISOString() });
    }

    const saleRef = doc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales"));
    const saleItems = items.map((it) => ({
      productId: it.productId,
      name: it.name || null,
      qty: it.qty,
      price: it.price
    }));

    // compute total reliably: prefer totals.total/subtotal/amount, fallback to items sum
    const inferredTotalFromItems = saleItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 0)), 0);
    const topTotal = (totals && (typeof totals.total !== "undefined" ? totals.total : (typeof totals.subtotal !== "undefined" ? totals.subtotal : (typeof totals.amount !== "undefined" ? totals.amount : null))));
    const totalAmount = Number(topTotal ?? inferredTotalFromItems ?? 0);

    tx.set(saleRef, {
      items: saleItems,
      saleType: paymentType,
      customerId: customerId || null,
      customerName: customerName || null, // <-- store customer name for UI convenience
      totals: { total: totalAmount },
      createdAt: new Date().toISOString()
    });

    if (paymentType === "credit" && customerId && custRef && custSnap) {
      const currentBal = Number(custSnap.data()?.balance || 0);
      tx.update(custRef, { balance: currentBal + totalAmount, updatedAt: new Date().toISOString() });

      const custSalesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "sales");
      const custSaleRef = doc(custSalesCol);
      tx.set(custSaleRef, {
        saleId: saleRef.id,
        customerName: customerName || null,
        items: saleItems,
        totals: { total: totalAmount },
        saleType: paymentType,
        createdAt: new Date().toISOString()
      });
    }

    // ledger entry (sale)
    try {
      const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
      const ledgerRef = doc(ledgerCol);
      const lines = [];
      if (paymentType === "cash") {
        lines.push({ account: "Cash", debit: totalAmount, credit: 0 });
      } else if (paymentType === "credit") {
        lines.push({ account: `AR:${customerId}`, debit: totalAmount, credit: 0 });
      } else {
        lines.push({ account: "Cash", debit: totalAmount, credit: 0 });
      }
      lines.push({ account: "Sales Revenue", debit: 0, credit: totalAmount });

      tx.set(ledgerRef, {
        // keep type optional for sales (dashboard primarily uses sales collection)
        description: `Sale ${saleRef.id} (${paymentType}${customerName ? ` / ${customerName}` : customerId ? ` / ${customerId}` : ""})`,
        lines,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      // non-fatal
    }

    return { saleId: saleRef.id };
  });
}

/* ------------------ READERS (Sale, Recent Sale, Ledger) ------------------ */

export async function listSales() {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * listRecentSales(limit = 100)
 * Returns last `limit` sales ordered by createdAt desc (sort done in memory).
 */
export async function listRecentSales(limit = 100) {
  ensureDb();
  const uid = getUidOrThrow();
  const salesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales");
  // Querying without orderBy/limit (for Firestore index compliance)
  const q = query(salesCol);
  const snap = await getDocs(q);

  let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Sort in memory (descending by createdAt)
  results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Apply limit locally
  return results.slice(0, Number(limit || 100));
}

// Ledger reading
export async function listLedger() {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Add a general ledger entry (income/expense)
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

/* ------------------ UPDATE / DELETE ------------------ */
export async function updateSale(saleId, updates = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!saleId) throw new Error("saleId required.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales", saleId);
  const toUpdate = { ...updates, updatedAt: new Date().toISOString() };
  await updateDoc(ref, toUpdate);
  return true;
}

export async function deleteSale(saleId) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!saleId) throw new Error("saleId required.");
  const saleRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "sales", saleId);
  await deleteDoc(saleRef);

  // best-effort cleanup: remove any customer-side ref (if you used customers/*/sales)
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
  if (!ledgerId) throw new Error("ledgerId required.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger", ledgerId);
  const toUpdate = { ...updates, updatedAt: new Date().toISOString() };
  await updateDoc(ref, toUpdate);
  return true;
}

export async function deleteLedgerEntry(ledgerId) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!ledgerId) throw new Error("ledgerId required.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger", ledgerId);
  await deleteDoc(ref);
  return true;
}

/* ------------------ CUSTOMER EDIT / BALANCE / DELETE ------------------ */
export async function updateCustomer(customerId, updates = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId required.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
  const toUpdate = {};
  if (typeof updates.name !== "undefined") toUpdate.name = String(updates.name || "");
  if (typeof updates.phone !== "undefined") toUpdate.phone = updates.phone ? String(updates.phone) : null;
  toUpdate.updatedAt = new Date().toISOString();
  await updateDoc(ref, toUpdate);
  return true;
}

export async function setCustomerBalance(customerId, newBalance, note = "") {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId required.");
  return runTransaction(db, async (tx) => {
    const custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
    const custSnap = await tx.get(custRef);
    if (!custSnap.exists()) throw new Error("Customer not found.");
    const current = Number(custSnap.data()?.balance || 0);
    const target = Number(newBalance || 0);
    const diff = target - current;

    tx.update(custRef, { balance: target, updatedAt: new Date().toISOString() });

    if (diff < 0) {
      const pay = Math.abs(diff);
      const paymentsCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "payments");
      const pRef = doc(paymentsCol);
      tx.set(pRef, {
        amount: pay,
        note: `Manual balance update: ${note || ""}`,
        createdAt: new Date().toISOString()
      });

      const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
      const ledgerRef = doc(ledgerCol);
      tx.set(ledgerRef, {
        description: `Manual payment: ${custSnap.data()?.name || customerId} (${note || ""})`,
        lines: [
          { account: "Cash", debit: pay, credit: 0 },
          { account: `AR:${customerId}`, debit: 0, credit: pay }
        ],
        createdAt: new Date().toISOString()
      });
    } else if (diff > 0) {
      const adjustCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId, "adjustments");
      const aRef = doc(adjustCol);
      tx.set(aRef, {
        amount: diff,
        note: `Manual balance increase: ${note || ""}`,
        createdAt: new Date().toISOString()
      });

      const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "ledger");
      const ledgerRef = doc(ledgerCol);
      tx.set(ledgerRef, {
        description: `Manual balance increase: ${custSnap.data()?.name || customerId} (${note || ""})`,
        lines: [
          { account: `AR:${customerId}`, debit: diff, credit: 0 },
          { account: "Sales Revenue", debit: 0, credit: diff }
        ],
        createdAt: new Date().toISOString()
      });
    }

    return { oldBalance: current, newBalance: target };
  });
}

export async function deleteCustomer(customerId) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!customerId) throw new Error("customerId required.");

  async function deleteCollectionDocs(pathSegments) {
    const colRef = collection(db, ...pathSegments);
    const snap = await getDocs(colRef);
    if (snap.empty) return 0;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(doc(db, ...pathSegments, d.id)));
    await batch.commit();
    return snap.size;
  }

  const basePath = ["artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId];
  await deleteCollectionDocs([...basePath, "payments"]);
  await deleteCollectionDocs([...basePath, "sales"]);
  await deleteCollectionDocs([...basePath, "adjustments"]);

  const custRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers", customerId);
  await deleteDoc(custRef);
  return true;
}

/* ------------------ LEGACY READ ------------------ */
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

async function _tryPathsAndCollect(artifactId, uid, colName) {
  const results = [];
  const tried = new Set();
  const candidates = CANDIDATE_PATHS_FOR[colName] || [];
  for (const pathFn of candidates) {
    const pathSegments = pathFn(uid);
    const pathKey = pathSegments.join("/");
    if (tried.has(pathKey)) continue;
    tried.add(pathKey);
    try {
      const docs = await _getCollectionDocsFromArtifact(artifactId, pathSegments);
      for (const d of docs) {
        results.push({ ...d, sourceArtifact: artifactId, sourcePath: pathKey });
      }
    } catch (err) {
      // ignore path errors (non-fatal)
    }
  }
  return results;
}

function _uniqByIdAndPath(items) {
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
  for (const aid of artifactIds) {
    try {
      const items = await _tryPathsAndCollect(aid, uid, "incomes");
      merged.push(...items);
    } catch (err) {
      // ignore
    }
  }

  merged = _uniqByIdAndPath(merged);
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
  for (const aid of artifactIds) {
    try {
      const items = await _tryPathsAndCollect(aid, uid, "expenses");
      merged.push(...items);
    } catch (err) {
      // ignore
    }
  }

  merged = _uniqByIdAndPath(merged);
  merged.sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
  return merged;
}

/**
 * Attempts to read sales collections under candidate paths in the primary and legacy artifact docs.
 * Returns an array of documents with { id, ...data, sourceArtifact, sourcePath }.
 */
export async function listLegacySales(forUid = null, artifactIdOverride = null) {
  ensureDb();
  const uid = forUid || getUidOrThrow();

  const artifactIds = artifactIdOverride
    ? [artifactIdOverride]
    : [ARTIFACT_DOC_ID].concat(LEGACY_ARTIFACT_DOC_ID && LEGACY_ARTIFACT_DOC_ID !== ARTIFACT_DOC_ID ? [LEGACY_ARTIFACT_DOC_ID] : []);

  let merged = [];
  for (const aid of artifactIds) {
    try {
      const items = await _tryPathsAndCollect(aid, uid, "sales");
      merged.push(...items);
    } catch (err) {
      // ignore
    }
  }

  merged = _uniqByIdAndPath(merged);
  merged.sort((a, b) => new Date(b.createdAt || b.date || b.created_at || 0).getTime() - new Date(a.createdAt || a.date || a.created_at || 0).getTime());
  return merged;
}

/* ------------------ LEGACY UPDATE / DELETE ------------------ */
export async function updateLegacyDocument(sourceArtifact, sourcePath, docId, updates = {}) {
  ensureDb();
  if (!sourceArtifact) throw new Error("sourceArtifact required.");
  if (!sourcePath) throw new Error("sourcePath required.");
  if (!docId) throw new Error("docId required.");
  const pathSegments = Array.isArray(sourcePath) ? sourcePath : String(sourcePath).split("/").filter(Boolean);
  const ref = doc(db, "artifacts", sourceArtifact, ...pathSegments, docId);
  const toUpdate = { ...updates, updatedAt: new Date().toISOString() };
  await updateDoc(ref, toUpdate);
  return true;
}

export async function deleteLegacyDocument(sourceArtifact, sourcePath, docId) {
  ensureDb();
  if (!sourceArtifact) throw new Error("sourceArtifact required.");
  if (!sourcePath) throw new Error("sourcePath required.");
  if (!docId) throw new Error("docId required.");
  const pathSegments = Array.isArray(sourcePath) ? sourcePath : String(sourcePath).split("/").filter(Boolean);
  const ref = doc(db, "artifacts", sourceArtifact, ...pathSegments, docId);
  await deleteDoc(ref);
  return true;
}

/* ------------------ LEGACY write helpers (Primary Artifact Only) ------------------ */
export async function addLegacyIncome({ amount = 0, description = "" } = {}, forUid = null) {
  ensureDb();
  const uid = forUid || getUidOrThrow();
  const a = Number(amount || 0);
  if (isNaN(a) || a <= 0) throw new Error("Enter a valid amount.");
  const incomesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "incomes");
  const ref = await addDoc(incomesCol, {
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
  if (isNaN(a) || a <= 0) throw new Error("Enter a valid amount.");
  const expensesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "expenses");
  const ref = await addDoc(expensesCol, {
    amount: a,
    description: String(description || ""),
    createdAt: new Date().toISOString()
  });
  return { id: ref.id };
}

/* ------------------ PROFILE ------------------ */
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
  const uid = targetUid || getUidOrThrow();
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id || "user_doc", ...snap.data() };
}

/* ------------------ default export convenience ------------------ */
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