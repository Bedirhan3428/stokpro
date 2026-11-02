"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiLock,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { createUserProfile, getUserProfile } from "../utils/firebaseHelpers";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";
import { logUserActivity } from "../utils/telemetryLogger";
import { playSuccessSound } from "../utils/audioEffects";
import { hashKey, generateTerminalKey, maskKey } from "../utils/cryptoUtils";
import { SETUP_URL } from "../marketing/content";
import OnboardingSurvey from "./OnboardingSurvey";

const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

const MODE_FROM_PARAM = { kayit: "kayit", sifre: "sifre", giris: "giris" };

const POINTS = [
  "Barkodla satış, toplam kendiliğinden hesaplanır",
  "Stok, cari, fatura ve kasa tek programda",
  "Azalan ürünleri program size söyler",
];

/* ----------------------------- küçük parçalar ----------------------------- */

function Field({ id, label, icon: Icon, type = "text", value, onChange, placeholder, autoComplete, disabled, right, action }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-sp-obsidian dark:text-zinc-200">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <Icon aria-hidden="true" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sp-graphite dark:text-zinc-500" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required
          className="w-full rounded-xl border border-sp-border bg-white py-3 pl-10 pr-11 text-[15px] text-sp-obsidian outline-none transition placeholder:text-zinc-400 focus:border-sp-caramel focus:ring-4 focus:ring-sp-caramel/15 disabled:opacity-60 dark:border-white/10 dark:bg-[#0D0D11] dark:text-white dark:placeholder:text-zinc-600"
        />
        {right}
      </div>
    </div>
  );
}

function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Şifreyi gizle" : "Şifreyi göster"}
      className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center rounded-lg border-0 bg-transparent p-2 text-sp-graphite hover:text-sp-obsidian dark:text-zinc-500 dark:hover:text-zinc-200"
    >
      {shown ? <FiEyeOff size={16} /> : <FiEye size={16} />}
    </button>
  );
}

