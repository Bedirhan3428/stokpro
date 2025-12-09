import '../styles/global.css';
import '../styles/Settings.css';

import React, { useEffect, useState } from "react";
import { getUserProfile } from "../utils/firebaseHelpers";
import { db } from "../firebase";
import { doc,  runTransaction } from "firebase/firestore";
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

// Normalize raw key: remove non-alnum, uppercase, max 16 chars (no hyphens)
function normalizeKey(raw) {
  if (!raw) return "";
  const s = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.slice(0, 16);
}

// Format for display: insert hyphen every 4 chars (e.g. XXXX-XXXX-XXXX-XXXX)
function formatKeyForDisplay(raw) {
  const s = normalizeKey(raw);
  if (!s) return "";
  return s.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

// Convert displayed (with hyphens) to storage/search key (no hyphens, uppercase)
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
        // Format any stored key for display (stored keys are expected without hyphens)
        const rawKey = (p && (p.productKey || p.artifactKey || p.appKey || p.product_key)) || "";
        setProductKey(formatKeyForDisplay(rawKey));
      } catch (err) {
        console.error("getUserProfile error", err);
        showNote({ type: "error", title: "Hata", message: "Profil yüklenemedi: " + String(err?.message || err) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
    // eslint-disable-next-line
  }, []);

  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4000);
  }

  // Simple save for displayName/productKey (without activating license)
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
          // store key without hyphens (or null if empty)
          productKey: stripped ? stripped : null,
          updatedAt: new Date().toISOString()
        };
        tx.set(profileRef, merged);
      });
      const p = await getUserProfile();
      setProfile(p || null);
      // reflect stored key back into UI formatted
      setProductKey(formatKeyForDisplay(p?.productKey || ""));
      showNote({ type: "success", title: "Kaydedildi", message: "Profil bilgileri güncellendi." });
    } catch (err) {
      console.error("handleSaveProfile error", err);
      showNote({ type: "error", title: "Kaydetme Hatası", message: String(err?.message || err) });
    } finally {
      setSaving(false);
    }
  }

  // Activate product key: lookup license doc, ensure unused, update license and extend subscription
  async function handleActivateKey() {
    if (!productKey || !productKey.trim()) return showNote({ type: "error", title: "Geçersiz anahtar", message: "Lütfen bir ürün anahtarı girin." });
    setSaving(true);
    
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Yetkilendirme yok. Lütfen giriş yapın.");
      if (!ARTIFACT_DOC_ID) throw new Error("ARTIFACT doc id yok (REACT_APP_FIREBASE_ARTIFACTS_COLLECTION).");

      // Strip hyphens and ensure uppercase when searching the licenses collection
      const key = stripKey(productKey);
      if (!key) throw new Error("Geçersiz ürün anahtarı.");
      const licenseRef = doc(db, "licenses", key);
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");

      await runTransaction(db, async (tx) => {
        const licSnap = await tx.get(licenseRef);
        if (!licSnap.exists()) throw new Error("Ürün anahtarı bulunamadı.");
        const lic = licSnap.data();
        const status = (lic.status || "").toString().toLowerCase();
        if (status !== "unused") {
          throw new Error("Bu anahtar daha önce kullanılmış veya aktif değil (" + (lic.status || "unknown") + ").");
        }
        const durationMonths = Number(lic.durationMonths || 0);
        if (isNaN(durationMonths) || durationMonths <= 0) {
          throw new Error("Anahtar geçersiz: durationMonths bulunamadı veya sıfır.");
        }

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
          // store the stripped key (no hyphens)
          productKey: key,
          updatedAt: new Date().toISOString()
        };
        tx.set(profileRef, mergedProfile);
      });

      const p = await getUserProfile();
      setProfile(p || null);
      // clear the input after successful activation
      setProductKey("");
      showNote({ type: "success", title: "Anahtar Aktive Edildi", message: "Aboneliğiniz güncellendi." });
    } catch (err) {
      console.error("handleActivateKey error", err);
      showNote({ type: "error", title: "Anahtar Aktivasyonu Hatası", message: String(err?.message || err) });
    } finally {
      setSaving(false);
    }
  }

 

  // Input change handler: enforce uppercase, groups of 4 with hyphens, max 19 chars (16 + 3 hyphens)
  function handleProductKeyChange(e) {
    const raw = e.target.value || "";
    // Normalize first (remove non-alnum and uppercase) then format for display
    const formatted = formatKeyForDisplay(raw);
    setProductKey(formatted);
  }

  return (
    <div className="settings-page container">
      {note && (
        <div className={`note ${note.type === "error" ? "note-error" : "note-success"}`} role={note.type === "error" ? "alert" : "status"}>
          <div className="note-title">{note.title}</div>
          <div className="note-body">{note.message}</div>
        </div>
      )}

      <div className="card settings-card">
        <h3 className="section-title">Ayarlar / Profil</h3>

        {loading ? (
          <div className="app-loading"><div className="spinner" /><p>Yükleniyor...</p></div>
        ) : (
          <div className="settings-grid">
            <div className="field">
              <label className="input-label">İsim</label>
              <input className="auth-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="field">
              <label className="input-label">E-posta (değiştirilemez)</label>
              <input className="auth-input" value={user?.email || ""} disabled />
            </div>

            <div className="two-col-row">
              <div className="info-box">
                <label className="input-label">Son Giriş</label>
                <div className="info-value">{fmtDate(profile?.lastLogin)}</div>
              </div>
              <div className="info-box">
                <label className="input-label">Abonelik Bitiş</label>
                <div className="info-value">{fmtDate(profile?.subscriptionEndDate)}</div>
              </div>
            </div>

            <div className="field">
              <label className="input-label">Abonelik Durumu</label>
              <div className="info-value muted">{profile?.subscriptionStatus || "—"}</div>
            </div>

            <hr className="divider" />

            <div className="field">
              <label className="input-label">Ürün Anahtarı (Product Key)</label>
              <input
                className="auth-input"
                value={productKey || ""}
                onChange={handleProductKeyChange}
                placeholder="PREM-XXXX-XXXX-XXXX"
                maxLength={19} // includes hyphens: 16 chars + 3 hyphens = 19
              />
            </div>

            <div className="button-row">
              <button className="btn btn-primary" onClick={handleActivateKey} disabled={saving}>{saving ? "İşleniyor..." : "Aktive Et"}</button>
              <button className="btn btn-ghost" onClick={handleSaveProfile} disabled={saving}>Bilgileri Kaydet</button>
              
            </div>

            <div className="notes muted">
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}