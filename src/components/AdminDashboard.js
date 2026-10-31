"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import NotFound from "./NotFound";
import { 
  FiUsers, FiActivity, FiClock, FiSmartphone, FiMonitor, 
  FiCheckCircle, FiAlertCircle, FiSearch, FiRefreshCw, FiDownload, 
  FiChevronRight, FiX, FiLayers, FiDollarSign, FiShoppingBag, 
  FiCalendar, FiHardDrive, FiBarChart2, FiShield, FiExternalLink, 
  FiCopy, FiTrendingUp, FiZap, FiFileText, FiTag, FiLogIn, FiEye,
  FiKey, FiLock, FiUnlock
} from "react-icons/fi";
import * as XLSX from "xlsx";

const AUTHORIZED_EMAIL = "abimer2350@gmail.com";
const MASTER_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";
const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

function generateAdminLicenseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let raw = "";
  for (let i = 0; i < 16; i++) {
    raw += alphabet[bytes[i] % alphabet.length];
  }
  return `SP-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

// Yardımcı: Süre formatlayıcı (Saniyeyi "X sa Y dk" formatına dönüştürür)
function formatSeconds(sec) {
  const total = Number(sec || 0);
  if (total <= 0) return "0 dk";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours} sa ${minutes} dk`;
  if (minutes > 0) return `${minutes} dk ${seconds} sn`;
  return `${seconds} sn`;
}

