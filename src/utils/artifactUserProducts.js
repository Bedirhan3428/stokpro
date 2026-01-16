// src/utils/artifactUserProducts.js
// Products helpers for artifacts/{ARTIFACT_DOC_ID}/users/{uid}/products
// NOTE: "cost" field removed from add/update payloads.

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query
} from "firebase/firestore";
import { db, firebaseEnabled } from "../firebase";
import { auth } from "../firebase";
import { ARTIFACT_DOC_ID } from "../config";

function ensureDb() {
  if (!firebaseEnabled || !db) throw new Error("Firestore not initialized.");
}
function getUidOrThrow() {
  const u = auth.currentUser;
  if (!u) throw new Error("Kullanıcı oturumu yok. Lütfen giriş yapın.");
  return u.uid;
}

export async function listProductsForCurrentUser() {
  ensureDb();
  const uid = getUidOrThrow();
  const q = query(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProduct(productId) {
  ensureDb();
  const uid = getUidOrThrow();
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addProduct(product) {
  ensureDb();
  const uid = getUidOrThrow();
  const ref = await addDoc(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products"), {
    name: String(product.name || ""),
    barcode: product.barcode ? String(product.barcode) : null,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    category: product.category ? String(product.category) : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return ref.id;
}

export async function updateProduct(productId, updates = {}) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!productId) throw new Error("productId gerekli.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", productId);
  const toUpdate = {};
  if (typeof updates.name !== "undefined") toUpdate.name = String(updates.name || "");
  if (typeof updates.barcode !== "undefined") toUpdate.barcode = updates.barcode ? String(updates.barcode) : null;
  if (typeof updates.price !== "undefined") toUpdate.price = Number(updates.price || 0);
  if (typeof updates.stock !== "undefined") toUpdate.stock = Number(updates.stock || 0);
  if (typeof updates.category !== "undefined") toUpdate.category = updates.category ? String(updates.category) : null;
  toUpdate.updatedAt = new Date().toISOString();
  await updateDoc(ref, toUpdate);
  return true;
}

export async function deleteProduct(productId) {
  ensureDb();
  const uid = getUidOrThrow();
  if (!productId) throw new Error("productId gerekli.");
  const ref = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", productId);
  await deleteDoc(ref);
  return true;
}

/* default export for convenience */
// Eski hali: export default { ... }
const productExports = {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct
};
export default productExports;
