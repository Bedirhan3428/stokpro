import React, { useEffect, useState } from "react";
import "../styles/product-key.css";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { doc, runTransaction } from "firebase/firestore";
import { getUserProfile } from "../utils/firebaseHelpers";

const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "";

const packages = [
  {
    id: "1ay",
    title: "1 AY Lisans",
    desc: "Tek cihaz, anında teslim, otomatik aktivasyon.",
    extra: "Önemli Not: Satışlar itemsatis.com üzerinden güvenle gerçekleştirilmektedir.",
    price: "₺199",
    oldPrice: null,
    ctaUrl: "https://www.itemsatis.com/diger-urun-satislari/stokpro-lisans-anahtari-1-ay-4620619.html",
    tone: "mavi"
  },
  {
    id: "3ay",
    title: "3 AY Lisans",
    desc: "Üç aylık kullanımda ek avantajlar ve %17 tasarruf sağlayın!",
    extra: "Önemli Not: Satışlar itemsatis.com üzerinden güvenle gerçekleştirilmektedir.",
    price: "₺499",
    oldPrice: "₺600",
    ctaUrl: "https://www.itemsatis.com/diger-urun-satislari/stokpro-lisans-anahtari-3-ay-4620642.html",
    tone: "kirmizi"
  }
];

function hasActiveSubscription(profile) {
  if (!profile) return false;
  const endRaw = profile.subscriptionEndDate || profile.subscription_end_date || profile.subscriptionEndsAt;
  if (!endRaw) return false;
  let end;
  if (typeof endRaw === "object" && typeof endRaw.toDate === "function") end = endRaw.toDate();
  else if (typeof endRaw === "object" && endRaw.seconds) end = new Date(endRaw.seconds * 1000);
  else end = new Date(endRaw);
  return !isNaN(end.getTime()) && end.getTime() > Date.now();
}

export default function ProductKeyPage() {
  const [note, setNote] = useState(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialAvailable, setTrialAvailable] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4500);
  }

  async function loadProfile() {
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      
      // MANTIK: Profil dökümanı yoksa veya trialUsed alanı kesinlikle true değilse 
      // VE aktif bir aboneliği yoksa denemeyi göster.
      const isUsed = p?.trialUsed === true;
      const isActive = hasActiveSubscription(p);

      setTrialAvailable(!isUsed && !isActive);
    } catch (err) {
      console.error("Profil yükleme hatası:", err);
      setTrialAvailable(false);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function startTrial() {
    if (trialLoading) return;
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return showNote({ type: "error", title: "Giriş Gerekli", message: "Deneme başlatmak için giriş yapmalısınız." });
    if (!ARTIFACT_DOC_ID) return showNote({ type: "error", title: "Yapılandırma Hatası", message: "Koleksiyon kimliği bulunamadı." });

    setTrialLoading(true);
    try {
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", user.uid, "profile", "user_doc");

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const existing = snap.exists() ? snap.data() : {};

        if (existing.trialUsed === true) {
          throw new Error("Ücretsiz deneme hakkınızı zaten kullandınız.");
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14);
        const trialEndIso = endDate.toISOString();

        tx.set(profileRef, {
          ...existing,
          trialUsed: true,
          subscriptionStatus: "trial",
          subscriptionEndDate: trialEndIso,
          updatedAt: new Date().toISOString()
        });
      });

      setTrialAvailable(false);
      showNote({ 
        type: "success", 
        title: "Başarılı", 
        message: "14 günlük deneme süreniz tanımlandı! İyi kullanımlar." 
      });
    } catch (err) {
      showNote({ type: "error", title: "Hata", message: err.message });
    } finally {
      setTrialLoading(false);
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
        <p className="pill">Lisans Merkezi</p>
        <h1>Aktivasyon Paketleri</h1>
        <p className="subtitle">StokPro'yu lisans anahtarıyla veya ücretsiz denemeyle kullanın.</p>
      </header>

      <section className="cards">
        {/* ÖZEL ÜCRETSİZ DENEME KARTI: Sadece hakkı varsa görünür */}
        {!profileLoading && trialAvailable && (
          <article className="card trial-card highlight-border">
            <div className="card-head">
              <h2>14 Günlük Deneme</h2>
              <div className="tag tag-blue">Ücretsiz Hak</div>
            </div>
            <p className="desc">StokPro'nun tüm özelliklerini 2 hafta boyunca hiçbir ücret ödemeden deneyin.</p>
            <p className="extra">Kredi kartı gerekmez. Deneme sonunda otomatik olarak durdurulur.</p>
            <div className="card-foot">
              <div className="price">₺0</div>
              <button 
                className="btn mavi" 
                onClick={startTrial} 
                disabled={trialLoading}
              >
                {trialLoading ? "Tanımlanıyor..." : "Ücretsiz Dene"}
              </button>
            </div>
          </article>
        )}

        {/* STANDART SATIN ALMA PAKETLERİ: Her zaman görünür */}
        {packages.map((p) => (
          <article key={p.id} className="card">
            <div className="card-head">
              <h2>{p.title}</h2>
              <div className={`tag ${p.tone === "mavi" ? "tag-blue" : "tag-red"}`}>
                {p.tone === "mavi" ? "Hızlı Aktivasyon" : "Avantajlı Paket"}
              </div>
            </div>
            <p className="desc">{p.desc}</p>
            <p className="extra">{p.extra}</p>
            <div className="card-foot">
              <div className="price-wrap">
                {p.oldPrice && <span className="old-price">{p.oldPrice}</span>}
                <div className="price">{p.price}</div>
              </div>
              <a 
                className={`btn ${p.tone}`} 
                href={p.ctaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Satın Al
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
