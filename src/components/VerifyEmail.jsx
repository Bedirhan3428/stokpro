import "../styles/ForgotPassword.css"; // basit stil için mevcut dosyayı kullandık
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, sendEmailVerification } from "firebase/auth";

export default function VerifyEmail() {
  const auth = getAuth();
  const nav = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  const [status, setStatus] = useState(null); // { type: "success"|"error", msg }
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!user) return;
    setStatus(null);
    setLoading(true);
    try {
      await sendEmailVerification(user);
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
        // Doğrulanınca, geldiği sayfaya veya dashboard'a gönder
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