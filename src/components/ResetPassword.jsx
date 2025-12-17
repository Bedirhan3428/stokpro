import "../styles/ForgotPassword.css";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

export default function ResetPassword() {
  const auth = getAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [oobCode, setOobCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams. get("oobCode");

    if (! code) {
      setStatus({ type:  "error", msg:  "Geçersiz bağlantı." });
      setLoading(false);
      return;
    }

    setOobCode(code);
    
    verifyPasswordResetCode(auth, code)
      .then((mail) => {
        setEmail(mail);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ type: "error", msg: "Bağlantı geçersiz veya süresi dolmuş." });
        setLoading(false);
      });
  }, [auth, searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password.length < 6) {
      setStatus({ type:  "error", msg:  "Parola en az 6 karakter olmalı." });
      return;
    }

    setLoading(true);
    setStatus(null);
    
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus({ type: "success", msg: "Parola güncellendi!  Yönlendiriliyorsunuz..." });
      setTimeout(() => nav("/login", { replace: true }), 1500);
    } catch (err) {
      let message = "Parola güncellenemedi. ";
      if (err.code === "auth/weak-password") message = "Parola çok zayıf. ";
      if (err.code === "auth/expired-action-code") message = "Bağlantı süresi dolmuş.";
      if (err.code === "auth/invalid-action-code") message = "Geçersiz bağlantı. ";
      setStatus({ type: "error", msg: message });
      setLoading(false);
    }
  }

  if (loading && !email) {
    return (
      <div className="fp-kapsul">
        <h3 className="fp-baslik">Şifre Sıfırlama</h3>
        <p>Doğrulanıyor...</p>
      </div>
    );
  }

  if (status?. type === "error" && ! email) {
    return (
      <div className="fp-kapsul">
        <h3 className="fp-baslik">Şifre Sıfırlama</h3>
        <div className="fp-durum fp-hata">{status.msg}</div>
        <button className="fp-btn" onClick={() => nav("/forgot-password")}>
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="fp-kapsul">
      <h3 className="fp-baslik">Yeni Şifre Belirle</h3>
      <p className="fp-alt">{email}</p>

      <form className="fp-form" onSubmit={handleSubmit} noValidate>
        <label className="fp-etiket">Yeni Parola</label>
        <input
          className="fp-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target. value)}
          placeholder="En az 6 karakter"
          required
          minLength={6}
        />

        <div className="fp-islem">
          <button className="fp-btn fp-btn-mavi" type="submit" disabled={loading}>
            {loading ? "İşleniyor..." : "Parolayı Güncelle"}
          </button>
        </div>

        {status && (
          <div className={`fp-durum ${status.type === "error" ?  "fp-hata" : "fp-basarili"}`}>
            {status.msg}
          </div>
        )}
      </form>
    </div>
  );
}