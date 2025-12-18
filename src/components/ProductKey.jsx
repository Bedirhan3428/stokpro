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
    extra:
      "Önemli Not: Vergi mükellefiyetimiz bulunmadığı için satışımız güvenilirliğinden emin olduğumuz itemsatis.com üzerinden gerçekleştirilmektedir. Anahtarınız satın alımdan sonra ile size ulaştırılacaktır.",
    price: "₺199",
    oldPrice: null,
    ctaUrl: "https://www.itemsatis.com/diger-urun-satislari/stokpro-lisans-anahtari-1-ay-4620619.html",
    tone: "mavi"
  },
  {
    id: "3ay",
    title: "3 AY Lisans",
    desc: "Yaklaşık %17 tasarruf sağlayın ve üç aylık kullanımla ek avantajları cebinize koyun!",
    extra:
      "Önemli Not: Vergi mükellefiyetimiz bulunmadığı için satışımız güvenilirliğinden emin olduğumuz itemsatis.com üzerinden gerçekleştirilmektedir. Anahtarınız satın alımdan sonra ile size ulaştırılacaktır.",
    price: "₺499",
    oldPrice: "₺600",
    ctaUrl: "https://www.itemsatis.com/diger-urun-satislari/stokpro-lisans-anahtari-3-ay-4620642.html",
    tone: "kirmizi"
  }
];

function hasActiveSubscription(profile) {
  if (!profile) return false;
  const endRaw =
    profile.subscriptionEndDate ||
    profile.subscription_end_date ||
    profile.subscriptionEndsAt ||
    null;
  if (!endRaw) return false;
  let end = endRaw;
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
    setTimeout(() => setNote(null), 3500);
  }

  async function loadProfile() {
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      // Eğer kullanıcı daha önce deneme kullanmamışsa VE aktif aboneliği yoksa deneme göster
      const available = !p?.trialUsed && !hasActiveSubscription(p);
      setTrialAvailable(available);
    } catch (err) {
      console.error("Profil yüklenirken hata:", err);
      setTrialAvailable(false);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startTrial() {
    if (trialLoading) return;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return showNote({
        type: "error",
        title: "Giriş gerekli",
        message: "Ücretsiz deneme için önce giriş yapın."
      });
    }
    if (!ARTIFACT_DOC_ID) {
      return showNote({
        type: "error",
        title: "Eksik yapılandırma",
        message: "ARTIFACT kimliği tanımlı değil."
      });
    }

    setTrialLoading(true);
    try {
      const profileRef = doc(
        db,
        "artifacts",
        ARTIFACT_DOC_ID,
        "users",
        user.uid,
        "profile",
        "user_doc"
      );

      let trialEndIso = null;
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const existing = snap.exists() ? snap.data() : {};
        const now = new Date();

        const alreadyActive = hasActiveSubscription(existing);
        if (existing.trialUsed) throw new Error("Ücretsiz deneme daha önce kullanılmış.");
        if (alreadyActive && existing.subscriptionStatus !== "trial") {
          throw new Error("Aktif aboneliğiniz var. Deneme uygulanamadı.");
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14); // 14 Gün ekle
        trialEndIso = endDate.toISOString();

        tx.set(profileRef, {
          ...existing,
          trialUsed: true,
          subscriptionStatus: "trial",
          subscriptionEndDate: trialEndIso,
          updatedAt: now.toISOString()
        });
      });

      setTrialAvailable(false);
      showNote({
        type: "success",
        title: "Deneme tanımlandı",
        message: `14 günlük deneme aktifleştirildi. Bitiş: ${new Date(trialEndIso).toLocaleString("tr-TR")}`
      });
    } catch (err) {
      showNote({
        type: "error",
        title: "Deneme başlatılamadı",
        message: err?.message || "Bilinmeyen hata"
      });
    } finally {
      setTrialLoading(false);
    }
  }

  return (
    <div className="page">
      {note && (
        <div
          className={`trial-note ${note.type === "error" ? "trial-error" : "trial-success"}`}
          role={note.type === "error" ? "alert" : "status"}
        >
          <strong>{note.title}</strong> — {note.message}
        </div>
      )}

      <header className="hero">
        <p className="pill">Ürün Anahtarı</p>
        <h1>Hızlı Aktivasyon Paketleri</h1>
        <p className="subtitle">
          İhtiyacınıza uygun süre seçenekleriyle hemen kullanmaya başlayın. Anahtarı aktive etmek için{" "}
          <a href="https://www.stokpro.shop/settings" style={{ color: "#1f6feb", fontWeight: "bold" }}>
            Ayarlar
          </a>{" "}
          sayfasını ziyaret edin.
        </p>
      </header>

      <section className="cards">
        {packages.map((p) => {
          // Eğer 1 aylık paketse ve deneme hakkı varsa, kartı "Deneme Kartı"na dönüştür
          const isTrialCard = p.id === "1ay" && trialAvailable && !profileLoading;
          const title = isTrialCard ? "14 Gün Ücretsiz Deneme" : p.title;
          const priceLabel = isTrialCard ? "Ücretsiz" : p.price;
          const descLabel = isTrialCard ? "14 gün ücretsiz dene" : p.desc;

          return (
            <article key={p.id} className="card">
              <div className="card-head">
                <h2>{title}</h2>
                <div className={`tag ${p.tone === "mavi" ? "tag-blue" : "tag-red"}`}>
                  {isTrialCard ? "Deneme" : p.tone === "mavi" ? "Hızlı Teslim" : "İndirimli"}
                </div>
              </div>
              <p className="desc">{descLabel}</p>
              <p className="extra">{p.extra}</p>
              <div className="card-foot">
                <div className="price-wrap">
                  {!isTrialCard && p.oldPrice && <span className="old-price">{p.oldPrice}</span>}
                  <div className="price">{priceLabel}</div>
                </div>
                <div className="card-actions">
                  {isTrialCard ? (
                    <button
                      type="button"
                      className="btn mavi"
                      onClick={startTrial}
                      disabled={trialLoading}
                    >
                      {trialLoading ? "Tanımlanıyor..." : "Ücretsiz Dene"}
                    </button>
                  ) : (
                    <a 
                      className={`btn ${p.tone}`} 
                      href={p.ctaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Satın Al
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
