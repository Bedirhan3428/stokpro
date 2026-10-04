"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FiCheckCircle, FiAlertTriangle, FiClock, FiShield, 
  FiMonitor, FiArrowRight, FiRefreshCw, FiExternalLink, FiUser
} from "react-icons/fi";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { getUserProfile } from "../utils/firebaseHelpers";
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
  const [authStatus, setAuthStatus] = useState("idle"); // "idle" | "loading" | "authorized" | "expired" | "invalid_session" | "license_error" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [authorizedDetails, setAuthorizedDetails] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Mevcut Firebase oturumunu dinle
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Süre ve Oturum Geçerliliği Kontrolü
  const expiryTimestamp = useMemo(() => {
    if (!expiresParam) return null;
    const num = Number(expiresParam);
    return isNaN(num) ? null : num;
  }, [expiresParam]);

  useEffect(() => {
    if (!sessionId) {
      setAuthStatus("invalid_session");
      setStatusMessage("Geçersiz veya eksik oturum parametresi (session bulunamadı). Lütfen masaüstü uygulamasından tekrar giriş başlatın.");
      return;
    }

    if (expiryTimestamp) {
      const checkExpiry = () => {
        const diff = expiryTimestamp - Date.now();
        if (diff <= 0) {
          setTimeLeft(0);
          setAuthStatus("expired");
          setStatusMessage("Bu giriş bağlantısının kullanım süresi dolmuş. Güvenliğiniz için lütfen masaüstü uygulamasından yeni bir giriş başlatın.");
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
  }, [sessionId, expiryTimestamp]);

  // Google ile Giriş ve Masaüstü Terminali Yetkilendirme
  async function handleAuthorize(forceNewPopup = false) {
    if (authStatus === "expired" || authStatus === "invalid_session") return;

    setLoading(true);
    setStatusMessage("");

    try {
      let targetUser = currentUser;

      // Eğer kullanıcı oturum açmamışsa veya farklı hesapla girmek istiyorsa Google Popup aç
      if (!targetUser || forceNewPopup) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const result = await signInWithPopup(auth, provider);
        targetUser = result.user;
        setCurrentUser(targetUser);
      }

      if (!targetUser || !targetUser.uid) {
        throw new Error("Kullanıcı kimliği doğrulanamadı.");
      }

      const uid = targetUser.uid;

      // 1. Lisans Durumu Kontrolü (artifacts/marketpro-main/users/{uid}/profile/user_doc veya fallback)
      let profileData = null;
      let subscriptionStatus = null;

      // A: marketpro-main koleksiyonu kontrolü
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

      // B: Varsayılan ARTIFACT_DOC_ID kontrolü
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

      // C: getUserProfile fallback (otomatik lifetime sağlayan dahili fonksiyon)
      if (!profileData || !subscriptionStatus) {
        try {
          profileData = await getUserProfile(uid);
          subscriptionStatus = profileData?.subscriptionStatus;
        } catch (err) {
          console.warn("getUserProfile fallback uyarısı:", err?.message);
        }
      }

      const validStatuses = ["active_lifetime", "pro", "active", "free_forever"];
      const currentStatusClean = String(subscriptionStatus || "").toLowerCase();
      const isLicenseValid = validStatuses.includes(currentStatusClean);

      if (!isLicenseValid) {
        setAuthStatus("license_error");
        setStatusMessage(`Hesabınızda aktif bir lisans bulunamadı (Durum: ${subscriptionStatus || "Geçersiz"}). Lütfen lisansınızı kontrol edin veya destek ekibi ile iletişime geçin.`);
        setLoading(false);
        return;
      }

      // 1.8. Kullanıcının Mevcut Ürün ve Carilerini Çek (Masaüstü senkronizasyonu için)
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

      // 1.9. Terminal Güvenlik Anahtarı (Key DB'de ASLA düz metin tutulmaz, SHA-256 hash ile saklanır)
      let terminalKey = "";
      let terminalKeyHash = profileData?.terminalKeyHash || "";

      if (!terminalKeyHash) {
        terminalKey = generateTerminalKey();
        terminalKeyHash = await hashKey(terminalKey);

        try {
          const profileDocRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
          await setDoc(profileDocRef, {
            terminalKeyHash,
            terminalKeyMasked: maskKey(terminalKey),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (hErr) {
          console.warn("Terminal hash kaydı uyarısı:", hErr);
        }
      }

      // 2. device_sessions/{sessionId} Belgesini Güncelle
      const sessionRef = doc(db, "device_sessions", sessionId);
      const sessionPayload = {
        terminalKey: terminalKey || terminalKeyHash.slice(0, 16),
        terminalKeyHash,
        status: "authorized",
        uid: targetUser.uid,
        email: targetUser.email || "",
        storeName: profileData?.storeName || profileData?.companyTitle || targetUser.displayName || "StokPro Mağaza",
        displayName: targetUser.displayName || profileData?.name || "Yetkili",
        subscriptionStatus: subscriptionStatus || "active_lifetime",
        authorizedAt: new Date().toISOString(),
        authMethod: "google",
        products: cloudProducts,
        productsCount: cloudProducts.length,
        customers: cloudCustomers,
        customersCount: cloudCustomers.length
      };

      try {
        await updateDoc(sessionRef, sessionPayload);
      } catch (updErr) {
        // Belge yoksa setDoc ile merge et
        await setDoc(sessionRef, sessionPayload, { merge: true });
      }

      // 3. Başarılı Sonuç ve Ses Efekti
      playSuccessSound();
      logUserActivity(
        "DEVICE_SESSION_AUTHORIZED",
        "Masaüstü Terminali Yetkilendirildi",
        {
          sessionId,
          email: targetUser.email,
          storeName: sessionPayload.storeName
        },
        { uid: targetUser.uid, email: targetUser.email }
      ).catch(() => {});

      setAuthorizedDetails({
        email: targetUser.email,
        displayName: sessionPayload.displayName,
        storeName: sessionPayload.storeName,
        sessionId
      });
      setAuthStatus("authorized");

    } catch (err) {
      console.error("Yetkilendirme hatası:", err);
      setAuthStatus("error");
      setStatusMessage(err?.message || "Yetkilendirme sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem 1rem",
      background: "var(--bg-app)"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "var(--bg-card)",
        borderRadius: "16px",
        border: "1px solid var(--border-main)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
        overflow: "hidden"
      }}>
        {/* ÜST MARKA ÇUBUĞU */}
        <div style={{
          padding: "1.5rem 1.75rem 1.25rem",
          borderBottom: "1px solid var(--border-main)",
          background: "var(--bg-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1.1rem"
            }}>
              S
            </div>
            <div>
              <strong style={{ fontSize: "1.05rem", color: "var(--text-main)", display: "block", letterSpacing: "-0.01em" }}>
                StokPro®
              </strong>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Kasa Terminali Hızlı Giriş
              </span>
            </div>
          </div>

          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.65rem",
            borderRadius: "999px",
            background: "rgba(37, 99, 235, 0.12)",
            color: "var(--primary)",
            fontSize: "0.72rem",
            fontWeight: 800,
            border: "1px solid rgba(37, 99, 235, 0.25)"
          }}>
            <FiMonitor size={13} /> Masaüstü Cihaz
          </span>
        </div>

        {/* İÇERİK ALANI */}
        <div style={{ padding: "1.75rem" }}>
          
          {/* DURUM 1: BAŞARILI YETKİLENDİRME (KASA AÇILDI) */}
          {authStatus === "authorized" && (
            <div style={{ textAlign: "center", animation: "fadeIn 0.25s ease-out" }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
                marginBottom: "1rem",
                border: "2px solid rgba(16, 185, 129, 0.3)"
              }}>
                <FiCheckCircle />
              </div>

              <span style={{
                display: "inline-block",
                padding: "0.3rem 0.9rem",
                borderRadius: "999px",
                background: "#10b981",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "0.85rem",
                marginBottom: "0.75rem",
                letterSpacing: "0.5px"
              }}>
                Masaüstü kasanız açıldı ✓
              </span>

              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-main)", margin: "0 0 0.5rem" }}>
                Yetkilendirme Başarılı
              </h2>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
                Masaüstü StokPro kasanız oturumu milisaniyeler içinde algıladı ve otomatik olarak açıldı. Bu tarayıcı penceresini güvenle kapatabilirsiniz.
              </p>

              {/* MAĞAZA VE KULLANICI ÖZETİ */}
              {authorizedDetails && (
                <div style={{
                  background: "var(--bg-subtle)",
                  borderRadius: "10px",
                  padding: "1rem",
                  border: "1px solid var(--border-main)",
                  marginBottom: "1.5rem",
                  textAlign: "left",
                  fontSize: "0.82rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Mağaza:</span>
                    <strong style={{ color: "var(--text-main)" }}>{authorizedDetails.storeName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Yetkili:</span>
                    <strong style={{ color: "var(--text-main)" }}>{authorizedDetails.displayName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>E-posta:</span>
                    <strong style={{ color: "var(--text-main)" }}>{authorizedDetails.email}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Terminal Oturumu:</span>
                    <code style={{ fontSize: "0.75rem", background: "var(--bg-card)", padding: "1px 6px", borderRadius: "4px" }}>
                      {authorizedDetails.sessionId}
                    </code>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <a
                  href="stokpro://"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.8rem",
                    background: "var(--primary)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    textDecoration: "none"
                  }}
                >
                  <FiExternalLink size={16} /> Uygulamaya Dön
                </a>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    background: "transparent",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-main)",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  StokPro Web Paneline Git <FiArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* DURUM 2: SÜRESİ DOLMUŞ VEYA GEÇERSİZ OTURUM */}
          {(authStatus === "expired" || authStatus === "invalid_session" || authStatus === "license_error" || authStatus === "error") && (
            <div style={{ textAlign: "center", animation: "fadeIn 0.25s ease-out" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: authStatus === "expired" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: authStatus === "expired" ? "#f59e0b" : "#ef4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.9rem",
                marginBottom: "1rem"
              }}>
                {authStatus === "expired" ? <FiClock /> : <FiAlertTriangle />}
              </div>

              <h2 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--text-main)", margin: "0 0 0.5rem" }}>
                {authStatus === "expired" 
                  ? "Oturum Süresi Doldu" 
                  : authStatus === "license_error"
                  ? "Lisans Hatası"
                  : "Yetkilendirme Başarısız"}
              </h2>

              <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
                {statusMessage}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    background: "var(--bg-subtle)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-main)",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  <FiRefreshCw size={14} /> Sayfayı Yenile
                </button>

                <Link
                  href="/login"
                  style={{
                    display: "block",
                    padding: "0.65rem",
                    color: "var(--primary)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    textDecoration: "none"
                  }}
                >
                  Web Giriş Ekranına Git
                </Link>
              </div>
            </div>
          )}

          {/* DURUM 3: BEKLEME / GİRİŞ VE ONAY İSTEĞİ (IDLE) */}
          {(authStatus === "idle" || authStatus === "loading") && (
            <div>
              {/* TERMİNAL BİLGİ KUTUSU */}
              <div style={{
                background: "var(--bg-subtle)",
                borderRadius: "10px",
                border: "1px solid var(--border-main)",
                padding: "0.9rem 1rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, display: "block" }}>
                    Cihaz Oturumu:
                  </span>
                  <code style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--primary)" }}>
                    {sessionId}
                  </code>
                </div>

                {timeLeft && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                      Kalan Süre:
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <FiClock size={12} /> {timeLeft}
                    </span>
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--text-main)", margin: "0 0 0.4rem" }}>
                Masaüstü Terminalini Yetkilendirin
              </h2>
              <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
                StokPro Masaüstü Kasa Terminaliniz güvenli oturum açma isteği gönderdi. Kasanızı açmak için işletme Google hesabınızla giriş yapın.
              </p>

              {/* HALİHAZIRDA OTURUM AÇMIŞ KULLANICI VARSA */}
              {currentUser && (
                <div style={{
                  background: "rgba(37, 99, 235, 0.05)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  borderRadius: "10px",
                  padding: "0.9rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "0.85rem"
                    }}>
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <FiUser />}
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.86rem", color: "var(--text-main)", display: "block" }}>
                        {currentUser.displayName || "Giriş Yapılmış Hesap"}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {currentUser.email}
                      </span>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 800 }}>
                    Aktif Oturum
                  </span>
                </div>
              )}

              {/* ANA YETKİLENDİRME BUTONU */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => handleAuthorize(false)}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                    padding: "0.85rem 1rem",
                    background: "#ffffff",
                    color: "#1f2937",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    transition: "all 0.15s ease",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {/* GOOGLE LOGOSU */}
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  {loading 
                    ? "Yetkilendiriliyor..." 
                    : currentUser 
                    ? `Bu Hesapla Terminali Aç (${currentUser.email?.split('@')[0]})` 
                    : "Google ile Giriş Yap"}
                </button>

                {currentUser && (
                  <button
                    type="button"
                    onClick={() => handleAuthorize(true)}
                    disabled={loading}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "0.3rem"
                    }}
                  >
                    Farklı Google Hesabı ile Giriş Yap
                  </button>
                )}
              </div>

              {/* GÜVENLİK NOTU */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border-main)",
                fontSize: "0.72rem",
                color: "var(--text-muted)"
              }}>
                <FiShield style={{ color: "#10b981", shrink: 0 }} size={14} />
                <span>Uçtan uca şifreli oturum. Kimlik bilgileriniz cihazınızda güvenle saklanır.</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
