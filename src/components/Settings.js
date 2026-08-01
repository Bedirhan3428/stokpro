"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUserProfile } from "../utils/firebaseHelpers";
import { db, auth, storage } from "../firebase";
import { doc, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { invalidateAndRefreshMasterCache } from "../utils/masterDataCache";
import useSubscription from "../hooks/useSubscription";
import Toast from "./Toast";
import { 
  FiUser, FiKey, FiShield, FiMoon, FiSun, 
  FiSave, FiLock, FiAward, FiBriefcase, FiUploadCloud, FiTrash2, FiFileText, FiZap
} from "react-icons/fi";
import { initTheme, toggleTheme } from "../utils/theme";

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

function formatKeyForDisplay(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return s.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

function stripKey(displayed) {
  return String(displayed || "").toUpperCase().replace(/-/g, "");
}

export default function Settings() {
  const user = auth.currentUser;
  const ARTIFACT_DOC_ID = process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION || process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "1:330292329201:web:d19827937fb863ea490750";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // Profil & Satıcı Bilgileri State'leri
  const [displayName, setDisplayName] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("GIB2026");
  const [vatRate, setVatRate] = useState("20");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // DASHBOARD AI NOW BRIEF GÖSTER/GİZLE TERCİHİ
  const [showAiBrief, setShowAiBrief] = useState(true);

  const [productKey, setProductKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);
  const [theme, setTheme] = useState("light");

  const { loading: subLoading, active: subActive } = useSubscription();

  useEffect(() => {
    setTheme(initTheme());
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        setProfile(p || null);
        setDisplayName((p && (p.name || p.displayName)) || "");
        setCompanyTitle(p?.companyTitle || p?.storeName || (p && (p.name || p.displayName)) || "");
        setTaxOffice(p?.taxOffice || "");
        setTaxNumber(p?.taxNumber || "");
        setCompanyAddress(p?.companyAddress || p?.address || "");
        setInvoicePrefix(p?.invoicePrefix || "GIB2026");
        setVatRate(p?.vatRate !== undefined ? String(p.vatRate) : "20");
        setLogoUrl(p?.logoUrl || "");
        setShowAiBrief(p?.showAiBrief !== false);
        setProductKey(formatKeyForDisplay(p?.productKey || ""));
      } catch (err) {
        bildir({ type: "error", title: "Yükleme Hatası", message: "Profil bilgileri çekilemedi." });
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

  function handleToggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || theme || "light";
    const nextTheme = toggleTheme(current);
    setTheme(nextTheme);
    bildir({ type: "info", title: "Tema Değişti", message: `Uygulama teması ${nextTheme === 'dark' ? 'Koyu Gece' : 'Aydınlık Gündüz'} moduna alındı.` });
  }

  // FIREBASE STORAGE ÜZERİNDEN GÖRSEL YÜKLEME
  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return bildir({ type: "warning", title: "Büyük Görsel", message: "Logo boyutu maksimum 5MB olmalıdır." });
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      return bildir({ type: "error", title: "Oturum Yok", message: "Lütfen önce giriş yapın." });
    }

    setUploadingLogo(true);
    try {
      if (storage) {
        const storageRef = ref(storage, `user_logos/${uid}/company_logo`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        setLogoUrl(downloadUrl);
        bildir({ type: "success", title: "Firebase Storage'a Yüklendi", message: "İşletme logonuz Firebase Storage bulutuna başarıyla yüklendi." });
      } else {
        throw new Error("Storage servisi başlatılamadı.");
      }
    } catch (err) {
      console.warn("Firebase Storage yüklemesi fallback moduna alındı:", err);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result;
        if (base64) {
          setLogoUrl(String(base64));
          bildir({ type: "success", title: "Logo Hazırlandı", message: "Logonuz hazırlandı. Kaydetmeyi unutmayın." });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    bildir({ type: "info", title: "Logo Kaldırıldı", message: "İşletme logosu silindi." });
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
      
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const existing = snap.exists() ? snap.data() : {};
        const merged = {
          ...existing,
          name: displayName.trim(),
          displayName: displayName.trim(),
          companyTitle: companyTitle.trim(),
          taxOffice: taxOffice.trim(),
          taxNumber: taxNumber.trim(),
          companyAddress: companyAddress.trim(),
          invoicePrefix: invoicePrefix.trim() || "GIB2026",
          logoUrl: logoUrl,
          showAiBrief: Boolean(showAiBrief),
          updatedAt: new Date().toISOString()
        };
        tx.set(profileRef, merged);
      });
      
      const p = await getUserProfile();
      setProfile(p);
      invalidateAndRefreshMasterCache().catch(() => {});
      bildir({ type: "success", title: "Ayarlar Güncellendi", message: "Fatura, logo ve tercihleriniz başarıyla kaydedildi." });
    } catch (err) {
      bildir({ type: "error", title: "Güncelleme Hatası", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleActivateKey() {
    if (!productKey.trim()) return bildir({ type: "warning", title: "Eksik Kod", message: "Lütfen ürün anahtarını giriniz." });
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const key = stripKey(productKey);
      
      const licenseRef = doc(db, "licenses", key);
      const profileRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");

      await runTransaction(db, async (tx) => {
        const licSnap = await tx.get(licenseRef);
        if (!licSnap.exists()) throw new Error("Geçersiz veya bulunamayan ürün anahtarı.");
        
        const lic = licSnap.data();
        if (lic.status !== "unused") throw new Error("Bu ürün anahtarı daha önce kullanılmış.");
        
        const duration = Number(lic.durationMonths || 0);
        if (duration <= 0) throw new Error("Anahtar süresi geçersiz.");

        const profSnap = await tx.get(profileRef);
        const prof = profSnap.exists() ? profSnap.data() : {};

        let currentEnd = prof.subscriptionEndDate ? new Date(prof.subscriptionEndDate) : new Date();
        if (currentEnd < new Date()) currentEnd = new Date();

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
      invalidateAndRefreshMasterCache().catch(() => {});
      bildir({ type: "success", title: "Lisans Etkinleştirildi", message: "Abonelik süreniz başarıyla uzatıldı." });
    } catch (err) {
      bildir({ type: "error", title: "Aktivasyon Hatası", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  const subStatus = React.useMemo(() => {
    if (!profile) return { label: "Bilinmiyor", color: "gray" };
    const end = profile.subscriptionEndDate ? new Date(profile.subscriptionEndDate) : null;
    const now = new Date();
    
    if (!end || end < now) return { label: "Süresi Dolmuş / Kısıtlı", color: "red" };
    if (profile.subscriptionStatus === "trial") return { label: "Deneme Sürümü", color: "orange" };
    return { label: "Abonelik Aktif (Premium)", color: "green" };
  }, [profile]);

  return (
    <div className="page-container">
      <Toast note={note} onClose={() => setNote(null)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* KART 1: KULLANICI & SATICI İŞLETME BİLGİLERİ */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBriefcase style={{ color: 'var(--primary)' }} /> 🏛️ Fatura & Satıcı İşletme Bilgileri
            </h3>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Profil yükleniyor...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* İŞLETME LOGOSU VE KULLANICI ÖZETİ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-main)', flexWrap: 'wrap' }}>
                {logoUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block', shrink: 0 }}>
                    <img 
                      src={logoUrl} 
                      alt="İşletme Logosu" 
                      style={{ width: '68px', height: '68px', objectFit: 'contain', background: '#ffffff', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-main)' }} 
                    />
                    <button 
                      onClick={handleRemoveLogo} 
                      title="Logoyu Sil" 
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="tbl-avatar" style={{ width: '60px', height: '60px', fontSize: '1.6rem', shrink: 0 }}>
                    {user?.email ? user.email[0].toUpperCase() : "U"}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{companyTitle || displayName || "İşletmeniz"}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Firebase Storage bulutuna logonuzu yükleyin.</span>
                  
                  <label className="modern-btn secondary" style={{ cursor: 'pointer', display: 'inline-flex', width: 'fit-content', padding: '5px 12px', fontSize: '0.75rem', marginTop: '4px', fontWeight: 800 }}>
                    <FiUploadCloud size={14} /> {uploadingLogo ? "Yükleniyor..." : "İşletme Logosu Yükle"}
                    <input type="file" accept="image/*" onChange={handleLogoChange} disabled={uploadingLogo} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* FORM ALANLARI */}
              <div className="settings-grid-2col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Yetkili Adı</label>
                  <input 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)} 
                    placeholder="İsminiz veya Yetkili Adı" 
                    className="modern-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Kayıtlı E-Posta</label>
                  <input 
                    value={user?.email || ""} 
                    disabled 
                    className="modern-input" 
                    style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg-subtle)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Firma / Şahıs Unvanı (Faturadaki Satıcı İsmi)</label>
                <input 
                  value={companyTitle} 
                  onChange={e => setCompanyTitle(e.target.value)} 
                  placeholder="Örn: StokPro Tekstil Ltd. Şti." 
                  className="modern-input"
                />
              </div>

              <div className="settings-grid-2col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Vergi Dairesi</label>
                  <input 
                    value={taxOffice} 
                    onChange={e => setTaxOffice(e.target.value)} 
                    placeholder="Örn: Kadıköy V.D." 
                    className="modern-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>VKN / TCKN</label>
                  <input 
                    value={taxNumber} 
                    onChange={e => setTaxNumber(e.target.value)} 
                    placeholder="1234567890" 
                    className="modern-input"
                  />
                </div>
              </div>

              <div className="settings-grid-3col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>İşletme Adresi</label>
                  <input 
                    value={companyAddress} 
                    onChange={e => setCompanyAddress(e.target.value)} 
                    placeholder="Faturada basılacak tam adresiniz..." 
                    className="modern-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Fatura Öneki</label>
                  <input 
                    value={invoicePrefix} 
                    onChange={e => setInvoicePrefix(e.target.value)} 
                    placeholder="GIB2026" 
                    className="modern-input"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>KDV Oranı (%)</label>
                  <select 
                    value={vatRate} 
                    onChange={e => setVatRate(e.target.value)} 
                    className="modern-input"
                    style={{ cursor: 'pointer', height: '42px', fontWeight: 700 }}
                  >
                    <option value="20">%20 (Genel KDV)</option>
                    <option value="10">%10 (Temel Gıda & Tekstil)</option>
                    <option value="1">%1 (Toptan Gıda & Tarım)</option>
                    <option value="0">%0 (KDV Muaf)</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSaveProfile} className="modern-btn primary" disabled={saving || uploadingLogo} style={{ marginTop: '6px' }}>
                <FiSave size={18} /> {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
              </button>
            </div>
          )}
        </div>

        {/* SAĞ KOLON: LİSANS VE TEMA / PANEL TERCİHLERİ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* KART 2: DASHBOARD VE UYGULAMA TERCİHLERİ */}
          <div className="card">
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiShield style={{ color: 'var(--warning)' }} /> Uygulama & Panel Tercihleri
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* DASHBOARD AI NOW BRIEF GÖSTER/GİZLE SEÇENEĞİ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiZap size={22} style={{ color: 'var(--primary)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '0.95rem' }}>Dashboard AI Now Brief Widget</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paneldeki Yapay Zeka analiz kartını göster/gizle.</span>
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={showAiBrief} 
                    onChange={e => setShowAiBrief(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{showAiBrief ? "Açık" : "Gizli"}</span>
                </label>
              </div>

              {/* TEMA MODU */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {theme === 'dark' ? <FiMoon size={22} style={{ color: 'var(--purple)' }} /> : <FiSun size={22} style={{ color: 'var(--warning)' }} />}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '0.95rem' }}>Görünüm Teması</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{theme === 'dark' ? 'Koyu Gece Modu' : 'Aydınlık Mod'}</span>
                  </div>
                </div>

                <button onClick={handleToggleTheme} className="modern-btn secondary">
                  Temayı Değiştir
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/terms-of-service" className="modern-btn ghost" style={{ justifyContent: 'flex-start' }}>
                  <FiLock size={16} /> Kullanım Şartları ve Gizlilik Sözleşmesi
                </Link>
              </div>
            </div>
          </div>

          {/* KART 3: LİSANS VE ABONELİK AKTİVASYONU */}
          <div className="card">
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAward style={{ color: 'var(--purple)' }} /> Lisans & Abonelik Durumu
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Hesap Durumu:</span>
                  <span className={`table-badge ${subStatus.color}`}>{subStatus.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Abonelik Bitiş Tarihi:</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{fmtDate(profile?.subscriptionEndDate)}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Ürün Anahtarı Etkinleştir</label>
                <div className="settings-key-row">
                  <input 
                    value={productKey} 
                    onChange={e => setProductKey(formatKeyForDisplay(e.target.value))} 
                    placeholder="XXXX-XXXX-XXXX-XXXX" 
                    maxLength={19} 
                    className="modern-input"
                    style={{ fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 800, flex: 1 }}
                  />
                  <button onClick={handleActivateKey} className="modern-btn success" disabled={saving}>
                    <FiKey size={18} /> Aktive Et
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
