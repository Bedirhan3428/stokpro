import "../styles/global.css";
import "../styles/ForgotPassword.css";

import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

/**
 * ForgotPassword
 * - Kullanıcı eposta girer, submit ile Firebase'e reset maili gönderilir.
 * - (İsteğe bağlı) actionCodeSettings ile kullanıcıyı uygulamanıza yönlendiren özel link ayarlayabilirsiniz.
 */
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
      await sendPasswordResetEmail(auth, email /*, actionCodeSettings */);
      setStatus({ type: "success", msg: "Şifre sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu kontrol edin." });
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
    <div className="card page-forgot-password forgot-card">
      <h3 className="forgot-title">Şifre Sıfırlama</h3>
      <form onSubmit={handleSubmit} className="forgot-form" noValidate>
        <label className="input-label">E-posta</label>
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="E-posta"
        />

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>
        </div>

        {status && (
          <div className={`status-message ${status.type === "error" ? "status-error" : "status-success"}`} role={status.type === "error" ? "alert" : "status"}>
            {status.msg}
          </div>
        )}
      </form>
    </div>
  );
}