import "../styles/Login.css";
import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Giriş başarısız.");
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google ile giriş başarısız.");
    }
  }

  return (
    <div className="lg-kapsul" role="main" aria-labelledby="login-title">
      <h3 id="login-title" className="lg-baslik">Giriş Yap</h3>
      <p className="lg-alt">Hesabınıza giriş yapın</p>

      <form onSubmit={handleSubmit} className="lg-form" noValidate>
        <input
          className="lg-input"
          aria-label="Email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
        />
        <input
          className="lg-input"
          aria-label="Parola"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parolanız"
        />

        {error && <div className="lg-hata" role="alert">{error}</div>}

        <Link to="/forgot-password" className="lg-link">Şifremi Unuttum</Link>

        <div className="lg-aksiyon">
          <button className="lg-btn mavi" type="submit">Giriş</button>

          <button
            type="button"
            className="lg-btn google"
            onClick={handleGoogle}
            aria-label="Google ile giriş"
          >
            Google ile devam et
          </button>
        </div>
        <Link to="/register" className="lg-link ikincil">Hesabınız yok mu? Kayıt ol</Link>
      </form>
    </div>
  );
}