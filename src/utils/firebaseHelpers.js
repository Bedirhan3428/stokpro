import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query
} from "firebase/firestore";

// Artifact ID'yi env dosyasından alıyoruz
const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION;

// Yardımcı: Kullanıcı ID kontrolü
function getUid() {
  const user = auth.currentUser;
  if (!user) throw new Error("Kullanıcı oturumu kapalı. Lütfen giriş yapın.");
  return user.uid;
}

// 1. Ürünleri Listele
export async function listProductsForCurrentUser() {
  const uid = getUid();
  const colRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products");
  
  const q = query(colRef);
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 2. Ürün Ekle (GÜNCEL: ImageUrl eklendi)
export async function addProduct(product) {
  const uid = getUid();
  const colRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products");

  const docRef = await addDoc(colRef, {
    name: product.name,
    barcode: product.barcode || null,
    category: product.category || "Genel",
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    
    // --- GÖRSEL LİNKİ KAYDI ---
    imageUrl: product.imageUrl || null, 
    // --------------------------

    createdAt: new Date().toISOString()
  });

  return docRef.id;
}

// 3. Ürün Güncelle (GÜNCEL: ImageUrl eklendi)
export async function updateProduct(productId, updates) {
  const uid = getUid();
  const docRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", productId);

  const payload = { ...updates, updatedAt: new Date().toISOString() };
  
  await updateDoc(docRef, payload);
}

// 4. Ürün Sil
export async function deleteProduct(productId) {
  const uid = getUid();
  const docRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products", productId);
  
  await deleteDoc(docRef);
}