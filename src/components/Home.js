import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore"; 
import { 
  FiArrowRight, FiSearch, FiAlertTriangle, FiTrendingDown, 
  FiAward, FiCheckCircle, FiBox, FiUsers, FiPieChart, FiDownload, FiShare
} from "react-icons/fi";
import "../styles/Home.css";

// Firebase App ID (Global değişken veya varsayılan)
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

// --- Animasyonlu Sayaç ve Grafik Bileşeni ---
const TrustStats = () => {
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);

  useEffect(() => {
    const countUsers = async () => {
      try {
        const db = getFirestore();
        // Doğrudan artifacts/{appId}/users koleksiyonunu sayıyoruz
        const usersRef = collection(db, "artifacts", appId, "users");
        const snapshot = await getDocs(usersRef);
        
        // Koleksiyondaki döküman sayısı (Gerçek Kullanıcı/Esnaf Sayısı)
        const realCount = snapshot.size;

        // Eğer 0 ise (ilk kurulum), en azından 1 gösterelim (kendimiz).
        setTargetCount(realCount > 0 ? realCount : 1);
        
      } catch (error) {
        console.error("Kullanıcı sayısı çekilemedi:", error);
        // Hata durumunda varsayılan bir sayı
        setTargetCount(1); 
      }
    };

    countUsers();
  }, []);

  // Sayaç Animasyonu
  useEffect(() => {
    if (targetCount === 0) return;

    let start = 0;
    const duration = 2000; // 2 saniye sürsün
    // Eğer sayı çok küçükse (örn: 5), increment 1'den küçük olabilir, bu yüzden Math.max(1, ...) diyoruz
    const increment = Math.max(1, targetCount / (duration / 16)); 
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= targetCount) {
        setCount(targetCount);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [targetCount]);

  return (
    <div className="trust-stats-wrapper">
      {/* SOL: Siyah Grafik */}
      <div className="animated-chart">
        <div className="bar bar-1"></div>
        <div className="bar bar-2"></div>
        <div className="bar bar-3"></div>
        <div className="bar bar-4"></div>
        <div className="bar bar-5"></div>
      </div>
      
      {/* SAĞ: İstatistik Metni */}
      <div className="stat-text-box">
        <div className="stat-number">
          {count.toLocaleString('tr-TR')}
        </div>
        <div className="stat-label">Esnaf Bize Güveniyor</div>
      </div>

      <style>{`
        .trust-stats-wrapper {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          justify-content: center;
          gap: 20px;
          margin-bottom: 3rem;
          margin-top: 1rem;
          animation: fadeIn 1s ease-out;
        }

        .animated-chart {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 80px;
          padding-bottom: 8px;
        }

        .bar {
          width: 16px;
          background: #000;
          border-radius: 4px 4px 0 0;
          animation: growUp 1.5s ease-out forwards;
          box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
        }
        .bar-1 { height: 0; animation-delay: 0.1s; --target-h: 30%; }
        .bar-2 { height: 0; animation-delay: 0.2s; --target-h: 60%; }
        .bar-3 { height: 0; animation-delay: 0.3s; --target-h: 40%; }
        .bar-4 { height: 0; animation-delay: 0.4s; --target-h: 80%; }
        .bar-5 { height: 0; animation-delay: 0.5s; --target-h: 100%; }

        @keyframes growUp {
          from { height: 0; }
          to { height: var(--target-h); }
        }

        .stat-text-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
        }

        .stat-number {
          font-size: 4.5rem;
          font-weight: 900;
          color: #000;
          line-height: 0.9;
          letter-spacing: -2px;
        }

        .stat-label {
          font-size: 1.1rem;
          color: #555;
          font-weight: 600;
          margin-left: 4px;
          margin-top: 5px;
        }

        @media (max-width: 600px) {
          .trust-stats-wrapper {
            flex-direction: row;
            gap: 15px;
          }
          .stat-number {
            font-size: 3rem;
          }
          .bar { width: 10px; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

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

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isInStandaloneMode);

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
        
        {/* Siyah Grafik ve Sayaç (Live Data) */}
        <TrustStats />

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

