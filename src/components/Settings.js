import "../styles/Settings.css";
import React, { useEffect, useState } from "react";
import { getUserProfile } from "../utils/firebaseHelpers";
import { db } from "../firebase";
import { doc, runTransaction } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Tarih Formatlayıcı
function fmtDate(d) {
  if (!d) return "—";
  try {
    let dateObj = d;
    if (typeof d === "object" && d.toDate) dateObj = d.toDate();
    else if (typeof d === "object" && d.seconds) dateObj = new Date(d.seconds * 1000);
    else if (typeof d === "string") dateObj = new Date(d);
    
    if (isNaN(dateObj.getTime())) return "—";
    return dateObj.toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return "—"; }
}

// Anahtar Formatlayıcılar
function formatKeyForDisplay(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return s.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}
function stripKey(displayed) {
  return String(displayed || "").toUpperCase().replace(/-/g, "");
}

// Bildirim Bileşeni
function Bildirim({ note }) {
  if (!note) return null;
  const tip = note.type === "error" ? "hata" : note.type === "success" ? "basari" : "bilgi";
  return (
    <div className="set-bildirim-bar">
      <div className={`set-bildirim ${tip}`}>
        <div className="set-bildirim-baslik">{note.title || "Bilgi"}</div>
        <div className="set-bildirim-icerik">{note.message}</div>
      </div>
    </div>
  );
}

export default function Settings() {
  const auth = getAuth();
  const user = auth.currentUser;
  const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [productKey, setProductKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);

  // Veri Yükleme
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        setProfile(p || null);
        setDisplayName((p && (p.name || p.displayName)) || "");
        setProductKey(formatKeyForDisplay(p?.productKey || ""));
      } catch (err) {
        bildir({ type: "error", title: "Hata", message: "Profil yüklenemedi." });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4000);
  }

  // Profil Kaydetme
  async function handleSaveProfile() {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Oturum açılmamış.");
      
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const existing = snap.exists() ? snap.data() : {};
        const merged = {
          ...existing,
          name: displayName.trim(),
          updatedAt: new Date().toISOString()
        };
        tx.set(profileRef, merged);
      });
      
      const p = await getUserProfile();
      setProfile(p);
      bildir({ type: "success", title: "Başarılı", message: "Profil güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  // Anahtar Aktivasyonu
  async function handleActivateKey() {
    if (!productKey.trim()) return bildir({ type: "error", title: "Eksik", message: "Anahtar giriniz." });
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const key = stripKey(productKey);
      
      const licenseRef = doc(db, "licenses", key);
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");

      await runTransaction(db, async (tx) => {
        const licSnap = await tx.get(licenseRef);
        if (!licSnap.exists()) throw new Error("Geçersiz anahtar.");
        
        const lic = licSnap.data();
        if (lic.status !== "unused") throw new Error("Bu anahtar daha önce kullanılmış.");
        
        const duration = Number(lic.durationMonths || 0);
        if (duration <= 0) throw new Error("Anahtar süresi geçersiz.");

        const profSnap = await tx.get(profileRef);
        const prof = profSnap.exists() ? profSnap.data() : {};

        // Mevcut bitiş tarihini kontrol et
        let currentEnd = prof.subscriptionEndDate ? new Date(prof.subscriptionEndDate) : new Date();
        if (currentEnd < new Date()) currentEnd = new Date(); // Geçmişse bugünden başlat

        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + duration);

        tx.update(licenseRef, { status: "activated", activatedBy: uid, activationDate: new Date().toISOString() });
        tx.set(profileRef, {
          ...prof,
          subscriptionEndDate: newEnd.toISOString(),
          subscriptionStatus: "premium",
          productKey: key,
          updatedAt: new Date().toISOString()
        });
      });

      const p = await getUserProfile();
      setProfile(p);
      setProductKey("");
      bildir({ type: "success", title: "Aktif!", message: "Aboneliğiniz uzatıldı." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  // Abonelik Durumu Hesaplama
  const subStatus = React.useMemo(() => {
    if (!profile) return { label: "Bilinmiyor", class: "gri" };
    const end = profile.subscriptionEndDate ? new Date(profile.subscriptionEndDate) : null;
    const now = new Date();
    
    if (!end || end < now) return { label: "Süresi Dolmuş", class: "kirmizi" };
    if (profile.subscriptionStatus === "trial") return { label: "Deneme Sürümü", class: "turuncu" };
    return { label: "Abonelik Aktif", class: "yesil" };
  }, [profile]);

  return (
    <div className="set-sayfa">
      <Bildirim note={note} />

      <div className="set-kart">
        <h3 className="set-baslik">Hesap Ayarları</h3>

        {loading ? (
          <div className="set-yukleme"><div className="set-spinner"></div>Yükleniyor...</div>
        ) : (
          <div className="set-grid">
            
            {/* Profil Bölümü */}
            <div className="set-grup">
              <label className="set-etiket">Ad Soyad</label>
              <input 
                className="set-input" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                placeholder="İsminiz"
              />
            </div>

            <div className="set-grup">
              <label className="set-etiket">E-posta</label>
              <input className="set-input disabled" value={user?.email || ""} disabled />
              <small className="set-bilgi">E-posta değiştirilemez.</small>
            </div>

            <div className="set-actions">
              <button className="set-btn cizgi" onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Bilgileri Güncelle"}
              </button>
            </div>

            <hr className="set-hr" />

            {/* Abonelik Bölümü */}
            <h4 className="set-altbaslik">Abonelik Durumu</h4>
            
            <div className="set-status-box">
              <div className="set-status-row">
                <span className="set-status-label">Durum:</span>
                <span className={`set-badge ${subStatus.class}`}>{subStatus.label}</span>
              </div>
              <div className="set-status-row">
                <span className="set-status-label">Bitiş Tarihi:</span>
                <span className="set-date">{fmtDate(profile?.subscriptionEndDate)}</span>
              </div>
            </div>

            <div className="set-grup">
              <label className="set-etiket">Ürün Anahtarı (Aktivasyon)</label>
              <div className="set-key-row">
                <input
                  className="set-input key-input"
                  value={productKey}
                  onChange={(e) => setProductKey(formatKeyForDisplay(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                />
                <button className="set-btn mavi" onClick={handleActivateKey} disabled={saving}>
                  {saving ? "..." : "Aktive Et"}
                </button>
              </div>
              <small className="set-bilgi">Satın aldığınız kodu buraya girerek sürenizi uzatabilirsiniz.</small>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

