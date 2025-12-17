import "../styles/ForgotPassword.css";
import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // { type: "success"|"error", msg: string }
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
      // PROD domain sabit: stokpro.shop (gerekirse localhost için koşullu ekleyebilirsiniz)
      const actionCodeSettings = {
        url: "https://www.stokpro.shop/reset-password",
        handleCodeInApp: true
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setStatus({
        type: "success",
        msg: "Şifre sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu kontrol edin."
      });
    } catch (err) {
      console.error("sendPasswordResetEmail error", err);
      let message = err.message || "Şifre sıfırlama gönderilemedi.";
      if (err.code === "auth/user-not-found") message = "Bu e-posta ile kayıtlı kullanıcı bulunamadı.";
      if (err.code === "auth/invalid-email") message = "Geçersiz e-posta adresi.";
      setStatus({ type: "error", msg: message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fp-kapsul">
      <h3 className="fp-baslik">Şifre Sıfırlama</h3>
      <form onSubmit={handleSubmit} className="fp-form" noValidate>
        <label className="fp-etiket">E-posta</label>
        <input
          className="fp-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="E-posta"
        />

        <div className="fp-islem">
          <button className="fp-btn fp-btn-mavi" type="submit" disabled={sending}>
            {sending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>
        </div>

        {status && (
          <div
            className={`fp-durum ${status.type === "error" ? "fp-hata" : "fp-basarili"}`}
            role={status.type === "error" ? "alert" : "status"}
          >
            {status.msg}
          </div>
        )}
      </form>
    </div>
  );
}