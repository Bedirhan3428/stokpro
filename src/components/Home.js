import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FiPieChart,
  FiDownload,
  FiShare
} from "react-icons/fi";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));

    // 1. Cihaz ve Mod Kontrolü
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isInStandaloneMode);

    // 2. Yükleme Sinyalini Yakala (Chrome/Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Otomatik banner'ı durdur
      setDeferredPrompt(e); // Olayı sakla
      console.log("Yükleme sinyali yakalandı!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Yükleme Butonu Tıklanınca
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Sinyal varsa direkt çalıştır
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Sinyal yoksa (Manuel Yükleme Rehberi)
      if (isIOS) {
        alert("iOS cihazlarda yüklemek için: Paylaş butonuna basıp 'Ana Ekrana Ekle' seçeneğini kullanın.");
      } else {
        alert("Otomatik yükleme başlatılamadı.\n\nLütfen tarayıcınızın sağ üst köşesindeki menüye (üç nokta) tıklayıp 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğini seçin.");
      }
    }
  };

  return (
    <div className="home-container">
      
      {/* HERO BÖLÜMÜ */}
      <section className="hero-section">
        {!user && <div className="badge">✨ Küçük İşletmeler İçin Ücretsiz</div>}
        
        <h1 className="hero-title">
          Karmaşık Defterlere Son. <br />
          <span className="highlight">Stok ve Veresiyeni Dijitalde Yönet.</span>
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

          {/* --- UYGULAMA YÜKLEME BUTONU (Yüklü değilse her zaman göster) --- */}
          {!isStandalone && (
            <>
              <button className="install-btn" onClick={handleInstallClick}>
                <FiDownload /> Uygulamayı İndir
              </button>
              
              {/* iOS için küçük ipucu (Opsiyonel) */}
              {isIOS && (
                <div className="ios-hint">
                  <small><FiShare /> ile Ana Ekrana Ekle</small>
                </div>
              )}
            </>
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
        <div className="simple-copyright">
          © {new Date().getFullYear()} StokPro. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}


