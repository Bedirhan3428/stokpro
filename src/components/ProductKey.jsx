import React, { useEffect, useState } from "react";
import "../styles/product-key.css";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, runTransaction } from "firebase/firestore";
import { getUserProfile } from "../utils/firebaseHelpers";

const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "";

function hasActiveSubscription(profile) {
  if (!profile) return false;
  const endRaw = profile.subscriptionEndDate || profile.subscription_end_date || profile.subscriptionEndsAt;
  if (!endRaw) return false;
  let end;
  if (typeof endRaw === "object" && typeof endRaw.toDate === "function") end = endRaw.toDate();
  else if (typeof endRaw === "object" && endRaw.seconds) end = new Date(endRaw.seconds * 1000);
  else end = new Date(endRaw);
  
  // Eğer tarih 2030'dan büyükse süresiz kabul edelim (UI için)
  return !isNaN(end.getTime()) && end.getTime() > Date.now();
}

export default function ProductKeyPage() {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLifetimeActive, setIsLifetimeActive] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4500);
  }

  // Profil kontrolü: Zaten lisansı var mı?
  async function loadProfile(uid) {
    setProfileLoading(true);
    try {
      const p = await getUserProfile(uid);
      const isActive = hasActiveSubscription(p);

      // Eğer aktifse butonu pasif yapacağız
      if (isActive) {
        setIsLifetimeActive(true);
      }
    } catch (err) {
      console.error("Profil yükleme hatası:", err);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadProfile(user.uid);
      } else {
        setProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Süresiz lisans tanımlama fonksiyonu
  async function activateFreeLicense() {
    if (loading || isLifetimeActive) return;
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return showNote({ type: "error", title: "Giriş Gerekli", message: "Lisansı aktif etmek için giriş yapmalısınız." });
    if (!ARTIFACT_DOC_ID) return showNote({ type: "error", title: "Hata", message: "Sistem yapılandırması eksik." });

    setLoading(true);
    try {
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", user.uid, "profile", "user_doc");

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const existing = snap.exists() ? snap.data() : {};

        // 100 Yıl sonrasına tarih veriyoruz (Süresiz mantığı)
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 100);
        const lifetimeIso = endDate.toISOString();

        tx.set(profileRef, {
          ...existing,
          subscriptionStatus: "active_lifetime", // Durumu lifetime yaptık
          subscriptionEndDate: lifetimeIso,
          plan: "free_forever",
          updatedAt: new Date().toISOString()
        });
      });

      setIsLifetimeActive(true);
      showNote({ 
        type: "success", 
        title: "Harika!", 
        message: "Süresiz lisansınız başarıyla tanımlandı. İyi çalışmalar!" 
      });
    } catch (err) {
      showNote({ type: "error", title: "Hata", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {note && (
        <div className={`trial-note ${note.type === "error" ? "trial-error" : "trial-success"}`}>
          <strong>{note.title}:</strong> {note.message}
        </div>
      )}

      <header className="hero">
        <p className="pill">StokPro Ücretsiz</p>
        <h1>Süresiz Erişim</h1>
        <p className="subtitle">StokPro artık tamamen ücretsiz! Hemen lisansını aktif et ve kullanmaya başla.</p>
      </header>

      <section className="cards" style={{ display: "flex", justifyContent: "center" }}>
        {/* TEK KART: ÜCRETSİZ PLAN */}
        <article className="card highlight-border" style={{ maxWidth: "450px", width: "100%" }}>
          <div className="card-head">
            <h2>Tam Sürüm</h2>
            <div className="tag tag-blue">Ömür Boyu Ücretsiz</div>
          </div>
          <p className="desc">
            Kredi kartı gerekmez, süre sınırı yok. Tüm muhasebe ve stok özelliklerine sınırsız erişim sağlayın.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "20px 0", color: "#666", fontSize: "0.95rem" }}>
            <li style={{ marginBottom: "8px" }}>✓ Sınırsız Müşteri Ekleme</li>
            <li style={{ marginBottom: "8px" }}>✓ Sınırsız Ürün & Stok Takibi</li>
            <li style={{ marginBottom: "8px" }}>✓ Gelir/Gider Raporları</li>
          </ul>
          
          <div className="card-foot">
            <div className="price-wrap">
              <span className="old-price" style={{ textDecoration: "line-through", color: "#999" }}>₺499/ay</span>
              <div className="price">₺0</div>
            </div>
            
            <button 
              className="btn mavi" 
              onClick={activateFreeLicense} 
              disabled={loading || isLifetimeActive || profileLoading}
              style={{ width: "100%" }}
            >
              {profileLoading 
                ? "Kontrol ediliyor..." 
                : isLifetimeActive 
                  ? "Lisansınız Aktif" 
                  : loading 
                    ? "İşleniyor..." 
                    : "Hemen Başla"}
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
