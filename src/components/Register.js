import "../styles/Register.css";
import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createUserProfile } from "../utils/firebaseHelpers";

export default function Register() {
  const { signup, user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!displayName.trim()) return setError("Görünen ad gerekli.");
    if (password !== confirm) return setError("Parolalar eşleşmiyor.");
    try {
      await signup(email.trim(), password, displayName.trim());
      try {
        await createUserProfile({
          name: displayName.trim(),
          email: email.trim(),
          lastLogin: new Date().toISOString()
        });
      } catch (profileErr) {
        console.warn("Profil kaydı yapılamadı:", profileErr);
      }
      try {
        localStorage.setItem("user", "true");
      } catch (storageErr) {
        console.warn("localStorage yazılamadı:", storageErr);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Kayıt başarısız.");
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle();
      try {
        await createUserProfile({ lastLogin: new Date().toISOString() });
      } catch (profileErr) {
        console.warn("Profil kaydı yapılamadı:", profileErr);
      }
      try {
        localStorage.setItem("user", "true");
      } catch (storageErr) {
        console.warn("localStorage yazılamadı:", storageErr);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google ile kayıt başarısız.");
    }
  }

  return (
    <div className="reg-kapsul" role="main" aria-labelledby="register-title">
      <h3 id="register-title" className="reg-baslik">Kayıt Ol</h3>
      <p className="reg-alt">Hızla kaydolun ve StokPro'yu kullanmaya başlayın</p>

      <form onSubmit={handleSubmit} className="reg-form" noValidate>
        <input
          className="reg-input"
          aria-label="Görünen ad"
          required
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Görünen adınız"
        />
        <input
          className="reg-input"
          aria-label="Email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
        />
        <input
          className="reg-input"
          aria-label="Parola"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parolanız"
        />
        <input
          className="reg-input"
          aria-label="Parola (Tekrar)"
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Parolayı tekrar girin"
        />

        {error && <div className="reg-hata" role="alert">{error}</div>}

        <div className="reg-aks">
          <button className="reg-btn mavi" type="submit">Kayıt Ol</button>
          <button type="button" className="reg-btn cizgi" onClick={handleGoogle} aria-label="Google ile kayıt">
            Google ile devam et
          </button>
        </div>

        <Link to="/login" className="reg-link">Zaten hesabınız var mı? Giriş yap</Link>
      </form>
    </div>
  );
}