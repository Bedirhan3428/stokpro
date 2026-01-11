import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  FiArrowRight, 
  FiSearch, 
  FiAlertTriangle, 
  FiTrendingDown, 
  FiAward, 
  FiCheckCircle 
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
      
      {/* 1. HERO BÖLÜMÜ (Giriş) */}
      <section className="hero-section">
        {!user && <div className="badge">✨ Küçük İşletmeler İçin Ücretsiz</div>}
        
        <h1 className="hero-title">
          Karmaşık Defterlere Son. <br />
          <span className="highlight">Mağaza Zekası ile Tanışın.</span>
        </h1>
        
        <p className="hero-description">
          StokPro sadece bir defter değil, işletmenizin akıl hocasıdır. 
          Stoklarını, veresiyelerini ve karlılığını tek ekrandan yönet.
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

      {/* 2. ÖZELLİKLER (Zeka Vurgusu) */}
      <section className="features-section">
        <h2 className="section-title">Stok Pro: Sadece Stok Değil, <span className="blue-text">Mağaza Zekası!</span></h2>
        
        <div className="features-grid">
          
          {/* Özellik 1 */}
          <div className="feature-card">
            <div className="icon-box blue">
              <FiSearch />
            </div>
            <h3>Işık Hızında Arama</h3>
            <p>Ürünlerini saniyeler içinde bul, müşterini asla bekletme. Barkod veya isimle anında erişim.</p>
          </div>

          {/* Özellik 2 */}
          <div className="feature-card">
            <div className="icon-box red">
              <FiAlertTriangle />
            </div>
            <h3>Kritik Stok Radarı</h3>
            <p>Stoğu 7 günden az kalacak ürünleri önceden haber al. Satış kaçırma, müşterini geri çevirme.</p>
          </div>

          {/* Özellik 3 */}
          <div className="feature-card">
            <div className="icon-box orange">
              <FiTrendingDown />
            </div>
            <h3>Ölü Stok Analizi</h3>
            <p>30 gündür satılmayan ürünleri tespit et. Rafa bağladığın parayı kurtar ve nakite çevir.</p>
          </div>

          {/* Özellik 4 */}
          <div className="feature-card">
            <div className="icon-box purple">
              <FiAward />
            </div>
            <h3>Şampiyon Ürünler</h3>
            <p>En çok ne sattığını ve sana neyin kazandırdığını bil. Dükkanın rotasını verilerle çiz.</p>
          </div>

        </div>
      </section>

      {/* 3. FOOTER */}
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


