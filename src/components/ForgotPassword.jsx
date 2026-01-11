import "../styles/ForgotPassword.css";
import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom"; // Geri dön linki için

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    if (!email || !email.includes("@")) {
      setStatus({ type: "error", msg: "Lütfen geçerli bir e-posta girin." });
      return;
    }

    setSending(true);
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus({
        type: "success",
        msg: "Sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.",
      });
      setEmail(""); // Başarılıysa inputu temizle
    } catch (err) {
      let message = "İşlem başarısız.";
      if (err.code === "auth/user-not-found") message = "Bu e-posta ile kayıtlı kullanıcı yok.";
      if (err.code === "auth/invalid-email") message = "Geçersiz e-posta formatı.";
      if (err.code === "auth/too-many-requests") message = "Çok fazla denediniz. Biraz bekleyin.";
      setStatus({ type: "error", msg: message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fp-kapsul">
      <h3 className="fp-baslik">Şifre Sıfırlama</h3>
      <p className="fp-alt">
        Hesabınıza ait e-posta adresini girin, size sıfırlama bağlantısı gönderelim.
      </p>
      
      <form onSubmit={handleSubmit} className="fp-form" noValidate>
        
        {/* Floating Label Input */}
        <div className="fp-input-grup">
          <input
            className="fp-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" " 
            required
          />
          <label className="fp-etiket">E-posta Adresi</label>
        </div>

        <div className="fp-islem">
          <button className="fp-btn" type="submit" disabled={sending}>
            {sending ? "Gönderiliyor..." : "Bağlantı Gönder"}
          </button>
        </div>

        {status && (
          <div className={`fp-durum ${status.type === "error" ? "fp-hata" : "fp-basarili"}`}>
            {status.msg}
          </div>
        )}
      </form>

      <div className="fp-geri-don">
        <Link to="/login" className="fp-link">← Giriş ekranına dön</Link>
      </div>
    </div>
  );
}

