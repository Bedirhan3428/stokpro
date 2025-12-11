import "../styles/VerifyEmail.css";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { sendEmailVerification, getAuth } from "firebase/auth";

export default function VerifyEmail() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user && user.emailVerified) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  async function refreshStatus() {
    if (!user) return;
    setChecking(true);
    setStatus(null);
    try {
      await refreshUser();
      // Check the current user from Firebase auth after refresh
      const auth = getAuth();
      if (auth.currentUser && auth.currentUser.emailVerified) {
        setStatus({ type: "success", msg: "E-posta doğrulandı! Yönlendiriliyorsunuz..." });
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      } else {
        setStatus({ type: "info", msg: "E-posta henüz doğrulanmadı. Lütfen gelen kutunuzu kontrol edin." });
      }
    } catch (err) {
      console.error("refreshStatus error:", err);
      setStatus({ type: "error", msg: "Durum kontrol edilemedi. Lütfen tekrar deneyin." });
    } finally {
      setChecking(false);
    }
  }

  async function resendVerification() {
    if (!user) return;
    setResending(true);
    setStatus(null);
    try {
      await sendEmailVerification(user);
      setStatus({ type: "success", msg: "Doğrulama e-postası yeniden gönderildi. Gelen kutunuzu kontrol edin." });
    } catch (err) {
      console.error("resendVerification error:", err);
      let message = err.message || "E-posta gönderilemedi.";
      if (err.code === "auth/too-many-requests") {
        message = "Çok fazla istek gönderildi. Lütfen biraz bekleyin.";
      }
      setStatus({ type: "error", msg: message });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="ve-kapsul">
      <h3 className="ve-baslik">E-posta Doğrulaması</h3>
      <div className="ve-icerik">
        <p className="ve-aciklama">
          E-posta adresinizi doğrulamak için gelen kutunuza gönderilen bağlantıya tıklayın.
        </p>
        <p className="ve-email">{user?.email}</p>

        <div className="ve-islemler">
          <button
            className="ve-btn ve-btn-mavi"
            onClick={refreshStatus}
            disabled={checking}
          >
            {checking ? "Kontrol Ediliyor..." : "Durumu Yenile"}
          </button>
          <button
            className="ve-btn ve-btn-gri"
            onClick={resendVerification}
            disabled={resending}
          >
            {resending ? "Gönderiliyor..." : "E-postayı Yeniden Gönder"}
          </button>
        </div>

        {status && (
          <div
            className={`ve-durum ${
              status.type === "error"
                ? "ve-hata"
                : status.type === "success"
                ? "ve-basarili"
                : "ve-bilgi"
            }`}
            role={status.type === "error" ? "alert" : "status"}
          >
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}
