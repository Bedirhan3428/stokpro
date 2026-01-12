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
  FiPieChart,
  FiDownload, 
  FiX
} from "react-icons/fi";
import Info from "./info";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const auth = getAuth();

  // --- PWA Yükleme State'leri ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallVisible, setIsInstallVisible] = useState(false);

  useEffect(() => {
    // Auth Dinleyicisi
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // --- PWA Event Listener ---
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Varsayılan tarayıcı barını engelle
      setDeferredPrompt(e);
      setIsInstallVisible(true); // Şartlar sağlanınca butonu göster
      console.log("PWA yükleme fırsatı yakalandı!");
    };

    const handleAppInstalled = () => {
      setIsInstallVisible(false);
      setDeferredPrompt(null);
      console.log('PWA başarıyla yüklendi!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 👇 TEST İÇİN GEÇİCİ KOD (Tasarımı görmen için)
    // Gerçek yayına alırken bu setTimeout bloğunu silebilirsin.
    const testTimer = setTimeout(() => {
      if (!isInstallVisible) {
        console.log("Test modu: Buton zorla gösteriliyor.");
        setIsInstallVisible(true);
      }
    }, 2000);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(testTimer);
    };
  }, [auth, isInstallVisible]);

  // --- PWA Yükleme Fonksiyonu ---
  const handleInstallClick = async () => {
    // Eğer tarayıcı desteği yoksa (Test modundaysak) sadece uyarı verelim
    if (!deferredPrompt) {
      alert("Bu bir test görünümüdür. Gerçek yükleme için tarayıcının PWA şartlarını sağlaması gerekir (HTTPS + Manifest + ServiceWorker).");
      setIsInstallVisible(false);
      return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallVisible(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="home-container relative">
      
      {/* --- PWA YÜKLEME BUTONU (Floating) --- */}
      {/* Not: 'animate-fade-in-up' Tailwind config'inde yoksa çalışmaz. 
         Garanti olması için standart 'transition' ve 'duration' sınıflarını ekledim.
      */}
      {isInstallVisible && (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] md:bottom-6 md:right-6 md:left-auto md:w-auto transition-all duration-500 ease-in-out transform translate-y-0 opacity-100">
          <div className="relative group">
            {/* Glow Efekti - Yeşil tonlarda parlama */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-green-100 dark:border-slate-700">
              
              {/* Sol Taraf: İkon ve Metin */}
              <div className="flex items-center gap-4 cursor-pointer select-none" onClick={handleInstallClick}>
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30 dark:text-green-400 shrink-0 shadow-sm">
                  {/* animate-bounce ile sürekli hafif zıplama efekti */}
                  <FiDownload size={24} className="animate-bounce" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                    Uygulamayı Yükle
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hızlı erişim için ana ekrana ekle.
                  </p>
                </div>
              </div>

              {/* Kapat Butonu */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInstallVisible(false);
                }}
                className="ml-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO BÖLÜMÜ */}
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

      {/* 2. TEMEL ÖZELLİKLER */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">İhtiyacın Olan <span className="blue-text">Temel Çözümler</span></h2>
          <p className="section-subtitle">İşletmeni yönetmek için gereken her şey elinin altında.</p>
        </div>

        <div className="features-grid three-col">
          <div className="feature-card">
            <div className="icon-box blue">
              <FiBox />
            </div>
            <h3>Hızlı Stok Girişi</h3>
            <p>Ürünlerini barkodla veya elle saniyeler içinde ekle. Karmaşık menülerle uğraşma.</p>
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
        </div>
      </section>

      {/* 3. MAĞAZA ZEKASI */}
      <section className="features-section alt-bg">
        <div className="section-header">
          <h2 className="section-title">Sadece Stok Değil, <span className="highlight">Mağaza Zekası!</span></h2>
          <p className="section-subtitle">Verilerinizi işleyerek size para kazandıran içgörüler sunuyoruz.</p>
        </div>

        <div className="features-grid four-col">
          <div className="feature-card small-card">
            <div className="icon-box-sm blue">
              <FiSearch />
            </div>
            <h4>Işık Hızında Arama</h4>
            <p>Müşterini bekletme, aradığını anında bul.</p>
          </div>

          <div className="feature-card small-card">
            <div className="icon-box-sm red">
              <FiAlertTriangle />
            </div>
            <h4>Kritik Stok Radarı</h4>
            <p>Biten ürünleri önceden haber al, satışı kaçırma.</p>
          </div>

          <div className="feature-card small-card">
            <div className="icon-box-sm orange">
              <FiTrendingDown />
            </div>
            <h4>Ölü Stok Analizi</h4>
            <p>Satılmayan ürünleri tespit et, nakite çevir.</p>
          </div>

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