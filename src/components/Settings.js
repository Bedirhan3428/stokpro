import "../styles/Settings.css";
import React, { useEffect, useState } from "react";
import { getUserProfile } from "../utils/firebaseHelpers";
import { db } from "../firebase";
import { doc, runTransaction } from "firebase/firestore";
import { getAuth } from "firebase/auth";

function fmtDate(d) {
  if (!d) return "—";
  try {
    if (typeof d === "object" && typeof d.toDate === "function") d = d.toDate();
    else if (typeof d === "object" && d.seconds) d = new Date(d.seconds * 1000);
    else d = new Date(d);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function normalizeKey(raw) {
  if (!raw) return "";
  const s = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.slice(0, 16);
}
function formatKeyForDisplay(raw) {
  const s = normalizeKey(raw);
  if (!s) return "";
  return s.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}
function stripKey(displayed) {
  if (!displayed) return "";
  return String(displayed).toUpperCase().replace(/-/g, "");
}

export default function Settings() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [productKey, setProductKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);

  const ARTIFACT_DOC_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        setProfile(p || null);
        setDisplayName((p && (p.name || p.displayName)) || "");
        const rawKey = (p && (p.productKey || p.artifactKey || p.appKey || p.product_key)) || "";
        setProductKey(formatKeyForDisplay(rawKey));
      } catch (err) {
        bildir({ type: "error", title: "Hata", message: "Profil yüklenemedi: " + String(err?.message || err) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4000);
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Yetkilendirme yok. Lütfen giriş yapın.");
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const existing = snap.exists() ? snap.data() : {};
        const stripped = stripKey(productKey);
        const merged = {
          ...existing,
          name: String(displayName || "").trim(),
          productKey: stripped ? stripped : null,
          updatedAt: new Date().toISOString()
        };
        tx.set(profileRef, merged);
      });
      const p = await getUserProfile();
      setProfile(p || null);
      setProductKey(formatKeyForDisplay(p?.productKey || ""));
      bildir({ type: "success", title: "Kaydedildi", message: "Profil bilgileri güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Kaydetme Hatası", message: String(err?.message || err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleActivateKey() {
    if (!productKey || !productKey.trim()) return bildir({ type: "error", title: "Geçersiz anahtar", message: "Lütfen bir ürün anahtarı girin." });
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Yetkilendirme yok. Lütfen giriş yapın.");
      if (!ARTIFACT_DOC_ID) throw new Error("ARTIFACT doc id yok (REACT_APP_FIREBASE_ARTIFACTS_COLLECTION).");

      const key = stripKey(productKey);
      if (!key) throw new Error("Geçersiz ürün anahtarı.");
      const licenseRef = doc(db, "licenses", key);
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");

      await runTransaction(db, async (tx) => {
        const licSnap = await tx.get(licenseRef);
        if (!licSnap.exists()) throw new Error("Ürün anahtarı bulunamadı.");
        const lic = licSnap.data();
        const status = (lic.status || "").toString().toLowerCase();
        if (status !== "unused") throw new Error("Anahtar daha önce kullanılmış veya aktif değil.");
        const durationMonths = Number(lic.durationMonths || 0);
        if (isNaN(durationMonths) || durationMonths <= 0) throw new Error("Anahtar geçersiz (süre bilgisi yok).");

        const profSnap = await tx.get(profileRef);
        const prof = profSnap.exists() ? profSnap.data() : {};

        let currentEnd = prof?.subscriptionEndDate ?? prof?.subscription_end_date ?? prof?.subscriptionEndsAt ?? null;
        let baseDate = new Date();
        if (currentEnd) {
          try {
            if (typeof currentEnd === "object" && typeof currentEnd.toDate === "function") currentEnd = currentEnd.toDate();
            else if (typeof currentEnd === "object" && currentEnd.seconds) currentEnd = new Date(currentEnd.seconds * 1000);
            else currentEnd = new Date(currentEnd);
            if (!isNaN(currentEnd.getTime()) && currentEnd.getTime() > Date.now()) baseDate = new Date(currentEnd);
          } catch {
            baseDate = new Date();
          }
        }

        const newEnd = new Date(baseDate);
        newEnd.setMonth(newEnd.getMonth() + durationMonths);

        tx.update(licenseRef, {
          status: "activated",
          activatedBy: uid,
          activationDate: new Date().toISOString()
        });

        const mergedProfile = {
          ...(prof || {}),
          subscriptionEndDate: newEnd.toISOString(),
          subscriptionStatus: "premium",
          productKey: key,
          updatedAt: new Date().toISOString()
        };
        tx.set(profileRef, mergedProfile);
      });

      const p = await getUserProfile();
      setProfile(p || null);
      setProductKey("");
      bildir({ type: "success", title: "Anahtar Aktive Edildi", message: "Aboneliğiniz güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Anahtar Aktivasyonu Hatası", message: String(err?.message || err) });
    } finally {
      setSaving(false);
    }
  }

  function handleProductKeyChange(e) {
    const raw = e.target.value || "";
    const formatted = formatKeyForDisplay(raw);
    setProductKey(formatted);
  }

  return (
    <div className="set-sayfa">
      {note && (
        <div className={`set-bildirim ${note.type === "error" ? "hata" : "basari"}`} role={note.type === "error" ? "alert" : "status"}>
          <div className="set-bildirim-baslik">{note.title}</div>
          <div className="set-bildirim-icerik">{note.message}</div>
        </div>
      )}

      <div className="set-kart">
        <h3 className="set-baslik">Ayarlar / Profil</h3>

        {loading ? (
          <div className="set-yukleme"><div className="set-spinner" /><p>Yükleniyor...</p></div>
        ) : (
          <div className="set-grid">
            <div className="set-alan">
              <label className="set-etiket">İsim</label>
              <input className="set-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="set-alan">
              <label className="set-etiket">E-posta (değiştirilemez)</label>
              <input className="set-input" value={user?.email || ""} disabled />
            </div>

            <div className="set-iki">
              <div className="set-kutu">
                <label className="set-etiket">Son Giriş</label>
                <div className="set-deger">{fmtDate(profile?.lastLogin)}</div>
              </div>
              <div className="set-kutu">
                <label className="set-etiket">Abonelik Bitiş</label>
                <div className="set-deger">{fmtDate(profile?.subscriptionEndDate)}</div>
              </div>
            </div>

            <div className="set-alan">
              <label className="set-etiket">Abonelik Durumu</label>
              <div className="set-deger set-ince">{profile?.subscriptionStatus || "—"}</div>
            </div>

            <hr className="set-hr" />

            <div className="set-alan">
              <label className="set-etiket">Ürün Anahtarı</label>
              <input
                className="set-input"
                value={productKey || ""}
                onChange={handleProductKeyChange}
                placeholder="PREM-XXXX-XXXX-XXXX"
                maxLength={19}
              />
            </div>

            <div className="set-buton-satir">
              <button className="set-btn mavi" onClick={handleActivateKey} disabled={saving}>{saving ? "İşleniyor..." : "Aktive Et"}</button>
              <button className="set-btn cizgi" onClick={handleSaveProfile} disabled={saving}>Bilgileri Kaydet</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}