import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  FiArrowRight, FiSearch, FiAlertTriangle, FiTrendingDown, 
  FiAward, FiCheckCircle, FiBox, FiUsers, FiPieChart, FiDownload, FiShare
} from "react-icons/fi";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // PWA Durumları
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));

    // 1. Cihaz IOS mu?
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // 2. Uygulama Zaten Yüklü mü? (Standalone mod kontrolü)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isInStandaloneMode);

    // 3. Chrome/Android "Yükle" Sinyalini Yakala
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("✅ PWA Yükleme sinyali yakalandı.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [auth]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Kullanıcı tercihi: ${outcome}`);
    setDeferredPrompt(null);
  };

  return (
    <div className="home-container">
      {/* HERO BÖLÜMÜ */}
      <section className="hero-section">
        {!user && <div className="badge">Ömür Boyu Ücretsiz</div>}

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

          {!isStandalone && deferredPrompt && (
            <button className="install-btn" onClick={handleInstallClick}>
              <FiDownload /> Uygulamayı İndir
            </button>
          )}

          {!isStandalone && isIOS && (
            <div className="ios-hint">
              <small><FiShare /> butonuna basıp "Ana Ekrana Ekle" diyerek yükle.</small>
            </div>
          )}

          {!user && (
            <p className="sub-note">
              <FiCheckCircle style={{ marginRight: 5 }} /> Kredi kartı gerekmez, kurulum yok.
            </p>
          )}
        </div>
      </section>

      {/* TEMEL ÖZELLİKLER */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">İhtiyacın Olan <span className="blue-text">Temel Çözümler</span></h2>
          <p className="section-subtitle">İşletmeni yönetmek için gereken her şey elinin altında.</p>
        </div>

        <div className="features-grid three-col">
          <div className="feature-card">
            <div className="icon-box blue"><FiBox /></div>
            <h3>Hızlı Stok Girişi</h3>
            <p>Ürünlerini barkodla veya elle saniyeler içinde ekle. Karmaşık menülerle uğraşma.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box green"><FiUsers /></div>
            <h3>Veresiye Takibi</h3>
            <p>Kimin ne kadar borcu var asla unutma. Müşteri bazlı detaylı döküm al.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box purple"><FiPieChart /></div>
            <h3>Anlık Raporlar</h3>
            <p>Ay sonunu bekleme. Kazancını, stoğunu ve alacaklarını tek tıkla gör.</p>
          </div>
        </div>
      </section>

      {/* MAĞAZA ZEKASI */}
      <section className="features-section alt-bg">
        <div className="section-header">
          <h2 className="section-title">Sadece Stok Değil, <span className="highlight">Mağaza Zekası!</span></h2>
          <p className="section-subtitle">Verilerinizi işleyerek size para kazandıran içgörüler sunuyoruz.</p>
        </div>

        <div className="features-grid four-col">
          <div className="feature-card small-card">
            <div className="icon-box-sm blue"><FiSearch /></div>
            <h4>Işık Hızında Arama</h4>
            <p>Müşterini bekletme, aradığını anında bul.</p>
          </div>
          <div className="feature-card small-card">
            <div className="icon-box-sm red"><FiAlertTriangle /></div>
            <h4>Kritik Stok Radarı</h4>
            <p>Biten ürünleri önceden haber al, satışı kaçırma.</p>
          </div>
          <div className="feature-card small-card">
            <div className="icon-box-sm orange"><FiTrendingDown /></div>
            <h4>Ölü Stok Analizi</h4>
            <p>Satılmayan ürünleri tespit et, nakite çevir.</p>
          </div>
          <div className="feature-card small-card">
            <div className="icon-box-sm purple"><FiAward /></div>
            <h4>Şampiyon Ürünler</h4>
            <p>En çok kazandıran ürünlerini keşfet.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        {/* YASAL UYARI VE LİNKLER */}
        <div className="legal-section" style={{ marginBottom: "1rem", fontSize: "0.85rem", opacity: 0.8 }}>
          <p>
            Uygulamayı kullanmaya başlayarak{" "}
            <span 
              onClick={() => navigate("/privacy-policy")} 
              style={{ cursor: "pointer", textDecoration: "underline" }}
            >
              Gizlilik Politikası
            </span>
            {" ve "}
            <span 
              onClick={() => navigate("/terms-of-service")} 
              style={{ cursor: "pointer", textDecoration: "underline" }}
            >
              Hizmet Şartları
            </span>
            'nı kabul etmiş sayılırsınız.
          </p>
        </div>

        <div className="simple-copyright">
          © {new Date().getFullYear()} StokPro. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}

export default Home;
