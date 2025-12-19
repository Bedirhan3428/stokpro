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
    extra: "Önemli Not: Satışlar itemsatis.com üzerinden gerçekleştirilmektedir. Anahtarınız satın alımdan sonra ile size ulaştırılacaktır.",
    price: "₺199",
    oldPrice: null,
    ctaUrl: "https://www.itemsatis.com/diger-urun-satislari/stokpro-lisans-anahtari-1-ay-4620619.html",
    tone: "mavi"
  },
  {
    id: "3ay",
    title: "3 AY Lisans",
    desc: "Yaklaşık %17 tasarruf sağlayın ve üç aylık kullanımla ek avantajları cebinize koyun!",
    extra: "Önemli Not: Satışlar itemsatis.com üzerinden gerçekleştirilmektedir. Anahtarınız satın alımdan sonra ile size ulaştırılacaktır.",
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
      // Deneme hakkı: Daha önce kullanmamışsa VE aktif bir aboneliği (deneme dahil) yoksa
      const canStartTrial = p && p.trialUsed !== true && !hasActiveSubscription(p);
      setTrialAvailable(canStartTrial);
    } catch (err) {
      console.error("Profil hatası:", err);
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
    if (!user) return showNote({ type: "error", title: "Hata", message: "Giriş yapmalısın." });

    setTrialLoading(true);
    try {
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", user.uid, "profile", "user_doc");
      let trialEndIso;

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const existing = snap.exists() ? snap.data() : {};
        
        if (existing.trialUsed) throw new Error("Deneme hakkınızı zaten kullandınız.");
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14);
        trialEndIso = endDate.toISOString();

        tx.set(profileRef, {
          ...existing,
          trialUsed: true,
          subscriptionStatus: "trial",
          subscriptionEndDate: trialEndIso,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      setTrialAvailable(false);
      showNote({ 
        type: "success", 
        title: "Başarılı", 
        message: "14 günlük deneme tanımlandı! Sayfayı yenileyebilirsiniz." 
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
          {note.message}
        </div>
      )}

      <header className="hero">
        <p className="pill">Lisans</p>
        <h1>Aktivasyon Paketleri</h1>
      </header>

      <section className="cards">
        {/* ÜCRETSİZ DENEME KARTI: Sadece kullanıcı kullanmadıysa gösterilir */}
        {!profileLoading && trialAvailable && (
          <article className="card trial-card" style={{ border: "2px solid #1f6feb" }}>
            <div className="card-head">
              <h2>14 Günlük Deneme</h2>
              <div className="tag tag-blue">Ücretsiz</div>
            </div>
            <p className="desc">StokPro'yu 2 hafta boyunca tüm özellikleriyle test edin.</p>
            <div className="card-foot">
              <button className="btn mavi" onClick={startTrial} disabled={trialLoading}>
                {trialLoading ? "Tanımlanıyor..." : "Ücretsiz Başlat"}
              </button>
            </div>
          </article>
        )}

        {/* SATIN ALMA PAKETLERİ: Her zaman gösterilir */}
        {packages.map((p) => (
          <article key={p.id} className="card">
            <div className="card-head">
              <h2>{p.title}</h2>
              <div className={`tag ${p.tone === "mavi" ? "tag-blue" : "tag-red"}`}>
                {p.tone === "mavi" ? "Popüler" : "Avantajlı"}
              </div>
            </div>
            <p className="desc">{p.desc}</p>
            <div className="card-foot">
              <div className="price-wrap">
                {p.oldPrice && <span className="old-price">{p.oldPrice}</span>}
                <div className="price">{p.price}</div>
              </div>
              <a className={`btn ${p.tone}`} href={p.ctaUrl} target="_blank" rel="noopener noreferrer">
                Satın Al
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
