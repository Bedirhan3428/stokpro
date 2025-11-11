import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  // YENİ EKLEMELER
  createUserWithEmailAndPassword,  // E-posta ile Kayıt
  signInWithEmailAndPassword,      // E-posta ile Giriş
  signOut,                         // Çıkış Yap
  GoogleAuthProvider,              // Google Sağlayıcı
  signInWithPopup,                  // Pop-up ile Giriş
  updateProfile,             // Profil Güncelleme
  sendEmailVerification,
  multiFactor,
  TotpMultiFactorGenerator, 
  TotpSecret, // MFA işlemleri için
 // reCAPTCHA bot kontrolü için
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  runTransaction,
  setLogLevel
} from 'firebase/firestore';

// SADECE SABİT KONFİGÜRASYONU KULLANIYORUZ
const firebaseConfig = {
  apiKey: "AIzaSyCxpYgw0OK8vz3eX_ohjqP95o7_Ez8ghjw",
  authDomain: "marketpro-2c61e.firebaseapp.com",
  projectId: "marketpro-2c61e",
  storageBucket: "marketpro-2c61e.firebasestorage.app",
  messagingSenderId: "330292329201",
  appId: "1:330292329201:web:d19827937fb863ea490750",
  measurementId: "G-3ME6X673YX"
};

// appId'yi de direkt sabit bir değişken olarak tanımlıyoruz
const appId = firebaseConfig.appId; 

// --- Firebase Servislerini Başlatma ---
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setLogLevel('Debug');
} catch (e) {
  console.error("Firebase başlatma hatası:", e);
}

// Tüm Firebase modül ve değişkenlerini dışa aktarıyoruz
export {
  app,
  auth,
  db,
  appId,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  
  // YENİ AUTH METOTLARI
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  multiFactor,
 TotpMultiFactorGenerator, // QR kod üretme ve doğrulama için
  TotpSecret,


  getDoc,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  runTransaction,
  setDoc
};