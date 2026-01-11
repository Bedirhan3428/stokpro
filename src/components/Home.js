import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  FiArrowRight, 
  FiSearch, 
  FiAlertTriangle, 
  FiTrendingDown, 
  FiAward, 
  FiCheckCircle,
  FiBox,
  FiUsers,
  FiPieChart
} from "react-icons/fi"; // Modern İkonlar
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
      
      {/* 1. HERO BÖLÜMÜ (ANA GİRİŞ) */}
      <section className="hero-section">
        {!user && <div className="badge"> Küçük İşletmeler İçin Ücretsiz</div>}
        
        <h1 className="hero-title">
          Karmaşık Defterlere Son <br />
          <span className="highlight">Stok ve Veresiyeni Dijitalde Yönet</span>
        </h1>
        
        <p className="hero-description">
          StokPro sadece bir kayıt defteri değil, işletmenizin akıl hocasıdır. 
          Stoklarını saniyeler içinde gir, veresiyelerini takip et ve mağaza zekasıyla işini büyüt.
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
              <FiCheckCircle style={{ marginRight: 5 }} /> Kredi kartı gerekmez, kurulum yok.
            </p>
          )}
        </div>
      </section>

      {/* 2. TEMEL ÖZELLİKLER (ESKİ İSTEDİKLERİN) */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">İhtiyacın Olan <span className="blue-text">Temel Çözümler</span></h2>
          <p className="section-subtitle">İşletmeni yönetmek için gereken her şey elinin altında.</p>
        </div>
        
        <div className="features-grid three-col">
          {/* Eski Özellik 1 */}
          <div className="feature-card">
            <div className="icon-box blue">
              <FiBox />
            </div>
            <h3>Hızlı Stok Girişi</h3>
            <p>Ürünlerini barkodla veya elle saniyeler içinde ekle. Karmaşık menülerle uğraşma.</p>
          </div>

          {/* Eski Özellik 2 */}
          <div className="feature-card">
            <div className="icon-box green">
              <FiUsers />
            </div>
            <h3>Veresiye Takibi</h3>
            <p>Kimin ne kadar borcu var asla unutma. Müşteri bazlı detaylı döküm al.</p>
          </div>

          {/* Eski Özellik 3 */}
          <div className="feature-card">
            <div className="icon-box purple">
              <FiPieChart />
            </div>
            <h3>Anlık Raporlar</h3>
            <p>Ay sonunu bekleme. Kazancını, stoğunu ve alacaklarını tek tıkla gör.</p>
          </div>
        </div>
      </section>

      {/* 3. MAĞAZA ZEKASI (YENİ İSTEDİKLERİN) */}
      <section className="features-section alt-bg">
        <div className="section-header">
          <h2 className="section-title">Sadece Stok Değil, <span className="highlight">Mağaza Zekası!</span></h2>
          <p className="section-subtitle">Verilerinizi işleyerek size para kazandıran içgörüler sunuyoruz.</p>
        </div>
        
        <div className="features-grid four-col">
          
          {/* Yeni Özellik 1 */}
          <div className="feature-card small-card">
            <div className="icon-box-sm blue">
              <FiSearch />
            </div>
            <h4>Işık Hızında Arama</h4>
            <p>Müşterini bekletme, aradığını anında bul.</p>
          </div>

          {/* Yeni Özellik 2 */}
          <div className="feature-card small-card">
            <div className="icon-box-sm red">
              <FiAlertTriangle />
            </div>
            <h4>Kritik Stok Radarı</h4>
            <p>Biten ürünleri önceden haber al, satışı kaçırma.</p>
          </div>

          {/* Yeni Özellik 3 */}
          <div className="feature-card small-card">
            <div className="icon-box-sm orange">
              <FiTrendingDown />
            </div>
            <h4>Ölü Stok Analizi</h4>
            <p>Satılmayan ürünleri tespit et, nakite çevir.</p>
          </div>

          {/* Yeni Özellik 4 */}
          <div className="feature-card small-card">
            <div className="icon-box-sm purple">
              <FiAward />
            </div>
            <h4>Şampiyon Ürünler</h4>
            <p>En çok kazandıran ürünlerini keşfet.</p>
          </div>

        </div>
      </section>

      {/* 4. FOOTER */}
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


