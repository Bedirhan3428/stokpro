import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FiArrowRight, FiBox, FiPieChart, FiUsers, FiCheckCircle } from "react-icons/fi"; // Modern Feather İkonları
import Info from "./info";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <div className="home-container">
      {/* HERO BÖLÜMÜ (ANA GİRİŞ) */}
      <section className="hero-section">
        {!user && <div className="badge">🚀 Ücretsiz ve Kurulumsuz</div>}
        
        <h1 className="hero-title">
          Karmaşık Defterlere Son. <br />
          <span className="highlight">Stok ve Veresiyeni Dijitalde Yönet.</span>
        </h1>
        
        <p className="hero-description">
          Küçük işletmeler için en pratik çözüm. Ürünlerini saniyeler içinde ekle, 
          müşteri borçlarını takip et ve günün sonunda kazancını gör.
        </p>

        <div className="cta-group">
          <button 
            className="primary-btn" 
            onClick={() => navigate(user ? "/dashboard" : "/register")}
          >
            {user ? "Panele Git" : "Hemen Başla"} <FiArrowRight />
          </button>
          
          {!user && (
            <p className="sub-note">
              <FiCheckCircle style={{ marginRight: 5 }} /> Kredi kartı gerekmez
            </p>
          )}
        </div>
      </section>

      {/* ÖZELLİKLER GRID YAPISI */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="icon-box blue">
            <FiBox />
          </div>
          <h3>Hızlı Stok Girişi</h3>
          <p>Barkodla veya manuel olarak ürünlerini saniyeler içinde sisteme tanımla.</p>
        </div>

        <div className="feature-card">
          <div className="icon-box green">
            <FiUsers />
          </div>
          <h3>Veresiye Takibi</h3>
          <p>Kimin ne kadar borcu var asla unutma. Müşteri bazlı detaylı döküm al.</p>
        </div>

        <div className="feature-card">
          <div className="icon-box purple">
            <FiPieChart />
          </div>
          <h3>Anlık Raporlar</h3>
          <p>Ay sonunu bekleme. Kazancını, stoğunu ve alacaklarını tek tıkla gör.</p>
        </div>
      </section>

      {/* FOOTER / YASAL */}
      <footer className="home-footer">
        <div className="legal-links">
          Uygulamayı kullanarak <Link to="/terms-of-service">Hizmet Şartları</Link> ve <Link to="/privacy-policy">Gizlilik Politikası</Link>'nı kabul etmiş sayılırsınız.
        </div>
        <div className="system-info">
          <Info />
        </div>
      </footer>
    </div>
  );
}

