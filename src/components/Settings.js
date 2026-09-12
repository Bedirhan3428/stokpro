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
import { initTheme, toggleTheme, initAccent, setAccent, ACCENT_PALETTES } from "../utils/theme";
import { logUserActivity } from "../utils/telemetryLogger";

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

  // KİŞİSELLEŞTİRME & SEKTÖR TERCİHLERİ
  const [sectorKey, setSectorKey] = useState("perakende");
  const [customSector, setCustomSector] = useState("");
  const [needKey, setNeedKey] = useState("barkod_stok");

  // ÇALIŞMA ALANI & ARAYÜZ ÖZELLEŞTİRMELERİ
  const [accentColor, setAccentColor] = useState("blue");
  const [currencySymbol, setCurrencySymbol] = useState("₺");
  const [defaultUnit, setDefaultUnit] = useState("Adet");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [receiptFooterNote, setReceiptFooterNote] = useState("Bizi tercih ettiğiniz için teşekkür ederiz.");
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  // DASHBOARD AI NOW BRIEF GÖSTER/GİZLE TERCİHİ
  const [showAiBrief, setShowAiBrief] = useState(true);

  const [productKey, setProductKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);
  const [theme, setTheme] = useState("light");

  const { loading: subLoading, active: subActive } = useSubscription();

  useEffect(() => {
    setTheme(initTheme());
    setAccentColor(initAccent());
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
        setSectorKey(p?.sectorKey || "perakende");
        setCustomSector(p?.customSector || "");
        setNeedKey(p?.needKey || "barkod_stok");
        setShowAiBrief(p?.showAiBrief !== false);
        setCurrencySymbol(p?.currencySymbol || "₺");
        setDefaultUnit(p?.defaultUnit || "Adet");
        setLowStockThreshold(p?.lowStockThreshold !== undefined ? String(p.lowStockThreshold) : "10");
        setReceiptFooterNote(p?.receiptFooterNote || "Bizi tercih ettiğiniz için teşekkür ederiz.");
        setSoundEffectsEnabled(p?.soundEffectsEnabled !== false);
        if (p?.accentColor) {
          setAccent(p.accentColor);
          setAccentColor(p.accentColor);
        }
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
    logUserActivity("THEME_CHANGE", `Tema Değiştirildi: ${nextTheme}`, { theme: nextTheme }).catch(() => {});
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
      
      const SECTOR_TITLES = {
        tekstil: "Tekstil / İmalat",
        perakende: "Perakende / Mağaza",
        toptan: "Toptan / Dağıtım",
        diger: customSector.trim() || "Diğer"
      };
      const NEED_TITLES = {
        barkod_stok: "Barkodlu hızlı stok ve varyant takibi",
        cari_kasa: "Cari, fatura ve kasa takibi",
        uretim_izleme: "Üretim / imalat süreçlerini izleme",
        depo_sube: "Çoklu şube / depo yönetimi"
      };

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
          vatRate: vatRate,
          logoUrl: logoUrl,
          showAiBrief: Boolean(showAiBrief),
          sectorKey: sectorKey,
          sector: sectorKey === "diger" && customSector.trim() ? customSector.trim() : (SECTOR_TITLES[sectorKey] || "Genel"),
          customSector: customSector.trim(),
          needKey: needKey,
          primaryNeed: NEED_TITLES[needKey] || "Genel Stok & Satış",
          accentColor: accentColor || "blue",
          currencySymbol: currencySymbol || "₺",
          defaultUnit: defaultUnit || "Adet",
          lowStockThreshold: Number(lowStockThreshold) || 10,
          receiptFooterNote: receiptFooterNote || "",
          soundEffectsEnabled: Boolean(soundEffectsEnabled),
          onboardingCompleted: true,
          updatedAt: new Date().toISOString()
        };
        tx.set(profileRef, merged);
      });
      
      const p = await getUserProfile();
      setProfile(p);
      invalidateAndRefreshMasterCache().catch(() => {});
      logUserActivity("SETTINGS_UPDATE", "İşletme ve Profil Ayarları Güncellendi", {
        companyTitle: companyTitle.trim(),
        displayName: displayName.trim(),
        sectorKey,
        needKey,
        invoicePrefix: invoicePrefix.trim()
      }).catch(() => {});
      bildir({ type: "success", title: "Ayarlar Güncellendi", message: "Fatura, logo, sektör ve tercihleriniz başarıyla kaydedildi." });
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
      logUserActivity("LICENSE_ACTIVATE", "Lisans Anahtarı Etkinleştirildi", { key }).catch(() => {});
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

              {/* İŞLETME SEKTÖRÜ VE ÖNCELİKLİ İHTİYAÇ (KİŞİSELLEŞTİRME) */}
              <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🎯 İşletme Sektörü & Panel Kişiselleştirmesi
                </span>

                <div className="settings-grid-2col">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      Ana Faaliyet Alanı (Sektör)
                    </label>
                    <select
                      value={sectorKey}
                      onChange={e => setSectorKey(e.target.value)}
                      className="modern-input"
                      style={{ cursor: 'pointer', height: '42px', fontWeight: 700 }}
                    >
                      <option value="tekstil">🧵 Tekstil / İmalat</option>
                      <option value="perakende">🛍️ Perakende / Mağaza</option>
                      <option value="toptan">📦 Toptan / Dağıtım</option>
                      <option value="diger">🔧 Diğer</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      Öncelikli İhtiyaç
                    </label>
                    <select
                      value={needKey}
                      onChange={e => setNeedKey(e.target.value)}
                      className="modern-input"
                      style={{ cursor: 'pointer', height: '42px', fontWeight: 700 }}
                    >
                      <option value="barkod_stok">🏷️ Barkodlu Hızlı Stok & Varyant</option>
                      <option value="cari_kasa">🧾 Cari, Fatura & Kasa Takibi</option>
                      <option value="uretim_izleme">⚙️ Üretim / İmalat Süreçleri</option>
                      <option value="depo_sube">🏢 Çoklu Şube & Depo Yönetimi</option>
                    </select>
                  </div>
                </div>

                {sectorKey === "diger" && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      Özel Sektör Açıklaması
                    </label>
                    <input
                      value={customSector}
                      onChange={e => setCustomSector(e.target.value)}
                      placeholder="Örn: Oto Yedek Parça, Mobilya, E-ticaret..."
                      className="modern-input"
                    />
                  </div>
                )}
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

              {/* VURGU RENGİ (ACCENT COLOR PALETİ) */}
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.95rem', display: 'block' }}>🎨 Marka & Vurgu Rengi</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Butonlar, rozetler ve grafiklerde kullanılan ana renk.</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {Object.entries(ACCENT_PALETTES).map(([key, pal]) => {
                    const isSelected = accentColor === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setAccent(key);
                          setAccentColor(key);
                          bildir({ type: "success", title: "Renk Değiştirildi", message: `${pal.name} temaya uygulandı.` });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: isSelected ? `2px solid ${pal.hex}` : '1px solid var(--border-main)',
                          background: isSelected ? pal.bg : 'var(--card-bg)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: 'var(--text-main)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: pal.hex, display: 'inline-block' }} />
                        {pal.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ÇALIŞMA ALANI PARAMETRELERİ */}
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <strong style={{ fontSize: '0.95rem' }}>⚙️ Çalışma Alanı & Satış Parametreleri</strong>

                <div className="settings-grid-2col">
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Para Birimi Simgesi</label>
                    <select
                      value={currencySymbol}
                      onChange={e => setCurrencySymbol(e.target.value)}
                      className="modern-input"
                      style={{ fontWeight: 700, height: '40px' }}
                    >
                      <option value="₺">₺ - Türk Lirası (TRY)</option>
                      <option value="$">$ - ABD Doları (USD)</option>
                      <option value="€">€ - Euro (EUR)</option>
                      <option value="£">£ - İngiliz Sterlini (GBP)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Varsayılan Ürün Birimi</label>
                    <select
                      value={defaultUnit}
                      onChange={e => setDefaultUnit(e.target.value)}
                      className="modern-input"
                      style={{ fontWeight: 700, height: '40px' }}
                    >
                      <option value="Adet">Adet (Standart)</option>
                      <option value="Metre">Metre (Kumaş / Kablo / Profil)</option>
                      <option value="Top">Top / Rulo (Tekstil Kumaş)</option>
                      <option value="Kg">Kilogram (Ağırlık)</option>
                      <option value="Paket">Paket (Ambalaj)</option>
                      <option value="Koli">Koli (Toptan Dağıtım)</option>
                      <option value="Çift">Çift (Ayakkabı / Çorap)</option>
                      <option value="Litre">Litre (Sıvı)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-grid-2col">
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Düşük Stok Uyarı Eşiği</label>
                    <select
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(e.target.value)}
                      className="modern-input"
                      style={{ fontWeight: 700, height: '40px' }}
                    >
                      <option value="3">Kalan Stok &lt; 3 Adet</option>
                      <option value="5">Kalan Stok &lt; 5 Adet</option>
                      <option value="10">Kalan Stok &lt; 10 Adet (Önerilen)</option>
                      <option value="20">Kalan Stok &lt; 20 Adet</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sesli İşlem Onayları</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={soundEffectsEnabled} 
                        onChange={e => setSoundEffectsEnabled(e.target.checked)} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Barkod & Satış Bip Sesi</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fiş / Fatura Dipnot Mesajı</label>
                  <input
                    value={receiptFooterNote}
                    onChange={e => setReceiptFooterNote(e.target.value)}
                    placeholder="Örn: Bizi tercih ettiğiniz için teşekkür ederiz. Değişim 14 gün içindedir."
                    className="modern-input"
                  />
                </div>
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