// Yardımcı: Göreli zaman (Örn: "5 dk önce", "2 saat önce")
function formatRelativeTime(dateStr) {
  if (!dateStr) return "Kayıt yok";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Az önce";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} gün önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

// Yardımcı: Tam tarih
function formatFullDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Filtreler & Sıralama
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastActive"); // lastActive, activeTime, salesVolume, createdAt, streak

  // Detay İnceleme Modalı
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("telemetry"); // telemetry, license, survey, logs, records
  const [activeRecordsSubTab, setActiveRecordsSubTab] = useState("products"); // products, sales, customers, ledger
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [copiedUid, setCopiedUid] = useState(false);

  // Uzaktan Politika & Lisans Yönetimi State
  const [globalPolicy, setGlobalPolicy] = useState({
    allowFreeUnlimited: true,
    blockOnExpiry: false,
    minDesktopVersion: "1.0.0",
    forceUpdate: false,
  });
  const [policySaving, setPolicySaving] = useState(false);
  const [policySavedMsg, setPolicySavedMsg] = useState("");
  const [generatedKeyInfo, setGeneratedKeyInfo] = useState(null);
  const [newKeyDays, setNewKeyDays] = useState("365"); // "0" = Sınırsız, "30", "365"
  const [licenseSaving, setLicenseSaving] = useState(false);
  const [licenseStatusMsg, setLicenseStatusMsg] = useState("");
  const [customEndDateInput, setCustomEndDateInput] = useState("");
  const [disableReasonInput, setDisableReasonInput] = useState("");
  const [copiedLicenseKey, setCopiedLicenseKey] = useState(false);

  // Yetki Kontrolü
  const isUserAuthorized = useMemo(() => {
    if (!user) return false;
    const emailMatch = user.email?.trim().toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();
    const uidMatch = user.uid === MASTER_ADMIN_UID;
    return emailMatch || uidMatch;
  }, [user]);

  // Kullanıcıları API'den çek
  const fetchUsers = async () => {
    if (!user || !isUserAuthorized) return;
    setRefreshing(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({})
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStats(json.stats);
          setUsersList(json.users || []);
        }
      }
    } catch (err) {
      console.error("Kullanıcıları çekme hatası:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchGlobalPolicy = async () => {
    if (!db || !isUserAuthorized) return;
    try {
      const policySnap = await getDoc(doc(db, "system_configs", "app_policy"));
      if (policySnap.exists()) {
        const d = policySnap.data() || {};
        setGlobalPolicy({
          allowFreeUnlimited: d.allowFreeUnlimited !== false,
          blockOnExpiry: Boolean(d.blockOnExpiry),
          minDesktopVersion: d.minDesktopVersion || "1.0.0",
          forceUpdate: Boolean(d.forceUpdate),
        });
      }
    } catch (err) {
      console.warn("Genel politika okunamadı:", err);
    }
  };

  const handleSaveGlobalPolicy = async (nextPolicyOverride = null) => {
    if (!db || !isUserAuthorized) return;
    const payload = nextPolicyOverride || globalPolicy;
    setPolicySaving(true);
    setPolicySavedMsg("");
    try {
      await setDoc(
        doc(db, "system_configs", "app_policy"),
        {
          allowFreeUnlimited: Boolean(payload.allowFreeUnlimited),
          blockOnExpiry: Boolean(payload.blockOnExpiry),
          minDesktopVersion: String(payload.minDesktopVersion || "1.0.0").trim(),
          forceUpdate: Boolean(payload.forceUpdate),
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || MASTER_ADMIN_UID,
        },
        { merge: true }
      );
      if (nextPolicyOverride) setGlobalPolicy(nextPolicyOverride);
      setPolicySavedMsg("Kaydedildi");
      setTimeout(() => setPolicySavedMsg(""), 2500);
    } catch (err) {
      alert("Politika kaydedilemedi: " + err.message);
    } finally {
      setPolicySaving(false);
    }
  };

  const handleGenerateStandaloneKey = async () => {
    if (!db || !isUserAuthorized) return;
    setPolicySaving(true);
    try {
      const key = generateAdminLicenseKey();
      const days = Number(newKeyDays || 0);
      const isUnlimited = days <= 0;
      const nowIso = new Date().toISOString();
      await setDoc(doc(db, "licenses", key), {
        key,
        status: "unused",
        isUsed: false,
        isUnlimited,
        durationDays: isUnlimited ? 0 : days,
        createdAt: nowIso,
        createdBy: user?.email || MASTER_ADMIN_UID,
      });
      setGeneratedKeyInfo({ key, isUnlimited, durationDays: days });
      navigator.clipboard?.writeText(key).catch(() => {});
    } catch (err) {
      alert("Lisans anahtarı üretilemedi: " + err.message);
    } finally {
      setPolicySaving(false);
    }
  };

  const updateTargetUserLicense = async (targetUid, updates, statusToast = "Güncellendi") => {
    if (!db || !targetUid || !isUserAuthorized) return;
    setLicenseSaving(true);
    setLicenseStatusMsg("");
    try {
      const nowIso = new Date().toISOString();
      const profRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "profile", "user_doc");
      await setDoc(profRef, { ...updates, updatedAt: nowIso }, { merge: true });

      setUsersList((prev) =>
        prev.map((item) => {
          if (item.uid !== targetUid) return item;
          const nextRemoteDisabled =
            updates.remoteDisabled !== undefined ? updates.remoteDisabled : item.remoteDisabled;
          const nextIsUnlimited =
            updates.isUnlimited !== undefined ? updates.isUnlimited : item.isUnlimited;
          const nextEndDate =
            updates.subscriptionEndDate !== undefined
              ? nextIsUnlimited
                ? null
                : updates.subscriptionEndDate
              : item.subscriptionEndDate;
          const nextExpired =
            updates.subscriptionStatus === "expired" ||
            (!nextIsUnlimited && nextEndDate && new Date(nextEndDate).getTime() < Date.now());
          return {
            ...item,
            ...updates,
            remoteDisabled: nextRemoteDisabled,
            isUnlimited: nextIsUnlimited,
            subscriptionEndDate: nextEndDate,
            isLicenseExpired: nextExpired,
            subscriptionStatus: nextRemoteDisabled
              ? "suspended"
              : nextExpired
                ? "expired"
                : nextIsUnlimited
                  ? "active_lifetime"
                  : "active",
          };
        })
      );

      setSelectedUser((prev) =>
        prev && prev.uid === targetUid
          ? {
              ...prev,
              ...updates,
              subscriptionEndDate:
                updates.isUnlimited === true
                  ? null
                  : updates.subscriptionEndDate !== undefined
                    ? updates.subscriptionEndDate
                    : prev.subscriptionEndDate,
            }
          : prev
      );

      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              profile: { ...(prev.profile || {}), ...updates },
            }
          : prev
      );

      setLicenseStatusMsg(statusToast);
      setTimeout(() => setLicenseStatusMsg(""), 3000);
    } catch (err) {
      alert("Kullanıcı lisansı güncellenemedi: " + err.message);
    } finally {
      setLicenseSaving(false);
    }
  };

  const handleAssignGeneratedKeyToUser = async (targetUser, durationDays) => {
    if (!db || !targetUser?.uid || !isUserAuthorized) return;
    setLicenseSaving(true);
    try {
      const key = generateAdminLicenseKey();
      const now = new Date();
      const nowIso = now.toISOString();
      const isUnlimited = !durationDays || Number(durationDays) <= 0;
      const endDate = new Date(now);
      if (isUnlimited) {
        endDate.setFullYear(endDate.getFullYear() + 100);
      } else {
        endDate.setDate(endDate.getDate() + Number(durationDays));
      }
      const endIso = endDate.toISOString();

      await setDoc(doc(db, "licenses", key), {
        key,
        status: "activated",
        isUsed: true,
        isUnlimited,
        durationDays: isUnlimited ? 0 : Number(durationDays),
        targetUid: targetUser.uid,
        activatedBy: targetUser.uid,
        activatedByUid: targetUser.uid,
        activatedEmail: targetUser.email || "",
        activatedAt: nowIso,
        createdAt: nowIso,
        createdBy: user?.email || MASTER_ADMIN_UID,
      });

      await updateTargetUserLicense(
        targetUser.uid,
        {
          licenseKey: key,
          licenseKeyMasked: `${key.slice(0, 7)}-****-****-${key.slice(-4)}`,
          licenseActivatedAt: nowIso,
          membershipStartDate: targetUser.membershipStartDate || targetUser.createdAt || nowIso,
          isUnlimited,
          subscriptionEndDate: endIso,
          subscriptionStatus: isUnlimited ? "active_lifetime" : "active",
          remoteDisabled: false,
          remoteDisabledReason: null,
          adminGrantedUnlimited: isUnlimited,
        },
        "Lisans anahtarı üretildi ve tanımlandı"
      );
      if (!isUnlimited) {
        setCustomEndDateInput(endIso.slice(0, 10));
      } else {
        setCustomEndDateInput("");
      }
    } catch (err) {
      alert("Lisans atama hatası: " + err.message);
      setLicenseSaving(false);
    }
  };

  useEffect(() => {
    if (isUserAuthorized) {
      fetchUsers();
      fetchGlobalPolicy();
    }
  }, [isUserAuthorized]);

  // Tekil Kullanıcı Detayını Çek
  const handleOpenUserDetail = async (targetUser) => {
    setSelectedUser(targetUser);
    setDetailLoading(true);
    setUserDetails(null);
    setActiveDetailTab("telemetry");
    setLicenseStatusMsg("");
    setDisableReasonInput(targetUser.remoteDisabledReason || "");
    setCustomEndDateInput(
      targetUser.subscriptionEndDate ? String(targetUser.subscriptionEndDate).slice(0, 10) : ""
    );

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetUid: targetUser.uid
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setUserDetails(json.user);
        }
      }
    } catch (err) {
      console.error("Detay çekme hatası:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCopyUid = (uid) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Excel Dışa Aktarma
  const handleExportExcel = () => {
    if (!usersList.length) return;
    const rows = usersList.map((u, i) => ({
      "Sıra": i + 1,
      "E-Posta": u.email,
      "İsim / Unvan": u.displayName,
      "Firma": u.companyTitle,
      "Sektör": u.sector,
      "Öncelikli İhtiyaç": u.primaryNeed,
      "Son Aktiflik": formatFullDate(u.lastActiveAt),
      "Son Giriş": formatFullDate(u.lastLoginAt),
      "Aktif Kullanım Süresi": formatSeconds(u.totalActiveSeconds),
      "Süreklilik Serisi (Gün)": u.streakDays,
      "Giriş Sayısı": u.loginCount,
      "Ürün Sayısı": u.productsCount,
      "Satış Sayısı": u.salesCount,
      "Toplam Ciro (₺)": u.totalSalesVolume,
      "Müşteri Sayısı": u.customersCount,
      "Cihaz Türü": u.deviceInfo?.deviceType || "—",
      "İşletim Sistemi": u.deviceInfo?.os || "—",
      "Tarayıcı": u.deviceInfo?.browser || "—",
      "UID": u.uid
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kullanicilar_Telemetri");
    XLSX.writeFile(wb, `StokPro_Kullanici_Telemetri_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtrelenmiş ve Sıralanmış Liste
  const filteredUsers = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const query = searchTerm.toLowerCase().trim();

    return usersList
      .filter((u) => {
        const matchesSearch =
          !query ||
          u.email?.toLowerCase().includes(query) ||
          u.displayName?.toLowerCase().includes(query) ||
          u.companyTitle?.toLowerCase().includes(query) ||
          u.uid?.toLowerCase().includes(query) ||
          u.sector?.toLowerCase().includes(query);

        const matchesSector =
          sectorFilter === "all" ||
          u.sector?.toLowerCase().includes(sectorFilter.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === "active_today") {
          const lastActiveDate = u.lastActiveAt ? new Date(u.lastActiveAt).toISOString().slice(0, 10) : "";
          matchesStatus = lastActiveDate === todayStr;
        } else if (statusFilter === "survey_completed") {
          matchesStatus = u.onboardingCompleted && !u.onboardingSkipped;
        } else if (statusFilter === "has_sales") {
          matchesStatus = Number(u.salesCount || 0) > 0;
        } else if (statusFilter === "has_streak") {
          matchesStatus = Number(u.streakDays || 0) >= 2;
        } else if (statusFilter === "remote_disabled") {
          matchesStatus = Boolean(u.remoteDisabled);
        } else if (statusFilter === "expired_license") {
          matchesStatus = Boolean(u.isLicenseExpired);
        } else if (statusFilter === "licensed") {
          matchesStatus = Boolean(u.licenseKey);
        }

        return matchesSearch && matchesSector && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "lastActive") {
          return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime();
        }
        if (sortBy === "activeTime") {
          return (b.totalActiveSeconds || 0) - (a.totalActiveSeconds || 0);
        }
        if (sortBy === "salesVolume") {
          return (b.totalSalesVolume || 0) - (a.totalSalesVolume || 0);
        }
        if (sortBy === "streak") {
          return (b.streakDays || 0) - (a.streakDays || 0);
        }
        if (sortBy === "createdAt") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [usersList, searchTerm, sectorFilter, statusFilter, sortBy]);

  // Auth Yükleniyor Kontrolü
  if (authLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "75vh", gap: "1rem" }}>
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Güvenlik protokolü başlatılıyor...</p>
      </div>
    );
  }

  // Yetkisiz Erişim -> 404 Sayfası
  if (!isUserAuthorized) {
    return <NotFound />;
  }

  return (
    <div style={{ padding: "1.5rem 1.5rem 4rem 1.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* ÜST BAŞLIK VE AKSİYONLAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.6rem", borderRadius: "999px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              SECURE_CONN // ADMIN_ROOT
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "monospace" }}>v4.8 Telemetry</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Kullanıcı Telemetrisi & Detaylı Denetim Paneli
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0.3rem 0 0 0" }}>
            Tüm kullanıcıların aktif kullanım süreleri, süreklilik serileri (streak), anket yanıtları ve canlı veri girişleri tek merkezden izlenir.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button 
            onClick={fetchUsers} 
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            Yenile
          </button>
          <button 
            onClick={handleExportExcel}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1rem", borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)" }}
          >
            <FiDownload size={16} />
            Excel İndir
          </button>
        </div>
      </div>

      {/* ÜST METRİK ŞERİDİ (KPI STATS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
            <span>TOPLAM KAYITLI</span>
            <FiUsers size={18} style={{ color: "#3b82f6" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--text-main)" }}>
            {stats ? stats.totalUsers : usersList.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sistemdeki tüm kayıtlı esnaf</div>
        </div>

        <div style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
            <span>BUGÜN AKTİF</span>
            <FiActivity size={18} style={{ color: "#10b981" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#10b981" }}>
            {stats ? stats.activeTodayCount : "—"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Son 24 saatte işlem yapan</div>
        </div>

        <div style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
            <span>TOPLAM SATIŞ CİROSU</span>
            <FiDollarSign size={18} style={{ color: "#f59e0b" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#f59e0b" }}>
            {stats ? Number(stats.totalSalesVolume || 0).toLocaleString("tr-TR") : 0} ₺
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stats?.totalSalesCount || 0} adet işlem</div>
        </div>

        <div style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
            <span>ANKET TAMAMLAMA</span>
            <FiCheckCircle size={18} style={{ color: "#8b5cf6" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#8b5cf6" }}>
            %{stats ? stats.surveyRate : 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{stats?.surveyCompletedCount || 0} kullanıcı yanıtladı</div>
        </div>

        <div style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
            <span>ORT. AKTİF SÜRE</span>
            <FiClock size={18} style={{ color: "#06b6d4" }} />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#06b6d4", paddingTop: "0.2rem" }}>
            {stats ? formatSeconds(stats.avgActiveSeconds) : "—"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Kullanıcı başına aktiflik</div>
        </div>
      </div>

      {/* GENEL ERİŞİM, GÜNCELLEME & LİSANS KONTROL ÇUBUĞU */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", background: "var(--card-bg)", padding: "1rem 1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FiShield size={18} style={{ color: "#10b981" }} />
            <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>Uzaktan Lisans Politikası</span>
          </div>

          <button
            type="button"
            disabled={policySaving}
            onClick={() =>
              handleSaveGlobalPolicy({
                ...globalPolicy,
                allowFreeUnlimited: !globalPolicy.allowFreeUnlimited,
              })
            }
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "0.5rem",
              border: "1px solid",
              borderColor: globalPolicy.allowFreeUnlimited ? "#10b981" : "#ef4444",
              background: globalPolicy.allowFreeUnlimited ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: globalPolicy.allowFreeUnlimited ? "#10b981" : "#ef4444",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Genel Sınırsız Kullanım: {globalPolicy.allowFreeUnlimited ? "AÇIK" : "KAPALI (Lisans Zorunlu)"}
          </button>

          <button
            type="button"
            disabled={policySaving}
            onClick={() =>
              handleSaveGlobalPolicy({
                ...globalPolicy,
                blockOnExpiry: !globalPolicy.blockOnExpiry,
              })
            }
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border-color)",
              background: "var(--bg-main)",
              color: globalPolicy.blockOnExpiry ? "#f59e0b" : "var(--text-main)",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Süre Bitimi: {globalPolicy.blockOnExpiry ? "Erişimi Kilitle" : "Uyarı Göster"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Min Sürüm:</span>
            <input
              type="text"
              value={globalPolicy.minDesktopVersion}
              onChange={(e) => setGlobalPolicy((p) => ({ ...p, minDesktopVersion: e.target.value }))}
              style={{ width: "74px", padding: "0.38rem 0.55rem", borderRadius: "0.4rem", border: "1px solid var(--border-color)", background: "var(--bg-main)", color: "var(--text-main)", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}
            />
            <button
              type="button"
              disabled={policySaving}
              onClick={() => handleSaveGlobalPolicy()}
              style={{ padding: "0.4rem 0.7rem", borderRadius: "0.4rem", border: "none", background: "#3b82f6", color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
            >
              Kaydet
            </button>
            {policySavedMsg && (
              <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>{policySavedMsg}</span>
            )}
          </div>
        </div>

        {/* Bağımsız Lisans Anahtarı Üretici */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
          <select
            value={newKeyDays}
            onChange={(e) => setNewKeyDays(e.target.value)}
            style={{ padding: "0.42rem 0.65rem", borderRadius: "0.45rem", border: "1px solid var(--border-color)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.8rem", fontWeight: 600 }}
          >
            <option value="30">30 Günlük Anahtar</option>
            <option value="365">1 Yıllık Anahtar</option>
            <option value="0">Sınırsız Anahtar</option>
          </select>
          <button
            type="button"
            disabled={policySaving}
            onClick={handleGenerateStandaloneKey}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", borderRadius: "0.45rem", border: "1px solid #8b5cf6", background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
          >
            <FiKey size={14} />
            Anahtar Üret
          </button>
          {generatedKeyInfo && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(generatedKeyInfo.key);
                setCopiedLicenseKey(true);
                setTimeout(() => setCopiedLicenseKey(false), 1800);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.65rem", borderRadius: "0.45rem", border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
              title="Kopyalamak için tıklayın"
            >
              <span>{generatedKeyInfo.key}</span>
              <FiCopy size={12} />
              {copiedLicenseKey && <span>Kopyalandı</span>}
            </button>
          )}
        </div>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", background: "var(--card-bg)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)" }}>
        <div style={{ flex: "1 1 280px", display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-main)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)" }}>
          <FiSearch size={18} style={{ color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="E-posta, isim, firma, sektör veya UID ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--text-main)", fontSize: "0.875rem" }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
              <FiX size={16} />
            </button>
          )}
        </div>

        <select 
          value={sectorFilter} 
          onChange={(e) => setSectorFilter(e.target.value)}
          style={{ padding: "0.55rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <option value="all">Tüm Sektörler</option>
          <option value="tekstil">Tekstil / İmalat</option>
          <option value="perakende">Perakende / Mağaza</option>
          <option value="toptan">Toptan / Dağıtım</option>
          <option value="diger">Diğer</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "0.55rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="active_today">Bugün Aktif Olanlar</option>
          <option value="survey_completed">Anketi Tamamlayanlar</option>
          <option value="has_sales">Satış Kaydı Olanlar</option>
          <option value="has_streak">Süreklilik Serisi Olanlar (2+ gün)</option>
          <option value="licensed">Lisans Anahtarı Tanımlı Olanlar</option>
          <option value="expired_license">Üyelik Süresi Dolanlar</option>
          <option value="remote_disabled">Uzaktan Kapatılanlar</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "0.55rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <option value="lastActive">Sırala: Son Aktiflik</option>
          <option value="activeTime">Sırala: Aktif Kullanım Süresi</option>
          <option value="salesVolume">Sırala: Toplam Ciro (₺)</option>
          <option value="streak">Sırala: Süreklilik Serisi (Streak)</option>
          <option value="createdAt">Sırala: Kayıt Tarihi</option>
        </select>

        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginLeft: "auto" }}>
          {filteredUsers.length} kullanıcı listelendi
        </div>
      </div>

      {/* KULLANICILAR ANA TABLOSU */}
      <div style={{ background: "var(--card-bg)", borderRadius: "0.75rem", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "0.85rem 1rem" }}>Kullanıcı / İşletme</th>
                <th style={{ padding: "0.85rem 1rem" }}>Sektör / İhtiyaç</th>
                <th style={{ padding: "0.85rem 1rem" }}>Son Aktiflik & Giriş</th>
                <th style={{ padding: "0.85rem 1rem" }}>Aktif Süre & Süreklilik</th>
                <th style={{ padding: "0.85rem 1rem" }}>Veri Girişleri</th>
                <th style={{ padding: "0.85rem 1rem" }}>Lisans & Erişim</th>
                <th style={{ padding: "0.85rem 1rem" }}>Cihaz & Ortam</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Detaylı İncele</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    Kriterlere uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isTodayActive = u.lastActiveAt && new Date(u.lastActiveAt).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

                  return (
                    <tr 
                      key={u.uid}
                      style={{ 
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background 0.15s ease"
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      {/* Kullanıcı / İşletme */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                            {u.email ? u.email[0].toUpperCase() : "U"}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                              {u.displayName !== "İsimsiz" ? u.displayName : u.email}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {u.email}
                            </div>
                            {u.companyTitle !== "—" && (
                              <div style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 600 }}>
                                {u.companyTitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sektör / İhtiyaç */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                          <span style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "0.375rem", background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", fontSize: "0.75rem", fontWeight: 700 }}>
                            {u.sector}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {u.primaryNeed}
                          </span>
                        </div>
                      </td>

                      {/* Son Aktiflik & Giriş */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, fontSize: "0.8rem", color: isTodayActive ? "#10b981" : "var(--text-main)" }}>
                            {isTodayActive && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />}
                            {formatRelativeTime(u.lastActiveAt)}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Son Giriş: {formatRelativeTime(u.lastLoginAt)}
                          </div>
                        </div>
                      </td>

                      {/* Aktif Süre & Süreklilik */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div style={{ fontWeight: 700, color: "#06b6d4" }}>
                            {formatSeconds(u.totalActiveSeconds)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem" }}>
                            {u.streakDays > 0 ? (
                              <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                                🔥 {u.streakDays} gün seri
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>Seri yok</span>
                            )}
                            <span style={{ color: "var(--text-muted)" }}>({u.activeDaysCount} aktif gün)</span>
                          </div>
                        </div>
                      </td>

                      {/* Veri Girişleri */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.78rem" }}>
                          <div>
                            <strong style={{ color: "var(--text-main)" }}>{u.productsCount}</strong> <span style={{ color: "var(--text-muted)" }}>Ürün</span>
                            <span style={{ margin: "0 0.3rem", color: "var(--border-color)" }}>•</span>
                            <strong style={{ color: "var(--text-main)" }}>{u.salesCount}</strong> <span style={{ color: "var(--text-muted)" }}>Satış</span>
                          </div>
                          <div style={{ color: "#10b981", fontWeight: 700 }}>
                            {Number(u.totalSalesVolume || 0).toLocaleString("tr-TR")} ₺ Ciro
                          </div>
                        </div>
                      </td>

                      {/* Lisans & Erişim */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                          {u.remoteDisabled ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: "0.375rem", background: "rgba(239, 68, 68, 0.14)", color: "#ef4444", fontSize: "0.72rem", fontWeight: 800 }}>
                              <FiLock size={11} />
                              Uzaktan Kapatıldı
                            </span>
                          ) : u.isLicenseExpired ? (
                            <span style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "0.375rem", background: "rgba(245, 158, 11, 0.14)", color: "#f59e0b", fontSize: "0.72rem", fontWeight: 800 }}>
                              Süresi Doldu
                            </span>
                          ) : u.isUnlimited !== false ? (
                            <span style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "0.375rem", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "0.72rem", fontWeight: 800 }}>
                              Sınırsız Üyelik
                            </span>
                          ) : (
                            <span style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "0.375rem", background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", fontSize: "0.72rem", fontWeight: 800 }}>
                              Süreli ({u.subscriptionEndDate ? new Date(u.subscriptionEndDate).toLocaleDateString("tr-TR") : "—"})
                            </span>
                          )}
                          {u.licenseKey && (
                            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                              {u.licenseKey}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cihaz & Ortam */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, color: "var(--text-main)" }}>
                            {u.deviceInfo?.deviceType === "Mobil" ? <FiSmartphone size={14} /> : <FiMonitor size={14} />}
                            {u.deviceInfo?.deviceType || "Masaüstü"}
                          </div>
                          <div>{u.deviceInfo?.browser || "—"} / {u.deviceInfo?.os || "—"}</div>
                        </div>
                      </td>

                      {/* Detay Butonu */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                        <button 
                          onClick={() => handleOpenUserDetail(u)}
                          style={{ 
                            padding: "0.45rem 0.85rem", 
                            borderRadius: "0.5rem", 
                            border: "1px solid #3b82f6", 
                            background: "rgba(59, 130, 246, 0.08)", 
                            color: "#3b82f6", 
                            cursor: "pointer", 
                            fontWeight: 700, 
                            fontSize: "0.8rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <FiEye size={14} />
                          İncele
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TEK KULLANICI DERİNLEMESİNE İNCELEME MODALI / ÇEKMECESİ                    */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn 0.2s ease"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUser(null);
          }}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: "850px",
              height: "100vh",
              background: "var(--card-bg)",
              borderLeft: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "var(--bg-main)" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #1e40af)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.25rem" }}>
                  {selectedUser.email ? selectedUser.email[0].toUpperCase() : "U"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                      {selectedUser.displayName !== "İsimsiz" ? selectedUser.displayName : selectedUser.email}
                    </h2>
                    <span style={{ padding: "0.2rem 0.5rem", borderRadius: "999px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontSize: "0.7rem", fontWeight: 800 }}>
                      {selectedUser.sector}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {selectedUser.email}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>UID: {selectedUser.uid}</span>
                    <button 
                      onClick={() => handleCopyUid(selectedUser.uid)} 
                      style={{ background: "transparent", border: "none", color: copiedUid ? "#10b981" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                      title="UID Kopyala"
                    >
                      {copiedUid ? <FiCheckCircle size={12} /> : <FiCopy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedUser(null)}
                style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "none", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Quick Metrics Bar in Modal */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--border-color)", background: "var(--card-bg)" }}>
              <div style={{ padding: "0.75rem 1rem", borderRight: "1px solid var(--border-color)", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>AKTİF KULLANIM</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#06b6d4" }}>{formatSeconds(selectedUser.totalActiveSeconds)}</div>
              </div>
              <div style={{ padding: "0.75rem 1rem", borderRight: "1px solid var(--border-color)", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>SÜREKLİLİK SERİSİ</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f59e0b" }}>🔥 {selectedUser.streakDays} Gün</div>
              </div>
              <div style={{ padding: "0.75rem 1rem", borderRight: "1px solid var(--border-color)", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>TOPLAM CİRO</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#10b981" }}>{Number(selectedUser.totalSalesVolume || 0).toLocaleString("tr-TR")} ₺</div>
              </div>
              <div style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>GİRİŞ SAYISI</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#3b82f6" }}>{selectedUser.loginCount || 1} kez</div>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--bg-main)", overflowX: "auto" }}>
              <button 
                onClick={() => setActiveDetailTab("telemetry")}
                style={{ 
                  padding: "0.8rem 1.25rem", 
                  border: "none", 
                  borderBottom: activeDetailTab === "telemetry" ? "2px solid #3b82f6" : "2px solid transparent",
                  background: "transparent", 
                  color: activeDetailTab === "telemetry" ? "#3b82f6" : "var(--text-muted)",
                  fontWeight: 700, 
                  fontSize: "0.85rem", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <FiActivity size={16} />
                Cihaz & Telemetri
              </button>
              <button 
                onClick={() => setActiveDetailTab("license")}
                style={{ 
                  padding: "0.8rem 1.25rem", 
                  border: "none", 
                  borderBottom: activeDetailTab === "license" ? "2px solid #8b5cf6" : "2px solid transparent",
                  background: "transparent", 
                  color: activeDetailTab === "license" ? "#8b5cf6" : "var(--text-muted)",
                  fontWeight: 700, 
                  fontSize: "0.85rem", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <FiKey size={16} />
                Lisans & Erişim
              </button>
              <button 
                onClick={() => setActiveDetailTab("survey")}
                style={{ 
                  padding: "0.8rem 1.25rem", 
                  border: "none", 
                  borderBottom: activeDetailTab === "survey" ? "2px solid #3b82f6" : "2px solid transparent",
                  background: "transparent", 
                  color: activeDetailTab === "survey" ? "#3b82f6" : "var(--text-muted)",
                  fontWeight: 700, 
                  fontSize: "0.85rem", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <FiCheckCircle size={16} />
                Anket Yanıtları
              </button>
              <button 
                onClick={() => setActiveDetailTab("logs")}
                style={{ 
                  padding: "0.8rem 1.25rem", 
                  border: "none", 
                  borderBottom: activeDetailTab === "logs" ? "2px solid #3b82f6" : "2px solid transparent",
                  background: "transparent", 
                  color: activeDetailTab === "logs" ? "#3b82f6" : "var(--text-muted)",
                  fontWeight: 700, 
                  fontSize: "0.85rem", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <FiClock size={16} />
                Canlı Olay Günlüğü ({userDetails?.logs?.length || 0})
              </button>
              <button 
                onClick={() => setActiveDetailTab("records")}
                style={{ 
                  padding: "0.8rem 1.25rem", 
                  border: "none", 
                  borderBottom: activeDetailTab === "records" ? "2px solid #3b82f6" : "2px solid transparent",
                  background: "transparent", 
                  color: activeDetailTab === "records" ? "#3b82f6" : "var(--text-muted)",
                  fontWeight: 700, 
                  fontSize: "0.85rem", 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <FiHardDrive size={16} />
                Kullanıcının Verileri
              </button>
            </div>

            {/* Modal Body Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
              {detailLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", gap: "1rem" }}>
                  <div className="spinner" />
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Kullanıcının tüm hareketleri deşifre ediliyor...</p>
                </div>
              ) : (
                <>
                  {/* TAB 0: LİSANS, ÜYELİK TARİHİ VE UZAKTAN ERİŞİM KONTROLÜ */}
                  {activeDetailTab === "license" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {licenseStatusMsg && (
                        <div style={{ padding: "0.65rem 1rem", borderRadius: "0.5rem", background: "rgba(16, 185, 129, 0.12)", border: "1px solid #10b981", color: "#10b981", fontSize: "0.82rem", fontWeight: 700 }}>
                          {licenseStatusMsg}
                        </div>
                      )}

                      {/* 1. Uzaktan Kapat / Aç */}
                      <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {selectedUser.remoteDisabled ? <FiLock size={16} style={{ color: "#ef4444" }} /> : <FiUnlock size={16} style={{ color: "#10b981" }} />}
                              Uzaktan Erişim Durumu
                            </h3>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: selectedUser.remoteDisabled ? "#ef4444" : "#10b981" }}>
                              {selectedUser.remoteDisabled ? "Kapatıldı (Askıda)" : "Aktif"}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={licenseSaving}
                            onClick={() => {
                              const nextDisabled = !selectedUser.remoteDisabled;
                              updateTargetUserLicense(
                                selectedUser.uid,
                                {
                                  remoteDisabled: nextDisabled,
                                  remoteDisabledReason: nextDisabled ? (disableReasonInput.trim() || null) : null,
                                  subscriptionStatus: nextDisabled
                                    ? "suspended"
                                    : selectedUser.isUnlimited !== false
                                      ? "active_lifetime"
                                      : "active",
                                },
                                nextDisabled ? "Kullanıcı erişimi uzaktan kapatıldı" : "Kullanıcı erişimi yeniden açıldı"
                              );
                            }}
                            style={{
                              padding: "0.55rem 1rem",
                              borderRadius: "0.5rem",
                              border: "none",
                              background: selectedUser.remoteDisabled ? "#10b981" : "#ef4444",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "0.82rem",
                              cursor: "pointer",
                            }}
                          >
                            {selectedUser.remoteDisabled ? "Erişimi Yeniden Aç" : "Erişimi Uzaktan Kapat"}
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Kapatma notu (opsiyonel)"
                          value={disableReasonInput}
                          onChange={(e) => setDisableReasonInput(e.target.value)}
                          style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "0.82rem" }}
                        />
                      </div>

                      {/* 2. Üyelik Süresi & Bitiş Tarihi */}
                      <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiCalendar size={16} style={{ color: "#3b82f6" }} />
                          Üyelik Tipi & Tarihleri
                        </h3>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", fontSize: "0.82rem" }}>
                          <div style={{ padding: "0.7rem", borderRadius: "0.5rem", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Üyelik Başlangıcı</span>
                            <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>
                              {formatFullDate(selectedUser.membershipStartDate || selectedUser.createdAt)}
                            </div>
                          </div>
                          <div style={{ padding: "0.7rem", borderRadius: "0.5rem", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Üyelik Bitiş Tarihi</span>
                            <div style={{ fontWeight: 700, marginTop: "0.2rem", color: selectedUser.isLicenseExpired ? "#f59e0b" : "var(--text-main)" }}>
                              {selectedUser.isUnlimited !== false
                                ? "Sınırsız"
                                : formatFullDate(selectedUser.subscriptionEndDate)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          <button
                            type="button"
                            disabled={licenseSaving}
                            onClick={() => {
                              const life = new Date();
                              life.setFullYear(life.getFullYear() + 100);
                              setCustomEndDateInput("");
                              updateTargetUserLicense(
                                selectedUser.uid,
                                {
                                  isUnlimited: true,
                                  adminGrantedUnlimited: true,
                                  subscriptionStatus: "active_lifetime",
                                  subscriptionEndDate: life.toISOString(),
                                  remoteDisabled: false,
                                },
                                "Sınırsız üyelik tanımlandı"
                              );
                            }}
                            style={{ padding: "0.45rem 0.8rem", borderRadius: "0.45rem", border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                          >
                            Sınırsız Yap
                          </button>

                          <button
                            type="button"
                            disabled={licenseSaving}
                            onClick={() => {
                              const d = new Date(Date.now() + 30 * 86400000);
                              const iso = d.toISOString();
                              setCustomEndDateInput(iso.slice(0, 10));
                              updateTargetUserLicense(
                                selectedUser.uid,
                                {
                                  isUnlimited: false,
                                  subscriptionStatus: "active",
                                  subscriptionEndDate: iso,
                                  remoteDisabled: false,
                                },
                                "30 günlük üyelik tanımlandı"
                              );
                            }}
                            style={{ padding: "0.45rem 0.8rem", borderRadius: "0.45rem", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                          >
                            +30 Gün
                          </button>

                          <button
                            type="button"
                            disabled={licenseSaving}
                            onClick={() => {
                              const d = new Date(Date.now() + 365 * 86400000);
                              const iso = d.toISOString();
                              setCustomEndDateInput(iso.slice(0, 10));
                              updateTargetUserLicense(
                                selectedUser.uid,
                                {
                                  isUnlimited: false,
                                  subscriptionStatus: "active",
                                  subscriptionEndDate: iso,
                                  remoteDisabled: false,
                                },
                                "1 yıllık üyelik tanımlandı"
                              );
                            }}
                            style={{ padding: "0.45rem 0.8rem", borderRadius: "0.45rem", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                          >
                            +1 Yıl
                          </button>

                          <button
                            type="button"
                            disabled={licenseSaving}
                            onClick={() => {
                              const yesterday = new Date(Date.now() - 86400000).toISOString();
                              setCustomEndDateInput(yesterday.slice(0, 10));
                              updateTargetUserLicense(
                                selectedUser.uid,
                                {
                                  isUnlimited: false,
                                  subscriptionStatus: "expired",
                                  subscriptionEndDate: yesterday,
                                },
                                "Üyelik süresi sonlandırıldı"
                              );
                            }}
                            style={{ padding: "0.45rem 0.8rem", borderRadius: "0.45rem", border: "1px solid #f59e0b", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                          >
                            Süreyi Bitir
                          </button>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <input
                            type="date"
                            value={customEndDateInput}
                            onChange={(e) => setCustomEndDateInput(e.target.value)}
                            style={{ padding: "0.45rem 0.65rem", borderRadius: "0.45rem", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "0.82rem" }}
                          />
                          <button
                            type="button"
                            disabled={licenseSaving || !customEndDateInput}
                            onClick={() => {
                              const endIso = new Date(`${customEndDateInput}T23:59:59.000Z`).toISOString();
                              const isPast = new Date(endIso).getTime() < Date.now();
                              updateTargetUserLicense(
                                selectedUser.uid,
                                {
                                  isUnlimited: false,
                                  subscriptionStatus: isPast ? "expired" : "active",
                                  subscriptionEndDate: endIso,
                                },
                                "Bitiş tarihi kaydedildi"
                              );
                            }}
                            style={{ padding: "0.48rem 0.9rem", borderRadius: "0.45rem", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            Bitiş Tarihini Kaydet
                          </button>
                        </div>
                      </div>

                      {/* 3. Lisans Anahtarı Tanımlama */}
                      <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiKey size={16} style={{ color: "#8b5cf6" }} />
                          Lisans Anahtarı
                        </h3>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.7rem 0.9rem", borderRadius: "0.5rem", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.88rem", fontWeight: 700 }}>
                            {userDetails?.profile?.licenseKey || selectedUser.licenseKey || "Tanımlı anahtar yok"}
                          </span>
                          {(userDetails?.profile?.licenseKey || selectedUser.licenseKey) && (
                            <button
                              type="button"
                              onClick={() => {
                                const k = userDetails?.profile?.licenseKey || selectedUser.licenseKey;
                                navigator.clipboard?.writeText(k);
                              }}
                              style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                            >
                              <FiCopy size={13} />
                              Kopyala
                            </button>
                          )}
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          <button
                            type="button"
                            disabled={licenseSaving}
                            onClick={() => handleAssignGeneratedKeyToUser(selectedUser, 365)}
                            style={{ padding: "0.5rem 0.9rem", borderRadius: "0.45rem", border: "1px solid #8b5cf6", background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            1 Yıllık Anahtar Üret & Ata
                          </button>
                          <button
                            type="button"
                            disabled={licenseSaving}
                            onClick={() => handleAssignGeneratedKeyToUser(selectedUser, 0)}
                            style={{ padding: "0.5rem 0.9rem", borderRadius: "0.45rem", border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            Sınırsız Anahtar Üret & Ata
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: TELEMETRİ, CİHAZ VE SÜREKLİLİK */}
                  {activeDetailTab === "telemetry" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Cihaz Profili Kartı */}
                      <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiMonitor size={18} style={{ color: "#3b82f6" }} />
                          Cihaz, Tarayıcı ve Donanım Profili
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cihaz Türü:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
                              {selectedUser.deviceInfo?.deviceType || "Masaüstü"}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>İşletim Sistemi:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
                              {selectedUser.deviceInfo?.os || "Bilinmiyor"}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tarayıcı & Sürüm:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
                              {selectedUser.deviceInfo?.browser || "Bilinmiyor"}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ekran Çözünürlüğü:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
                              {selectedUser.deviceInfo?.screenResolution || "—"}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Uygulama Modu (PWA):</span>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: selectedUser.deviceInfo?.isPWA ? "#10b981" : "var(--text-muted)" }}>
                              {selectedUser.deviceInfo?.isPWA ? "Masaüstü/Mobil PWA" : "Web Tarayıcısı"}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Dil & Zaman Dilimi:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>
                              {selectedUser.deviceInfo?.language || "tr-TR"} ({selectedUser.deviceInfo?.timezone || "Europe/Istanbul"})
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Oturum & Süreklilik Detayları */}
                      <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiTrendingUp size={18} style={{ color: "#10b981" }} />
                          Kullanım Sürekliliği (Continuity & Retention)
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Kayıt Tarihi:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>
                              {formatFullDate(selectedUser.createdAt)}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Son Oturum Açılışı:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>
                              {formatFullDate(selectedUser.lastLoginAt)}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Son Canlı Etkileşim:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#10b981" }}>
                              {formatFullDate(selectedUser.lastActiveAt)}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Toplam Aktif Gün Sayısı:</span>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-main)" }}>
                              {selectedUser.activeDaysCount} gün
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sayfa Gezinti İstatistikleri (Page Views Breakdown) */}
                      <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiLayers size={18} style={{ color: "#f59e0b" }} />
                          Sayfa Gezinti & Modül Kullanım Dağılımı
                        </h3>
                        {Object.keys(selectedUser.pageViews || {}).length === 0 ? (
                          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Henüz sayfa gezinti telemetrisi kaydedilmedi.</div>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                            {Object.entries(selectedUser.pageViews || {}).map(([rawKey, count]) => {
                              const pathDisplay = rawKey.replace(/_/g, "/") || "/";
                              return (
                                <div key={rawKey} style={{ padding: "0.6rem 0.8rem", borderRadius: "0.5rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-main)" }}>{pathDisplay}</span>
                                  <span style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", padding: "0.15rem 0.45rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                                    {count} kez
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ANKET YANITLARI */}
                  {activeDetailTab === "survey" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ background: "var(--bg-main)", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FiCheckCircle size={18} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Onboarding Anketi Sonuçları</h3>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Kullanıcının ilk kayıt anında verdiği yanıtlar</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                          <div style={{ padding: "1rem", borderRadius: "0.5rem", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>SORU 1: İŞLETMENİN ANA FAALİYET ALANI</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#3b82f6", marginTop: "0.25rem" }}>
                              {userDetails?.survey?.sector || selectedUser.sector}
                            </div>
                            {userDetails?.survey?.customSector && (
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                Özel tanım: {userDetails.survey.customSector}
                              </div>
                            )}
                          </div>

                          <div style={{ padding: "1rem", borderRadius: "0.5rem", background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>SORU 2: İLK ÇÖZMEK İSTEDİĞİ PROBLEM / ACI NOKTASI</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981", marginTop: "0.25rem" }}>
                              {userDetails?.survey?.primaryNeed || selectedUser.primaryNeed}
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "var(--card-bg)", fontSize: "0.8rem" }}>
                            <span style={{ color: "var(--text-muted)" }}>Anket Durumu:</span>
                            <span style={{ fontWeight: 700, color: selectedUser.onboardingSkipped ? "#f59e0b" : "#10b981" }}>
                              {selectedUser.onboardingSkipped ? "Atlandı (Skip)" : "Eksiksiz Tamamlandı"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* İşletme Fatura Bilgileri (Varsa) */}
                      {userDetails?.profile && (
                        <div style={{ background: "var(--bg-main)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)" }}>
                          <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", fontWeight: 700 }}>İşletme ve Fatura Profili</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", fontSize: "0.8rem" }}>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>Firma Ünvanı:</span>
                              <div style={{ fontWeight: 700 }}>{userDetails.profile.companyTitle || "—"}</div>
                            </div>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>Vergi Dairesi / No:</span>
                              <div style={{ fontWeight: 700 }}>{userDetails.profile.taxOffice || "—"} / {userDetails.profile.taxNumber || "—"}</div>
                            </div>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>Fatura Öneki:</span>
                              <div style={{ fontWeight: 700 }}>{userDetails.profile.invoicePrefix || "GIB2026"}</div>
                            </div>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>KDV Oranı:</span>
                              <div style={{ fontWeight: 700 }}>%{userDetails.profile.vatRate || "20"}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: CANLI OLAY GÜNLÜĞÜ (ACTIVITY LOGS) */}
                  {activeDetailTab === "logs" && (
                    <div>
                      {/* Log Filtreleme */}
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", overflowX: "auto", paddingBottom: "0.3rem" }}>
                        {[
                          { key: "all", label: "Tümü" },
                          { key: "SALE", label: "Satışlar" },
                          { key: "PRODUCT", label: "Ürünler" },
                          { key: "CUSTOMER", label: "Cariler/Tahsilat" },
                          { key: "AUTH", label: "Giriş/Çıkış" },
                          { key: "PAGE_VIEW", label: "Gezinme" }
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            onClick={() => setLogTypeFilter(btn.key)}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: "999px",
                              border: "1px solid var(--border-color)",
                              background: logTypeFilter === btn.key ? "#3b82f6" : "var(--bg-main)",
                              color: logTypeFilter === btn.key ? "#fff" : "var(--text-muted)",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Log Akışı */}
                      {(!userDetails?.logs || userDetails.logs.length === 0) ? (
                        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "var(--bg-main)", borderRadius: "0.75rem" }}>
                          Bu kullanıcıya ait aktivite kaydı bulunamadı.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                          {userDetails.logs
                            .filter((log) => {
                              if (logTypeFilter === "all") return true;
                              return log.type?.startsWith(logTypeFilter);
                            })
                            .map((log, idx) => {
                              let badgeColor = "#3b82f6";
                              if (log.type?.includes("SALE")) badgeColor = "#10b981";
                              if (log.type?.includes("DELETE")) badgeColor = "#ef4444";
                              if (log.type?.includes("AUTH")) badgeColor = "#8b5cf6";
                              if (log.type?.includes("CUSTOMER")) badgeColor = "#f59e0b";

                              return (
                                <div 
                                  key={log.id || idx}
                                  style={{
                                    padding: "0.85rem 1rem",
                                    borderRadius: "0.5rem",
                                    background: "var(--bg-main)",
                                    border: "1px solid var(--border-color)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.3rem"
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                      <span style={{ padding: "0.15rem 0.45rem", borderRadius: "0.25rem", background: `${badgeColor}20`, color: badgeColor, fontSize: "0.7rem", fontWeight: 800 }}>
                                        {log.type}
                                      </span>
                                      <strong style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
                                        {log.title}
                                      </strong>
                                    </div>
                                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                      {formatRelativeTime(log.createdAt)}
                                    </span>
                                  </div>

                                  {/* Ayrıntılar */}
                                  {log.details && Object.keys(log.details).length > 0 && (
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", background: "var(--card-bg)", padding: "0.4rem 0.6rem", borderRadius: "0.375rem" }}>
                                      {Object.entries(log.details).map(([k, v]) => {
                                        if (typeof v === "object" && v !== null) return null;
                                        return (
                                          <span key={k} style={{ marginRight: "0.8rem" }}>
                                            <strong>{k}:</strong> {String(v)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                    <span>Yol: {log.path || "/"}</span>
                                    <span>{formatFullDate(log.createdAt)}</span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: GERÇEK VERİ KAYITLARI (PRODUCTS, SALES, CUSTOMERS) */}
                  {activeDetailTab === "records" && (
                    <div>
                      {/* Alt Sekmeler */}
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                        <button
                          onClick={() => setActiveRecordsSubTab("products")}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0.375rem",
                            border: "none",
                            background: activeRecordsSubTab === "products" ? "#3b82f6" : "var(--bg-main)",
                            color: activeRecordsSubTab === "products" ? "#fff" : "var(--text-muted)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          Ürünler ({userDetails?.products?.length || 0})
                        </button>
                        <button
                          onClick={() => setActiveRecordsSubTab("sales")}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0.375rem",
                            border: "none",
                            background: activeRecordsSubTab === "sales" ? "#10b981" : "var(--bg-main)",
                            color: activeRecordsSubTab === "sales" ? "#fff" : "var(--text-muted)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          Satışlar ({userDetails?.sales?.length || 0})
                        </button>
                        <button
                          onClick={() => setActiveRecordsSubTab("customers")}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0.375rem",
                            border: "none",
                            background: activeRecordsSubTab === "customers" ? "#f59e0b" : "var(--bg-main)",
                            color: activeRecordsSubTab === "customers" ? "#fff" : "var(--text-muted)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          Cariler / Müşteriler ({userDetails?.customers?.length || 0})
                        </button>
                      </div>

                      {/* Ürünler Listesi */}
                      {activeRecordsSubTab === "products" && (
                        <div>
                          {(!userDetails?.products || userDetails.products.length === 0) ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Kullanıcı henüz ürün eklememiş.</div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                                <thead>
                                  <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-muted)" }}>
                                    <th style={{ padding: "0.5rem" }}>Ürün Adı</th>
                                    <th style={{ padding: "0.5rem" }}>Barkod</th>
                                    <th style={{ padding: "0.5rem" }}>Fiyat</th>
                                    <th style={{ padding: "0.5rem" }}>Stok</th>
                                    <th style={{ padding: "0.5rem" }}>Kategori</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userDetails.products.map((p) => (
                                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                      <td style={{ padding: "0.5rem", fontWeight: 700 }}>{p.name}</td>
                                      <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{p.barcode || "—"}</td>
                                      <td style={{ padding: "0.5rem", color: "#10b981", fontWeight: 700 }}>{p.price} ₺</td>
                                      <td style={{ padding: "0.5rem" }}>{p.stock} adet</td>
                                      <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>{p.category || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Satışlar Listesi */}
                      {activeRecordsSubTab === "sales" && (
                        <div>
                          {(!userDetails?.sales || userDetails.sales.length === 0) ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Kullanıcı henüz satış yapmamış.</div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                                <thead>
                                  <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-muted)" }}>
                                    <th style={{ padding: "0.5rem" }}>Tarih</th>
                                    <th style={{ padding: "0.5rem" }}>Tutar</th>
                                    <th style={{ padding: "0.5rem" }}>Ödeme Tipi</th>
                                    <th style={{ padding: "0.5rem" }}>Müşteri</th>
                                    <th style={{ padding: "0.5rem" }}>Kalemler</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userDetails.sales.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                      <td style={{ padding: "0.5rem" }}>{formatFullDate(s.createdAt)}</td>
                                      <td style={{ padding: "0.5rem", color: "#10b981", fontWeight: 800 }}>{s.total} ₺</td>
                                      <td style={{ padding: "0.5rem" }}>
                                        <span style={{ padding: "0.15rem 0.4rem", borderRadius: "0.25rem", background: s.saleType === "credit" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)", color: s.saleType === "credit" ? "#f59e0b" : "#10b981", fontSize: "0.7rem", fontWeight: 700 }}>
                                          {s.saleType === "credit" ? "Veresiye" : s.saleType === "card" ? "Kredi Kartı" : "Nakit"}
                                        </span>
                                      </td>
                                      <td style={{ padding: "0.5rem" }}>{s.customerName || "—"}</td>
                                      <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>
                                        {s.items?.map(it => `${it.name} x${it.qty}`).join(", ") || `${s.items?.length || 0} ürün`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Müşteriler Listesi */}
                      {activeRecordsSubTab === "customers" && (
                        <div>
                          {(!userDetails?.customers || userDetails.customers.length === 0) ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Kayıtlı müşteri bulunamadı.</div>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                                <thead>
                                  <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-muted)" }}>
                                    <th style={{ padding: "0.5rem" }}>Müşteri Adı</th>
                                    <th style={{ padding: "0.5rem" }}>Telefon</th>
                                    <th style={{ padding: "0.5rem" }}>Bakiye</th>
                                    <th style={{ padding: "0.5rem" }}>Kayıt Tarihi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userDetails.customers.map((c) => (
                                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                      <td style={{ padding: "0.5rem", fontWeight: 700 }}>{c.name}</td>
                                      <td style={{ padding: "0.5rem" }}>{c.phone || "—"}</td>
                                      <td style={{ padding: "0.5rem", color: c.balance > 0 ? "#ef4444" : "var(--text-main)", fontWeight: 700 }}>{c.balance || 0} ₺</td>
                                      <td style={{ padding: "0.5rem", color: "var(--text-muted)" }}>{formatFullDate(c.createdAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}