function PrimaryButton({ children, loading, loadingText, type = "submit", onClick, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-sp-obsidian py-3.5 text-[15px] font-bold text-white transition hover:bg-[#27272A] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sp-caramel dark:hover:bg-sp-caramelDark"
    >
      {loading ? loadingText : children}
    </button>
  );
}

function GoogleButton({ onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-sp-border bg-white py-3 text-[15px] font-semibold text-sp-obsidian transition hover:bg-sp-canvas disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-sp-border dark:bg-white/10" />
      <span className="text-xs font-semibold text-sp-graphite dark:text-zinc-500">veya</span>
      <div className="h-px flex-1 bg-sp-border dark:bg-white/10" />
    </div>
  );
}

function Notice({ tone = "error", children }) {
  const styles =
    tone === "error"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  const Icon = tone === "error" ? FiAlertTriangle : FiCheckCircle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm font-medium ${styles}`}>
      <Icon aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------ Excel dışa aktarım ------------------------------ */

function toCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value?.toDate === "function") return value.toDate().toLocaleString("tr-TR");
  if (value instanceof Date) return value.toLocaleString("tr-TR");
  if (Array.isArray(value)) {
    return value
      .map((v) => (v && typeof v === "object" ? [v.name, v.qty ?? v.quantity, v.price].filter((x) => x !== undefined && x !== "").join(" x ") || JSON.stringify(v) : String(v)))
      .join("; ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function toRows(list) {
  return list.map((item) => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, toCell(v)])));
}

async function exportUserData() {
  const [XLSX, helpers, products] = await Promise.all([
    import("xlsx"),
    import("../utils/firebaseHelpers"),
    import("../utils/artifactUserProducts"),
  ]);
  const safe = (p) => p.catch(() => []);
  const [urunler, cariler, satislar, kasa, giderler, gelirler] = await Promise.all([
    safe(products.listProductsForCurrentUser()),
    safe(helpers.listCustomers()),
    safe(helpers.listSales()),
    safe(helpers.listLedger()),
    safe(helpers.listLegacyExpenses()),
    safe(helpers.listLegacyIncomes()),
  ]);
  const sheets = [
    ["Ürünler", urunler],
    ["Cariler", cariler],
    ["Satışlar", satislar],
    ["Kasa", kasa],
    ["Giderler", giderler],
    ["Gelirler", gelirler],
  ].filter(([, list]) => Array.isArray(list) && list.length > 0);

  if (sheets.length === 0) return 0;
  const book = XLSX.utils.book_new();
  for (const [name, list] of sheets) {
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(toRows(list)), name);
  }
  XLSX.writeFile(book, `StokPro-verilerim-${new Date().toISOString().slice(0, 10)}.xlsx`);
  return sheets.reduce((sum, [, list]) => sum + list.length, 0);
}

/* ----------------------------------- ekran ----------------------------------- */

export default function AuthScreen() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login, signup, signInWithGoogle, logout } = useAuth();

  const sessionId = searchParams.get("session") || "";
  const expiresParam = searchParams.get("expires") || "";
  const hasSessionParam = Boolean(sessionId);
  const isValidSessionId = useMemo(
    () => Boolean(sessionId && sessionId.length >= 16 && sessionId.length <= 128 && /^[A-Za-z0-9_-]+$/.test(sessionId)),
    [sessionId]
  );
  const deviceMode = hasSessionParam;
  const expiryTimestamp = useMemo(() => {
    const n = Number(expiresParam);
    return expiresParam && !Number.isNaN(n) ? n : null;
  }, [expiresParam]);

  const [tab, setTab] = useState(MODE_FROM_PARAM[searchParams.get("mod")] || "giris");
  const [view, setView] = useState("form"); // form | anket | hesap | authorized | expired | invalid | license_error
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [useOtherAccount, setUseOtherAccount] = useState(false);
  const [authorizedDetails, setAuthorizedDetails] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState(null);

  // Masaüstü oturum geçerliliği ve kalan süre
  useEffect(() => {
    if (!deviceMode) return;
    if (!isValidSessionId) {
      setView("invalid");
      return;
    }
    if (!expiryTimestamp) return;
    const tick = () => {
      const diff = expiryTimestamp - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        setView((v) => (v === "authorized" ? v : "expired"));
      } else {
        const s = Math.floor(diff / 1000);
        setTimeLeft(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deviceMode, isValidSessionId, expiryTimestamp]);

  // Masaüstü oturumu yokken zaten girişli kullanıcı hesap ekranını görür
  useEffect(() => {
    if (!deviceMode && !authLoading && user && view === "form") setView("hesap");
  }, [deviceMode, authLoading, user, view]);

  function switchTab(next) {
    setTab(next);
    setError("");
    setInfo("");
  }

  /* -------- masaüstü cihaz yetkilendirmesi (eski DeviceAuth akışı, değişmeden) -------- */
  async function completeDeviceAuthorization(targetUser, authMethod = "google") {
    if (!isValidSessionId) throw new Error("Geçersiz cihaz oturum kimliği.");
    if (!targetUser || !targetUser.uid) throw new Error("Kullanıcı kimliği doğrulanamadı.");
    const uid = targetUser.uid;

    let profileData = null;
    let subscriptionStatus = null;
    try {
      const snap = await getDoc(doc(db, "artifacts", "marketpro-main", "users", uid, "profile", "user_doc"));
      if (snap.exists()) {
        profileData = snap.data();
        subscriptionStatus = profileData?.subscriptionStatus;
      }
    } catch (err) {
      console.warn("marketpro-main lisans sorgusu uyarısı:", err?.message);
    }
    if (!profileData) {
      try {
        const snap = await getDoc(doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc"));
        if (snap.exists()) {
          profileData = snap.data();
          subscriptionStatus = profileData?.subscriptionStatus;
        }
      } catch (err) {
        console.warn("ARTIFACT_DOC_ID lisans sorgusu uyarısı:", err?.message);
      }
    }
    if (!profileData || !subscriptionStatus) {
      try {
        profileData = await getUserProfile(uid);
        subscriptionStatus = profileData?.subscriptionStatus;
      } catch (err) {
        console.warn("getUserProfile fallback uyarısı:", err?.message);
      }
    }

    const statusClean = String(subscriptionStatus || "active_lifetime").toLowerCase();
    if (profileData?.remoteDisabled === true || statusClean === "suspended" || statusClean === "disabled") {
      setError(profileData?.remoteDisabledReason || "Hesabınızın masaüstü erişimi yönetici tarafından durdurulmuştur.");
      setView("license_error");
      return;
    }

    let cloudProducts = [];
    let cloudCustomers = [];
    try {
      const s = await getDocs(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products"));
      cloudProducts = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Ürünler çekilemedi:", e);
    }
    try {
      const s = await getDocs(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers"));
      cloudCustomers = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Cariler çekilemedi:", e);
    }

    let terminalKey = "";
    let terminalKeyHash = profileData?.terminalKeyHash || "";
    if (!terminalKeyHash) {
      terminalKey = generateTerminalKey();
      terminalKeyHash = await hashKey(terminalKey);
      try {
        await setDoc(
          doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc"),
          { terminalKeyHash, terminalKeyMasked: maskKey(terminalKey), updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (e) {
        console.warn("Terminal hash kaydı uyarısı:", e);
      }
    }

    let clientProof = null;
    if (typeof window !== "undefined" && window.location.hash) {
      const challenge = (new URLSearchParams(window.location.hash.replace(/^#/, "")).get("c") || "").trim();
      if (challenge && /^[A-Za-z0-9_-]{8,128}$/.test(challenge)) {
        clientProof = await hashKey(`${challenge}:${sessionId}:${uid}`);
      }
    }

    const includeInlineCatalog = JSON.stringify({ products: cloudProducts, customers: cloudCustomers }).length < 650_000;
    const sessionRef = doc(db, "device_sessions", sessionId);
    const sessionPayload = {
      sessionId,
      ...(expiryTimestamp ? { expiresAt: expiryTimestamp } : {}),
      ...(terminalKey ? { terminalKey } : {}),
      ...(clientProof ? { clientProof } : {}),
      terminalKeyHash,
      status: "authorized",
      uid,
      email: targetUser.email || "",
      storeName: profileData?.storeName || profileData?.companyTitle || targetUser.displayName || "StokPro Mağaza",
      displayName:
        targetUser.displayName || profileData?.displayName || profileData?.name || targetUser.email?.split("@")[0] || "Yetkili",
      subscriptionStatus: subscriptionStatus || "active_lifetime",
      authorizedAt: new Date().toISOString(),
      authMethod,
      ...(includeInlineCatalog ? { products: cloudProducts, customers: cloudCustomers } : {}),
      productsCount: cloudProducts.length,
      customersCount: cloudCustomers.length,
    };
    try {
      await updateDoc(sessionRef, sessionPayload);
    } catch {
      await setDoc(sessionRef, sessionPayload, { merge: true });
    }

    playSuccessSound();
    logUserActivity(
      "DEVICE_SESSION_AUTHORIZED",
      "Masaüstü Terminali Yetkilendirildi",
      { sessionId, email: targetUser.email, storeName: sessionPayload.storeName, authMethod },
      { uid, email: targetUser.email }
    ).catch(() => {});

    setAuthorizedDetails({ email: targetUser.email, storeName: sessionPayload.storeName });
    setView("authorized");
  }

  // Giriş/kayıt sonrası ortak adım
  async function afterSignedIn(targetUser, method, needsSurvey) {
    if (needsSurvey) {
      setView("anket");
      return;
    }
    if (deviceMode) {
      await completeDeviceAuthorization(targetUser, method);
    } else {
      setView("hesap");
    }
  }

  const blocked = view === "expired" || view === "invalid";

  async function handleLogin(e) {
    e.preventDefault();
    if (blocked) return;
    if (!email.trim() || !password) return setError("E-posta adresinizi ve şifrenizi girin.");
    setBusy(true);
    setError("");
    try {
      const cred = await login(email.trim(), password);
      await afterSignedIn(cred.user, "email", false);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "E-posta veya şifre hatalı."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (blocked) return;
    if (!name.trim()) return setError("İşletme adınızı veya adınızı girin.");
    if (!email.trim()) return setError("E-posta adresinizi girin.");
    if (password.length < 6) return setError("Şifre en az 6 karakter olmalı.");
    if (!acceptTerms) return setError("Devam etmek için kullanım şartlarını ve gizlilik politikasını kabul edin.");
    setBusy(true);
    setError("");
    try {
      const cred = await signup(email.trim(), password, name.trim());
      try {
        await createUserProfile({ name: name.trim(), email: email.trim(), lastLogin: new Date().toISOString() });
      } catch (profileErr) {
        console.warn("Profil kaydı yapılamadı:", profileErr);
      }
      await afterSignedIn(cred.user, "email", true);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Kayıt başarısız."));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    if (blocked) return;
    setBusy(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      let needsSurvey = false;
      try {
        const profile = await getUserProfile(result.user.uid);
        if (!profile) {
          await createUserProfile({ lastLogin: new Date().toISOString() }, result.user.uid);
          needsSurvey = true;
        } else if (!profile.onboardingCompleted && tab === "kayit") {
          needsSurvey = true;
        }
      } catch (profileErr) {
        console.warn("Profil kontrolü:", profileErr);
      }
      setUseOtherAccount(false);
      await afterSignedIn(result.user, "google", needsSurvey);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Google ile giriş yapılamadı."));
    } finally {
      setBusy(false);
    }
  }

  async function handleContinueAsCurrent() {
    setBusy(true);
    setError("");
    try {
      const method = user?.providerData?.[0]?.providerId === "password" ? "email" : "google";
      await completeDeviceAuthorization(user, method);
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Yetkilendirme sırasında hata oluştu."));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!email.trim()) return setError("E-posta adresinizi girin.");
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Şifre sıfırlama bağlantısını gönderdik. Gelen kutunuzu (ve gereksiz klasörünü) kontrol edin.");
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "Bağlantı gönderilemedi."));
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportMsg(null);
    try {
      const count = await exportUserData();
      setExportMsg(
        count > 0
          ? { tone: "success", text: `${count} kayıt Excel dosyasına aktarıldı.` }
          : { tone: "error", text: "Hesabınızda dışa aktarılacak web verisi bulunamadı." }
      );
    } catch (err) {
      console.error("Excel dışa aktarım hatası:", err);
      setExportMsg({ tone: "error", text: "Veriler indirilemedi. Lütfen tekrar deneyin." });
    } finally {
      setExporting(false);
    }
  }

  async function handleLogout() {
    await logout().catch(() => {});
    setView("form");
    setTab("giris");
    setPassword("");
    setExportMsg(null);
  }

  /* ------------------------------- anket ------------------------------- */
  if (view === "anket") {
    return (
      <OnboardingSurvey
        onCompleted={async () => {
          const current = auth.currentUser;
          try {
            await afterSignedIn(current, current?.providerData?.[0]?.providerId === "password" ? "email" : "google", false);
          } catch (err) {
            setError(getFirebaseErrorMessage(err, "Yetkilendirme sırasında hata oluştu."));
            setView("form");
          }
        }}
      />
    );
  }

  /* ------------------------------ içerik ------------------------------ */
  let content;

  if (view === "authorized") {
    content = (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <FiCheckCircle size={32} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sp-obsidian dark:text-white">Kasanız açıldı</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-sp-graphite dark:text-zinc-400">
            StokPro masaüstü uygulaması giriş yaptı. Bu sekmeyi kapatabilirsiniz.
          </p>
        </div>
        {authorizedDetails && (
          <div className="rounded-2xl border border-sp-border bg-sp-canvas p-4 text-left text-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex justify-between gap-3"><span className="text-sp-graphite dark:text-zinc-400">Mağaza</span><strong className="truncate text-sp-obsidian dark:text-white">{authorizedDetails.storeName}</strong></div>
            <div className="mt-2 flex justify-between gap-3"><span className="text-sp-graphite dark:text-zinc-400">Hesap</span><strong className="truncate text-sp-obsidian dark:text-white">{authorizedDetails.email}</strong></div>
          </div>
        )}
        <a href="stokpro://" className="flex w-full items-center justify-center gap-2 rounded-xl bg-sp-obsidian py-3.5 text-[15px] font-bold text-white no-underline transition hover:bg-[#27272A] dark:bg-sp-caramel dark:hover:bg-sp-caramelDark">
          <FiMonitor aria-hidden="true" /> Uygulamaya dön
        </a>
      </div>
    );
  } else if (view === "expired" || view === "invalid" || view === "license_error") {
    const title = view === "expired" ? "Giriş bağlantısının süresi doldu" : view === "invalid" ? "Giriş bağlantısı geçersiz" : "Hesap erişimi durduruldu";
    const text =
      view === "license_error"
        ? error
        : "Güvenliğiniz için bağlantılar kısa süre geçerlidir. StokPro masaüstü uygulamasında giriş butonuna yeniden basın; tarayıcı yeni bağlantıyla açılacak.";
    content = (
      <div className="space-y-6 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${view === "expired" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}`}>
          {view === "expired" ? <FiClock size={30} aria-hidden="true" /> : <FiAlertTriangle size={30} aria-hidden="true" />}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sp-obsidian dark:text-white">{title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-sp-graphite dark:text-zinc-400">{text}</p>
        </div>
        <Link href="/auth" className="inline-flex items-center gap-2 font-semibold text-sp-caramel no-underline hover:underline">
          <FiRefreshCw aria-hidden="true" /> Normal girişe geç
        </Link>
      </div>
    );
  } else if (view === "hesap" && user) {
    content = (
      <div className="space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sp-caramel/15 text-lg font-extrabold text-sp-caramel">
            {(user.displayName || user.email || "S")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-sp-obsidian dark:text-white">
              Hoş geldiniz{user.displayName ? `, ${user.displayName}` : ""}
            </h1>
            <p className="truncate text-sm text-sp-graphite dark:text-zinc-400">{user.email}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-sp-border bg-sp-canvas p-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-base font-bold text-sp-obsidian dark:text-white">StokPro'yu bilgisayarınıza kurun</h2>
          <ol className="mt-3 space-y-2 text-sm text-sp-graphite dark:text-zinc-400">
            <li>1. Kurulum dosyasını indirip çalıştırın.</li>
            <li>2. Programda "Giriş yap"a basın; bu sayfa açılır ve kasanız aynı hesapla açılır.</li>
          </ol>
          <a href={SETUP_URL} download="StokPro-Setup.exe" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sp-obsidian py-3.5 text-[15px] font-bold text-white no-underline transition hover:bg-[#27272A] dark:bg-sp-caramel dark:hover:bg-sp-caramelDark">
            <FiDownload aria-hidden="true" /> StokPro'yu indir (Windows)
          </a>
        </div>

        <div className="rounded-2xl border border-sp-border p-5 dark:border-white/10">
          <h2 className="flex items-center gap-2 text-base font-bold text-sp-obsidian dark:text-white">
            <FiFileText aria-hidden="true" className="text-sp-caramel" /> Web verilerinizi indirin
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-sp-graphite dark:text-zinc-400">
            Web sürümü kapandı. Daha önce webde girdiğiniz ürün, cari, satış ve kasa kayıtlarını Excel olarak indirebilirsiniz. Ürünler ve cariler masaüstüne girişte otomatik aktarılır.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-sp-border bg-white py-3 text-[15px] font-semibold text-sp-obsidian transition hover:bg-sp-canvas disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <FiDownload aria-hidden="true" /> {exporting ? "Hazırlanıyor..." : "Verilerimi Excel olarak indir"}
          </button>
          {exportMsg && <div className="mt-3"><Notice tone={exportMsg.tone}>{exportMsg.text}</Notice></div>}
        </div>

        <button type="button" onClick={handleLogout} className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm font-semibold text-sp-graphite hover:text-rose-600 dark:text-zinc-400">
          <FiLogOut aria-hidden="true" /> Çıkış yap
        </button>
      </div>
    );
  } else if (deviceMode && user && !useOtherAccount && tab !== "kayit") {
    content = (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sp-obsidian dark:text-white">Kasanızı açın</h1>
          <p className="mt-2 text-[15px] text-sp-graphite dark:text-zinc-400">Bu tarayıcıda zaten giriş yapmışsınız.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-sp-border bg-sp-canvas p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sp-caramel/15 font-extrabold text-sp-caramel">
            {(user.displayName || user.email || "S")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-sm text-sp-obsidian dark:text-white">{user.displayName || "Hesabınız"}</strong>
            <span className="block truncate text-sm text-sp-graphite dark:text-zinc-400">{user.email}</span>
          </div>
        </div>
        {error && <Notice>{error}</Notice>}
        <PrimaryButton type="button" onClick={handleContinueAsCurrent} loading={busy} loadingText="Kasa açılıyor...">
          Bu hesapla devam et
        </PrimaryButton>
        <button type="button" onClick={() => { setError(""); setUseOtherAccount(true); }} className="w-full cursor-pointer border-0 bg-transparent text-sm font-semibold text-sp-graphite hover:text-sp-obsidian dark:text-zinc-400 dark:hover:text-white">
          Başka hesapla giriş yap
        </button>
      </div>
    );
  } else if (tab === "sifre") {
    content = (
      <form onSubmit={handleReset} className="space-y-5" noValidate>
        <button type="button" onClick={() => switchTab("giris")} className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-sp-graphite hover:text-sp-obsidian dark:text-zinc-400 dark:hover:text-white">
          <FiArrowLeft aria-hidden="true" /> Girişe dön
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sp-obsidian dark:text-white">Şifrenizi mi unuttunuz?</h1>
          <p className="mt-2 text-[15px] text-sp-graphite dark:text-zinc-400">E-posta adresinizi yazın, size yeni şifre bağlantısı gönderelim.</p>
        </div>
        <Field id="reset-email" label="E-posta" icon={FiMail} type="email" value={email} onChange={setEmail} placeholder="ornek@isletme.com" autoComplete="email" disabled={busy} />
        {error && <Notice>{error}</Notice>}
        {info && <Notice tone="success">{info}</Notice>}
        <PrimaryButton loading={busy} loadingText="Gönderiliyor...">Sıfırlama bağlantısı gönder</PrimaryButton>
      </form>
    );
  } else {
    const isRegister = tab === "kayit";
    content = (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sp-obsidian dark:text-white sm:text-[28px]">
            {deviceMode ? "Masaüstü kasanızı açın" : isRegister ? "Ücretsiz hesap oluşturun" : "Tekrar hoş geldiniz"}
          </h1>
          <p className="mt-2 text-[15px] text-sp-graphite dark:text-zinc-400">
            {deviceMode
              ? "Giriş yaptığınızda StokPro masaüstü uygulaması otomatik açılır."
              : isRegister
              ? "Bir dakikada kaydolun, StokPro'yu 2028'e kadar ücretsiz kullanın."
              : "StokPro hesabınızla giriş yapın."}
          </p>
        </div>

        <div role="tablist" aria-label="Giriş veya kayıt" className="grid grid-cols-2 rounded-xl bg-[#ECECE8] p-1 dark:bg-white/5">
          {[
            ["giris", "Giriş yap"],
            ["kayit", "Kayıt ol"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={`cursor-pointer rounded-lg border-0 py-2.5 text-sm font-bold transition ${
                tab === key
                  ? "bg-white text-sp-obsidian shadow-sm dark:bg-sp-cardDark dark:text-white"
                  : "bg-transparent text-sp-graphite hover:text-sp-obsidian dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4" noValidate>
          {isRegister && (
            <Field id="name" label="İşletme adı veya adınız" icon={FiUser} value={name} onChange={setName} placeholder="Örn: Yıldız Market" autoComplete="organization" disabled={busy || blocked} />
          )}
          <Field id="email" label="E-posta" icon={FiMail} type="email" value={email} onChange={setEmail} placeholder="ornek@isletme.com" autoComplete="email" disabled={busy || blocked} />
          <Field
            id="password"
            label="Şifre"
            icon={FiLock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder={isRegister ? "En az 6 karakter" : "••••••••"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            disabled={busy || blocked}
            right={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
            action={
              !isRegister && (
                <button type="button" onClick={() => switchTab("sifre")} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-sp-caramel hover:underline">
                  Şifremi unuttum
                </button>
              )
            }
          />

          {isRegister && (
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-sp-graphite dark:text-zinc-400">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#A66B49]" />
              <span>
                <Link href="/terms-of-service" target="_blank" className="font-semibold text-sp-obsidian underline dark:text-white">Kullanım şartlarını</Link> ve{" "}
                <Link href="/privacy-policy" target="_blank" className="font-semibold text-sp-obsidian underline dark:text-white">gizlilik politikasını</Link> okudum, kabul ediyorum.
              </span>
            </label>
          )}

          {error && <Notice>{error}</Notice>}

          <PrimaryButton loading={busy} loadingText={isRegister ? "Hesap oluşturuluyor..." : "Giriş yapılıyor..."} disabled={blocked}>
            {isRegister ? "Hesap oluştur" : deviceMode ? "Giriş yap ve kasayı aç" : "Giriş yap"}
          </PrimaryButton>
        </form>

        <Divider />
        <GoogleButton onClick={handleGoogle} disabled={busy || blocked} label={isRegister ? "Google ile kaydol" : "Google ile devam et"} />
        {isRegister && (
          <p className="text-center text-xs text-sp-graphite dark:text-zinc-500">
            Google ile kaydolarak kullanım şartlarını ve gizlilik politikasını kabul etmiş olursunuz.
          </p>
        )}
        {deviceMode && user && useOtherAccount && (
          <button type="button" onClick={() => setUseOtherAccount(false)} className="w-full cursor-pointer border-0 bg-transparent text-sm font-semibold text-sp-caramel hover:underline">
            {user.email} ile devam et
          </button>
        )}
      </div>
    );
  }

  /* ------------------------------ yerleşim ------------------------------ */
  return (
    <div className="grid min-h-screen bg-sp-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] dark:bg-sp-deep">
      {/* Marka paneli */}
      <aside className="relative hidden overflow-hidden bg-[#111113] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sp-caramel/20 blur-3xl" aria-hidden="true" />
        <Link href="/" className="relative z-10 inline-flex no-underline">
          <span className="text-[28px] font-extrabold tracking-tight text-white">StokPro</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Windows için · 2028'e kadar ücretsiz
          </span>
          <p className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight">
            Dükkanının tüm işi <span className="text-[#E0A27C]">tek programda.</span>
          </p>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-zinc-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sp-caramel/25 text-[#E0A27C]">
                  <FiCheck size={13} aria-hidden="true" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-zinc-500">© {new Date().getFullYear()} StokPro</p>
      </aside>

      {/* Form alanı */}
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sp-graphite no-underline hover:text-sp-obsidian dark:text-zinc-400 dark:hover:text-white">
            <FiArrowLeft aria-hidden="true" /> Ana sayfa
          </Link>
          <Link href="/" className="no-underline lg:hidden" aria-label="StokPro ana sayfa">
            <span className="text-xl font-extrabold tracking-tight text-sp-obsidian dark:text-white">StokPro</span>
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          {deviceMode && isValidSessionId && view !== "authorized" && view !== "expired" && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-sp-caramel/30 bg-sp-caramel/10 px-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-sp-obsidian dark:text-white">
                <FiMonitor aria-hidden="true" className="text-sp-caramel" /> Masaüstü girişi
              </span>
              {timeLeft && (
                <span className="flex items-center gap-1.5 font-mono font-bold text-sp-caramel">
                  <FiClock aria-hidden="true" /> {timeLeft}
                </span>
              )}
            </div>
          )}
          {authLoading && !deviceMode ? (
            <p className="text-center text-sm text-sp-graphite dark:text-zinc-400">Yükleniyor...</p>
          ) : (
            content
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-sp-graphite dark:text-zinc-500">
          <FiLock aria-hidden="true" /> Bağlantınız şifrelidir.
        </p>
      </main>
    </div>
  );
}
