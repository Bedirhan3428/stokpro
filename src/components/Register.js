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
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    if (!displayName.trim()) return setError("Görünen ad gerekli.");
    if (password !== confirm) return setError("Parolalar eşleşmiyor.");
    
    setLoading(true);
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
    } finally {
      setLoading(false);
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
    <div className="reg-kapsul" role="main">
      <h3 className="reg-baslik">Hesap Oluştur</h3>
      <p className="reg-alt">Hızla kaydolun ve StokPro'yu kullanmaya başlayın</p>

      <form onSubmit={handleSubmit} className="reg-form" noValidate>
        
        {/* İsim Alanı */}
        <div className="reg-input-grup">
          <input
            id="name"
            className="reg-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder=" "
            required
            autoComplete="name"
          />
          <label htmlFor="name" className="reg-etiket">Adınız Soyadınız</label>
        </div>

        {/* Email Alanı */}
        <div className="reg-input-grup">
          <input
            id="email"
            className="reg-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=" "
            required
            autoComplete="email"
          />
          <label htmlFor="email" className="reg-etiket">E-posta Adresi</label>
        </div>

        {/* Şifre Alanı */}
        <div className="reg-input-grup">
          <input
            id="password"
            className="reg-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=" "
            required
            autoComplete="new-password"
          />
          <label htmlFor="password" className="reg-etiket">Parola</label>
        </div>

        {/* Şifre Tekrar Alanı */}
        <div className="reg-input-grup">
          <input
            id="confirm"
            className="reg-input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder=" "
            required
            autoComplete="new-password"
          />
          <label htmlFor="confirm" className="reg-etiket">Parola (Tekrar)</label>
        </div>

        {error && <div className="reg-hata" role="alert">{error}</div>}

        <div className="reg-aks">
          <button className="reg-btn mavi" type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
          
          <button 
            type="button" 
            className="reg-btn google" 
            onClick={handleGoogle} 
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google ile devam et
          </button>
        </div>

        <Link to="/login" className="reg-link">
          Zaten hesabınız var mı? <strong>Giriş yap</strong>
        </Link>
      </form>
    </div>
  );
}