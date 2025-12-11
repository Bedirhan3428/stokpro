import "../styles/ForgotPassword.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, sendEmailVerification, applyActionCode } from "firebase/auth";

export default function VerifyEmail() {
  const auth = getAuth();
  const nav = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  const [status, setStatus] = useState(null); // { type: "success"|"error"|"info", msg }
  const [loading, setLoading] = useState(false);

  // Linkten gelen oobCode'u yakala ve doğrulamayı tamamla
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    async function handleOob() {
      if (mode !== "verifyEmail" || !oobCode) return;
      setLoading(true);
      setStatus({ type: "info", msg: "Doğrulama işleniyor..." });
      try {
        await applyActionCode(auth, oobCode); // doğrulamayı tamamla
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            const dest = (location.state && location.state.from?.pathname) || "/dashboard";
            setStatus({ type: "success", msg: "E-posta doğrulandı, yönlendiriliyorsunuz..." });
            setTimeout(() => nav(dest, { replace: true }), 800);
            return;
          }
        }
        // Oturum yoksa da kod işlenmiştir; kullanıcı giriş yaptığında verified olur
        setStatus({ type: "success", msg: "E-posta doğrulandı. Giriş yaptıktan sonra devam edebilirsiniz." });
      } catch (err) {
        setStatus({ type: "error", msg: err.message || "Doğrulama kodu işlenemedi." });
      } finally {
        setLoading(false);
      }
    }

    handleOob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function resend() {
    if (!user) return;
    setStatus(null);
    setLoading(true);
    try {
      // PROD domain sabit: stokpro.shop
      const actionCodeSettings = {
        url: "https://www.stokpro.shop/verify-email",
        handleCodeInApp: true
      };
      await sendEmailVerification(user, actionCodeSettings);
      setStatus({ type: "success", msg: "Doğrulama e-postası tekrar gönderildi. Gelen kutunuzu kontrol edin." });
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "E-posta gönderilemedi." });
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    if (!user) return;
    setLoading(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        const dest = (location.state && location.state.from?.pathname) || "/dashboard";
        nav(dest, { replace: true });
      } else {
        setStatus({ type: "info", msg: "Henüz doğrulanmadı. Lütfen e-postanızı kontrol edin." });
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Durum yenilenemedi." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-kapsul">
      <h3 className="fp-baslik">E-posta Doğrulama</h3>
      <p className="fp-alt">
        {user?.email ? `Hesap: ${user.email}` : "Oturum bulunamadı. Lütfen tekrar giriş yapın."}
      </p>

      <div className="fp-form">
        <button className="fp-btn fp-btn-mavi" onClick={resend} disabled={loading || !user}>
          {loading ? "Gönderiliyor..." : "Doğrulama E-postasını Gönder"}
        </button>

        <button className="fp-btn" style={{ marginTop: "10px" }} onClick={refreshStatus} disabled={loading || !user}>
          {loading ? "Yenileniyor..." : "Doğrulama Durumunu Yenile"}
        </button>

        <button
          className="fp-btn"
          style={{ marginTop: "10px" }}
          onClick={() => nav("/login", { replace: true })}
        >
          Geri Dön / Yeniden Giriş
        </button>

        {status && (
          <div
            className={`fp-durum ${
              status.type === "error" ? "fp-hata" : status.type === "success" ? "fp-basarili" : ""
            }`}
            role={status.type === "error" ? "alert" : "status"}
            style={{ marginTop: "12px" }}
          >
            {status.msg}
          </div>
        )}
      </div>

      <div className="fp-mini" style={{ marginTop: "12px", color: "var(--subtext)" }}>
        Doğrulama maili gelmediyse spam / gereksiz klasörünü kontrol edin.
      </div>
    </div>
  );
}