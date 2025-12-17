import "../styles/ForgotPassword.css";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

export default function ResetPassword() {
  const auth = getAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [oobCode, setOobCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const code = params.get("oobCode");

    if (mode !== "resetPassword" || !code) {
      setStatus({ type: "error", msg: "Geçersiz veya eksik şifre sıfırlama bağlantısı." });
      return;
    }

    setOobCode(code);
    setLoading(true);
    verifyPasswordResetCode(auth, code)
      .then((mail) => {
        setEmail(mail);
        setStatus({ type: "info", msg: `Hesap: ${mail}` });
      })
      .catch((err) => {
        setStatus({ type: "error", msg: err.message || "Bağlantı geçersiz veya süresi dolmuş." });
      })
      .finally(() => setLoading(false));
  }, [auth, location.search]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!oobCode) return setStatus({ type: "error", msg: "Geçersiz bağlantı." });
    if (!password || password.length < 6) return setStatus({ type: "error", msg: "Parola en az 6 karakter olmalı." });

    setLoading(true);
    setStatus(null);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus({ type: "success", msg: "Parola güncellendi. Giriş sayfasına yönlendiriliyorsunuz..." });
      setTimeout(() => nav("/login", { replace: true }), 900);
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Parola güncellenemedi." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-kapsul">
      <h3 className="fp-baslik">Şifreyi Sıfırla</h3>
      <p className="fp-alt">{email ? `Hesap: ${email}` : "Şifre sıfırlama bağlantısı doğrulanıyor..."}</p>

      <form className="fp-form" onSubmit={handleSubmit} noValidate>
        <label className="fp-etiket">Yeni Parola</label>
        <input
          className="fp-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Yeni parolanız"
          required
          minLength={6}
        />

        <div className="fp-islem">
          <button className="fp-btn fp-btn-mavi" type="submit" disabled={loading || !oobCode}>
            {loading ? "İşleniyor..." : "Parolayı Güncelle"}
          </button>
          <button className="fp-btn" type="button" onClick={() => nav("/login", { replace: true })}>
            Girişe Dön
          </button>
        </div>

        {status && (
          <div
            className={`fp-durum ${status.type === "error" ? "fp-hata" : status.type === "success" ? "fp-basarili" : ""}`}
            role={status.type === "error" ? "alert" : "status"}
          >
            {status.msg}
          </div>
        )}
      </form>
    </div>
  );
}