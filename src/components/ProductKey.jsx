import React, { useEffect, useState } from "react";
import "../styles/product-key.css";
// onAuthStateChanged eklendi
import { getAuth, onAuthStateChanged } from "firebase/auth";
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
    price: "₺99",
    oldPrice: null,
    ctaUrl: "https://www.itemsatis.com/diger-urun-satislari/stokpro-lisans-anahtari-1-ay-4620619.html",
    tone: "mavi"
  },
  {
    id: "3ay",
    title: "3 AY Lisans",
    desc: "Üç aylık kullanımda ek avantajlar ve %17 tasarruf sağlayın!",
    extra: "Önemli Not: Satışlar itemsatis.com üzerinden güvenle gerçekleştirilmektedir.",
    price: "₺249",
    oldPrice: "₺300",
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
  // Başlangıçta false yapıyoruz ki "yükleniyor" anında kart görünmesin
  const [trialAvailable, setTrialAvailable] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4500);
  }

  // UID parametresi alacak şekilde güncellendi
  async function loadProfile(uid) {
    setProfileLoading(true);
    try {
      // Helper'a direkt UID veriyoruz, böylece hata payı kalmıyor
      const p = await getUserProfile(uid);
      
      const isUsed = p?.trialUsed === true;
      const isActive = hasActiveSubscription(p);

      // Kullanmışsa veya aboneyse GÖSTERME (false)
      if (isUsed || isActive) {
        setTrialAvailable(false);
      } else {
        // Kullanmamış ve abone değilse GÖSTER (true)
        setTrialAvailable(true);
      }
    } catch (err) {
      console.error("Profil yükleme hatası:", err);
      setTrialAvailable(false);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    const auth = getAuth();
    
    // Oturum durumunu dinle (Sayfa yenilendiğinde Firebase hazır olana kadar bekler)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kullanıcı giriş yapmış, şimdi profilini kontrol et
        loadProfile(user.uid);
      } else {
        // Kullanıcı giriş yapmamışsa deneme kartını GİZLE
        setTrialAvailable(false);
        setProfileLoading(false);
      }
    });

    // Component kapandığında dinleyiciyi kaldır
    return () => unsubscribe();
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
        {/* DENEME KARTI: Sadece profileLoading bittiyse ve trialAvailable true ise göster */}
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

        {/* STANDART PAKETLER */}
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
