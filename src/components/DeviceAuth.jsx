"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiMonitor,
  FiArrowRight,
  FiRefreshCw,
  FiExternalLink,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
} from "react-icons/fi";
import { auth, db } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { getUserProfile } from "../utils/firebaseHelpers";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";
import { logUserActivity } from "../utils/telemetryLogger";
import { playSuccessSound } from "../utils/audioEffects";
import { hashKey, generateTerminalKey, maskKey } from "../utils/cryptoUtils";

const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

export default function DeviceAuth() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session") || "";
  const expiresParam = searchParams.get("expires") || "";

  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [useDifferentAccount, setUseDifferentAccount] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const [authStatus, setAuthStatus] = useState("idle"); // "idle" | "authorized" | "expired" | "invalid_session" | "license_error" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [authorizedDetails, setAuthorizedDetails] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const expiryTimestamp = useMemo(() => {
    if (!expiresParam) return null;
    const num = Number(expiresParam);
    return isNaN(num) ? null : num;
  }, [expiresParam]);

  const isValidSessionId = useMemo(
    () =>
      Boolean(
        sessionId &&
          sessionId.length >= 16 &&
          sessionId.length <= 128 &&
          /^[A-Za-z0-9_-]+$/.test(sessionId)
      ),
    [sessionId]
  );

  useEffect(() => {
    if (!isValidSessionId) {
      setAuthStatus("invalid_session");
      setStatusMessage(
        "Geçersiz veya eksik oturum parametresi (session bulunamadı). Lütfen masaüstü uygulamasından tekrar giriş başlatın."
      );
      return;
    }

    if (expiryTimestamp) {
      const checkExpiry = () => {
        const diff = expiryTimestamp - Date.now();
        if (diff <= 0) {
          setTimeLeft(0);
          setAuthStatus("expired");
          setStatusMessage(
            "Bu giriş bağlantısının kullanım süresi dolmuş. Güvenliğiniz için lütfen masaüstü uygulamasından yeni bir giriş başlatın."
          );
        } else {
          const seconds = Math.floor(diff / 1000);
          const mins = Math.floor(seconds / 60);
          const remSecs = seconds % 60;
          setTimeLeft(`${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`);
        }
      };

      checkExpiry();
      const interval = setInterval(checkExpiry, 1000);
      return () => clearInterval(interval);
    }
  }, [isValidSessionId, expiryTimestamp]);

  // Doğrulanmış Firebase kullanıcısı ile masaüstü oturumunu yetkilendirir
  async function completeDeviceAuthorization(targetUser, authMethod = "google") {
    if (!isValidSessionId) {
      throw new Error("Geçersiz cihaz oturum kimliği.");
    }
    if (!targetUser || !targetUser.uid) {
      throw new Error("Kullanıcı kimliği doğrulanamadı.");
    }

    const uid = targetUser.uid;

    // 1. Lisans Durumu Kontrolü
    let profileData = null;
    let subscriptionStatus = null;

    try {
      const marketProRef = doc(db, "artifacts", "marketpro-main", "users", uid, "profile", "user_doc");
      const marketProSnap = await getDoc(marketProRef);
      if (marketProSnap.exists()) {
        profileData = marketProSnap.data();
        subscriptionStatus = profileData?.subscriptionStatus;
      }
    } catch (err) {
      console.warn("marketpro-main lisans sorgusu uyarısı:", err?.message);
    }

    if (!profileData) {
      try {
        const defaultRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
        const defaultSnap = await getDoc(defaultRef);
        if (defaultSnap.exists()) {
          profileData = defaultSnap.data();
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

    const currentStatusClean = String(subscriptionStatus || "active_lifetime").toLowerCase();
    const isRemotelySuspended =
      profileData?.remoteDisabled === true ||
      currentStatusClean === "suspended" ||
      currentStatusClean === "disabled";

    if (isRemotelySuspended) {
      setAuthStatus("license_error");
      setStatusMessage(
        profileData?.remoteDisabledReason ||
          "Hesabınızın masaüstü erişimi yönetici tarafından durdurulmuştur."
      );
      return;
    }

    // 2. Kullanıcının Mevcut Ürün ve Carilerini Çek
    let cloudProducts = [];
    let cloudCustomers = [];
    try {
      const prodSnap = await getDocs(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "products"));
      cloudProducts = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (pErr) {
      console.warn("Ürünler çekilemedi:", pErr);
    }

    try {
      const custSnap = await getDocs(collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "customers"));
      cloudCustomers = custSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (cErr) {
      console.warn("Cariler çekilemedi:", cErr);
    }

    // 3. Terminal Güvenlik Anahtarı (SHA-256 hash)
    let terminalKey = "";
    let terminalKeyHash = profileData?.terminalKeyHash || "";

    if (!terminalKeyHash) {
      terminalKey = generateTerminalKey();
      terminalKeyHash = await hashKey(terminalKey);

      try {
        const profileDocRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
        await setDoc(
          profileDocRef,
          {
            terminalKeyHash,
            terminalKeyMasked: maskKey(terminalKey),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (hErr) {
        console.warn("Terminal hash kaydı uyarısı:", hErr);
      }
    }

    // 4. Kriptografik challenge (#c=...) kanıtı ve 1 MiB Firestore doküman boyutu koruması
    let clientProof = null;
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const challenge = (hashParams.get("c") || "").trim();
      if (challenge && /^[A-Za-z0-9_-]{8,128}$/.test(challenge)) {
        clientProof = await hashKey(`${challenge}:${sessionId}:${uid}`);
      }
    }

    const inlineCatalogBytes = JSON.stringify({
      products: cloudProducts,
      customers: cloudCustomers,
    }).length;
    const includeInlineCatalog = inlineCatalogBytes < 650_000;

    // 5. device_sessions/{sessionId} Belgesini Güncelle
    const sessionRef = doc(db, "device_sessions", sessionId);
    const sessionPayload = {
      sessionId,
      ...(expiryTimestamp ? { expiresAt: expiryTimestamp } : {}),
      ...(terminalKey ? { terminalKey } : {}),
      ...(clientProof ? { clientProof } : {}),
      terminalKeyHash,
      status: "authorized",
      uid: targetUser.uid,
      email: targetUser.email || "",
      storeName:
        profileData?.storeName ||
        profileData?.companyTitle ||
        targetUser.displayName ||
        "StokPro Mağaza",
      displayName:
        targetUser.displayName ||
        profileData?.displayName ||
        profileData?.name ||
        targetUser.email?.split("@")[0] ||
        "Yetkili",
      subscriptionStatus: subscriptionStatus || "active_lifetime",
      authorizedAt: new Date().toISOString(),
      authMethod,
      ...(includeInlineCatalog
        ? {
            products: cloudProducts,
            customers: cloudCustomers,
          }
        : {}),
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
      {
        sessionId,
        email: targetUser.email,
        storeName: sessionPayload.storeName,
        authMethod,
      },
      { uid: targetUser.uid, email: targetUser.email }
    ).catch(() => {});

    setAuthorizedDetails({
      email: targetUser.email,
      displayName: sessionPayload.displayName,
      storeName: sessionPayload.storeName,
      sessionId,
    });
    setAuthStatus("authorized");
  }

  async function handleGoogleAuthorize(forceNewPopup = false) {
    if (authStatus === "expired" || authStatus === "invalid_session") return;

    setLoading(true);
    setFormError("");
    setStatusMessage("");

    try {
      let targetUser = currentUser;

      if (!targetUser || forceNewPopup) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const result = await signInWithPopup(auth, provider);
        targetUser = result.user;
        setCurrentUser(targetUser);
        setUseDifferentAccount(false);
      }

      const method =
        targetUser?.providerData?.[0]?.providerId === "password" ? "email" : "google";
      await completeDeviceAuthorization(targetUser, method);
    } catch (err) {
      console.error("Google yetkilendirme hatası:", err);
      setFormError(getFirebaseErrorMessage(err, "Yetkilendirme sırasında hata oluştu."));
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuthorize(e) {
    e.preventDefault();
    if (authStatus === "expired" || authStatus === "invalid_session") return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setFormError("Lütfen e-posta adresinizi ve şifrenizi girin.");
      return;
    }

    setLoading(true);
    setFormError("");
    setStatusMessage("");

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const targetUser = credential.user;
      setCurrentUser(targetUser);
      setUseDifferentAccount(false);
      await completeDeviceAuthorization(targetUser, "email");
    } catch (err) {
      console.error("E-posta ile yetkilendirme hatası:", err);
      setFormError(getFirebaseErrorMessage(err, "E-posta veya şifre hatalı."));
    } finally {
      setLoading(false);
    }
  }

  const showActiveAccountCard = Boolean(currentUser && !useDifferentAccount);

  return (
    <div className="min-h-screen w-full bg-[#0D0D11] text-white flex flex-col justify-between p-6 sm:p-10 select-none relative overflow-hidden font-sans">
      {/* Masaüstü Uygulaması (AuthPage.tsx) ile Birebir Atmosfer Işıklandırması */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#A66B49]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#A66B49]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Üst Logo */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between z-10 pt-2">
        <Link href="/" className="flex items-center no-underline">
          <img
            src="/HeaderName2.png"
            alt="StokPro Logo"
            className="h-9 w-auto max-w-[175px] object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/browserlogo.svg";
            }}
          />
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A66B49]/15 border border-[#A66B49]/30 text-[#A66B49] font-mono text-[11px] font-bold">
          <FiMonitor size={12} />
          <span>POS Terminal</span>
        </span>
      </div>

      {/* Merkez Kart */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-6">
        <div className="bg-[#16161B]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/90">
          {/* DURUM 1: BAŞARILI YETKİLENDİRME */}
          {authStatus === "authorized" && (
            <div className="text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <FiCheckCircle size={32} />
              </div>

              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                  Masaüstü kasanız açıldı ✓
                </span>
                <h2 className="text-xl font-extrabold text-white tracking-tight pt-1">
                  Yetkilendirme Başarılı
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Masaüstü StokPro kasanız oturumu algıladı ve otomatik olarak açıldı. Bu sekmeden
                  çıkabilirsiniz.
                </p>
              </div>

              {authorizedDetails && (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-400">Mağaza</span>
                    <strong className="text-white truncate">{authorizedDetails.storeName}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-400">Yetkili</span>
                    <strong className="text-white truncate">{authorizedDetails.displayName}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-400">E-posta</span>
                    <strong className="text-white truncate">{authorizedDetails.email}</strong>
                  </div>
                  <div className="flex justify-between items-center gap-2 pt-1 border-t border-white/10">
                    <span className="text-zinc-400">Oturum</span>
                    <code className="font-mono text-[11px] text-[#A66B49] truncate max-w-[190px]">
                      {authorizedDetails.sessionId}
                    </code>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <a
                  href="stokpro://"
                  className="w-full py-3.5 bg-gradient-to-r from-[#A66B49] to-[#8D583A] hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#A66B49]/25 flex items-center justify-center gap-2 no-underline transition"
                >
                  <FiExternalLink size={16} />
                  <span>Uygulamaya Dön</span>
                </a>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Web Paneline Git</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* DURUM 2: SÜRESİ DOLMUŞ / GEÇERSİZ OTURUM / LİSANS HATASI */}
          {(authStatus === "expired" ||
            authStatus === "invalid_session" ||
            authStatus === "license_error" ||
            authStatus === "error") && (
            <div className="text-center space-y-5 animate-fadeIn">
              <div
                className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border ${
                  authStatus === "expired"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                }`}
              >
                {authStatus === "expired" ? <FiClock size={26} /> : <FiAlertTriangle size={26} />}
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  {authStatus === "expired"
                    ? "Oturum Süresi Doldu"
                    : authStatus === "license_error"
                    ? "Lisans Hatası"
                    : "Yetkilendirme Başarısız"}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">{statusMessage}</p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <FiRefreshCw size={14} />
                  <span>Sayfayı Yenile</span>
                </button>

                <Link
                  href="/login"
                  className="block py-2 text-xs font-bold text-[#A66B49] hover:underline no-underline"
                >
                  Web Giriş Ekranına Git
                </Link>
              </div>
            </div>
          )}

          {/* DURUM 3: GİRİŞ VE YETKİLENDİRME (IDLE) */}
          {authStatus === "idle" && (
            <div className="space-y-5">
              {/* Oturum & Süre Bilgi Satırı */}
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Cihaz Oturumu
                  </span>
                  <code className="font-mono text-xs font-bold text-[#F7F7F5] truncate block">
                    {sessionId}
                  </code>
                </div>

                {timeLeft && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                      Kalan Süre
                    </span>
                    <span className="font-mono text-xs font-bold text-[#A66B49] inline-flex items-center gap-1">
                      <FiClock size={12} /> {timeLeft}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Masaüstü Terminalini Yetkilendirin
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Hesabınızla giriş yaptığınızda masaüstü kasanız otomatik açılır.
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-center gap-2.5"
                >
                  <FiAlertTriangle className="text-rose-400 shrink-0" size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {showActiveAccountCard ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#A66B49]/20 border border-[#A66B49]/35 text-[#A66B49] flex items-center justify-center font-extrabold text-sm shrink-0">
                        {currentUser.displayName
                          ? currentUser.displayName[0].toUpperCase()
                          : currentUser.email
                          ? currentUser.email[0].toUpperCase()
                          : <FiUser />}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-xs font-bold text-white block truncate">
                          {currentUser.displayName || "Giriş Yapılmış Hesap"}
                        </strong>
                        <span className="text-[11px] text-zinc-400 block truncate">
                          {currentUser.email}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] font-bold text-emerald-400 shrink-0">
                      AKTİF
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleAuthorize(false)}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#A66B49] to-[#8D583A] hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#A66B49]/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading
                      ? "Yetkilendiriliyor..."
                      : `Bu Hesapla Kasayı Aç (${currentUser.email?.split("@")[0]})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormError("");
                      setUseDifferentAccount(true);
                    }}
                    disabled={loading}
                    className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer bg-transparent border-0"
                  >
                    Farklı Hesapla Giriş Yap (E-posta veya Google)
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <form onSubmit={handleEmailAuthorize} className="space-y-3.5" noValidate>
                    <div>
                      <label
                        htmlFor="device-auth-email"
                        className="block text-xs font-bold text-zinc-300 mb-1.5"
                      >
                        E-posta Adresi
                      </label>
                      <div className="relative">
                        <FiMail
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                        />
                        <input
                          id="device-auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ornek@isletme.com"
                          autoComplete="email"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#0D0D11] border border-white/10 focus:border-[#A66B49] text-white placeholder-zinc-600 text-sm outline-none transition select-text"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="device-auth-password"
                          className="text-xs font-bold text-zinc-300"
                        >
                          Şifre
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-xs font-semibold text-[#A66B49] hover:underline no-underline"
                        >
                          Şifremi Unuttum
                        </Link>
                      </div>
                      <div className="relative">
                        <FiLock
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                        />
                        <input
                          id="device-auth-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          required
                          disabled={loading}
                          className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#0D0D11] border border-white/10 focus:border-[#A66B49] text-white placeholder-zinc-600 text-sm outline-none transition select-text"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 bg-transparent border-0 p-1 cursor-pointer flex items-center"
                        >
                          {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-[#A66B49] to-[#8D583A] hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#A66B49]/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "Yetkilendiriliyor..." : "Giriş Yap ve Kasayı Aç"}
                    </button>
                  </form>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      veya
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleAuthorize(true)}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-white hover:bg-zinc-100 text-[#18181B] font-bold text-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Google ile Giriş Yap</span>
                  </button>

                  {currentUser && useDifferentAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormError("");
                        setUseDifferentAccount(false);
                      }}
                      className="w-full py-1.5 text-xs font-semibold text-[#A66B49] hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      Mevcut oturuma dön ({currentUser.email})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alt Güvenlik Satırı */}
      <div className="max-w-xs mx-auto text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2 z-10 pb-1">
        <FiShield className="text-emerald-500 shrink-0" size={13} />
        <span>Güvenli Terminal Oturumu &bull; 256-Bit SSL</span>
      </div>
    </div>
  );
}
