import '../styles/global.css';
import '../styles/Register.css';

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
    if (!displayName.trim()) {
      setError("Görünen ad gerekli.");
      return;
    }
    if (password !== confirm) {
      setError("Parolalar eşleşmiyor.");
      return;
    }
    try {
      // create auth user
      await signup(email.trim(), password, displayName.trim());

      // persist profile doc for the newly created user
      try {
        await createUserProfile({
          name: displayName.trim(),
          email: email.trim(),
          lastLogin: new Date().toISOString()
        });
      } catch (profileErr) {
        // non-fatal (auth succeeded) but surface to console
        console.warn("Profil kaydı yapılamadı:", profileErr);
      }

      // set local flag indicating authenticated user
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

      // ensure profile doc exists/updated for Google user
      try {
        await createUserProfile({
          lastLogin: new Date().toISOString()
        });
      } catch (profileErr) {
        console.warn("Profil kaydı yapılamadı:", profileErr);
      }

      // set local flag indicating authenticated user
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
    <div className="auth-card card page-register" role="main" aria-labelledby="register-title">
      <h3 id="register-title" className="register-title">Kayıt Ol</h3>
      <p className="auth-sub">Hızla kaydolun ve StokPro'yu kullanmaya başlayın</p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <input
          className="auth-input"
          aria-label="Görünen ad"
          required
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Görünen adınız"
        />
        <input
          className="auth-input"
          aria-label="Email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
        />
        <input
          className="auth-input"
          aria-label="Parola"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parolanız"
        />
        <input
          className="auth-input"
          aria-label="Parola (Tekrar)"
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Parolayı tekrar girin"
        />

        {error && <div className="auth-error" role="alert">{error}</div>}

        <div className="auth-actions">
          <button className="btn btn-primary register-submit" type="submit">Kayıt Ol</button>

          <button
            type="button"
            className="btn btn-google"
            onClick={handleGoogle}
            aria-label="Google ile kayıt"
          >
            <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.6h5.2c-.2 1.1-.9 2.5-2.2 3.4l-.1.1 3 2.3.2.1C20.4 18 22 15.5 22 12c0-.8-.1-1.6-.3-2.4H12z"/>
              <path fill="#34A853" d="M6.6 14.1c-.3-.9-.5-1.9-.5-2.9s.2-2 .5-2.9L3.5 6.1 3.3 6.3C2 8.1 1.2 10.1 1.2 12c0 1.9.8 3.9 2.1 5.7l3.3-3.6z"/>
              <path fill="#4A90E2" d="M12 4.8c1.4 0 2.7.5 3.7 1.5l2.8-2.8C16.9 1.9 14.6 1 12 1 8.7 1 5.8 2.4 3.8 4.9l3.3 3.6C8.6 7.6 10.2 6.8 12 6.8z"/>
              <path fill="#FBBC05" d="M3.8 4.9L6.6 8c.6-.9 1.4-1.6 2.4-2L7 3.8 3.8 4.9z"/>
            </svg>
            Google ile devam et
          </button>
        
         
        </div>
         <Link to="/login" className="auth-link">Zaten hesabınız var mı? Giriş yap</Link>
      </form>
    </div>
  );
}