"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore"; 
import { 
  FiArrowRight, FiSearch, FiAlertTriangle, FiTrendingDown, 
  FiAward, FiCheckCircle, FiBox, FiUsers, FiPieChart, FiDownload, FiShare,
  FiShield, FiFileText, FiDollarSign, FiZap, FiLock, FiInfo
} from "react-icons/fi";

const appId = (typeof window !== 'undefined' && window.__app_id) 
  ? window.__app_id 
  : (process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION || process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || '1:330292329201:web:d19827937fb863ea490750');

const TrustStats = () => {
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      const cachedCount = localStorage.getItem('cached_user_count');
      if (cachedCount) {
        setTargetCount(Number(cachedCount));
      } else {
        setTargetCount(100);
      }

      try {
        const db = getFirestore();
        const usersRef = collection(db, "artifacts", appId, "users");
        const snapshot = await getDocs(usersRef);
        const realCount = snapshot.size;

        if (realCount > 0) {
          setTargetCount(realCount);
          localStorage.setItem('cached_user_count', realCount.toString());
        }
      } catch (error) {
        console.warn("Sayaç yüklenirken hata oluştu:", error);
      }
    };

    fetchUserCount();
  }, []);

  useEffect(() => {
    if (targetCount === 0) return;

    let start = 0;
    const duration = 1500; 
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
    <div className="flex items-center justify-center gap-6 my-6 flex-wrap">
      <div className="flex items-end gap-1.5 h-16">
        <div className="w-3.5 bg-blue-600 rounded-t h-[40%] animate-pulse"></div>
        <div className="w-3.5 bg-blue-600 rounded-t h-[70%] animate-pulse delay-75"></div>
        <div className="w-3.5 bg-blue-600 rounded-t h-[55%] animate-pulse delay-150"></div>
        <div className="w-3.5 bg-blue-600 rounded-t h-[90%] animate-pulse delay-200"></div>
        <div className="w-3.5 bg-blue-600 rounded-t h-[100%] animate-pulse delay-300"></div>
      </div>
      
      <div className="flex flex-col text-left">
        <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          {count.toLocaleString('tr-TR')}+
        </div>
        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
          Aktif Esnaf & İşletme StokPro Kullanıyor
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);

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
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto px-5 py-8 flex flex-col gap-14">
        
        {/* HERO SECTION WITH EXPLICIT STOKPRO APP NAME & GOOGLE OAUTH PURPOSE BANNER */}
        <section className="text-center flex flex-col items-center gap-6 max-w-4xl mx-auto pt-2">
          
          {/* GOOGLE OAUTH VERIFICATION EXPLICIT APP NAME BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-black tracking-wider uppercase">
            <FiZap className="text-blue-600" /> UYGULAMA ADI: STOKPRO® BARKODLU STOK VE ÖN MUHASEBE OTOMASYONU
          </div>

          <h1 className="text-3xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            <span className="text-blue-600 dark:text-blue-500">StokPro</span> ile İşletmenizi Dijitalleştirin
            <br />
            <span className="text-slate-800 dark:text-slate-200 text-2xl sm:text-4xl font-extrabold">Bulut Tabanlı Stok, Cari ve Kasa Yönetimi</span>
          </h1>

          {/* GOOGLE OAUTH COMPLIANCE: EXPLICIT APPLICATION PURPOSE & SCOPE SECTION */}
          <div className="w-full bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-md text-left flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                S
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  StokPro Uygulamasının Amacı ve Tanımı (Application Purpose)
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                  Google OAuth Onay Ekranı Doğrulama Belgesi — StokPro®
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              <strong>StokPro</strong>, küçük ve orta ölçekli ticari işletmeler (esnaf, hırdavat mağazaları, perakende satış noktaları ve toptancılar) için tasarlanmış <strong>bulut tabanlı barkodlu stok takip, müşteri cari borç/alacak yönetimi ve ön muhasebe yazılımıdır</strong>. 
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <FiCheckCircle className="text-blue-600 text-lg shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-slate-900 dark:text-white block font-bold">Neden Giriş Yapılır?</strong>
                  Kullanıcılar Google hesapları ile giriş yaparak işletmelerine ait ürün stok miktarlarını günceller, veresiye müşteri borçlarını takip eder ve satış faturası keserler.
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <FiShield className="text-emerald-600 text-lg shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-slate-900 dark:text-white block font-bold">Veri Gizliliği ve Güvenlik</strong>
                  StokPro sadece kullanıcının kendi işletmesine ait ticari verileri güvenli Firebase sunucularında saklar. Hiçbir üçüncü tarafla paylaşılmaz.
                </div>
              </div>
            </div>
          </div>

          <TrustStats />

          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => router.push(user ? "/dashboard" : "/register")} 
              className="modern-btn primary"
              style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 900 }}
            >
              {user ? "StokPro Yönetim Paneline Geç" : "StokPro'yu Ücretsiz Deneyin"} <FiArrowRight size={18} />
            </button>

            {!user && (
              <button 
                onClick={() => router.push("/login")} 
                className="modern-btn secondary"
                style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 800 }}
              >
                Giriş Yap
              </button>
            )}

            {!isStandalone && deferredPrompt && (
              <button onClick={handleInstallClick} className="modern-btn ghost" style={{ padding: '14px 20px' }}>
                <FiDownload size={18} /> Masaüstü / Mobil Uygulamayı İndir
              </button>
            )}
          </div>

          {!user && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <FiCheckCircle className="text-emerald-500" /> Kurulum veya Kredi Kartı Gerekmez — Giriş yapmadan tüm bilgileri inceleyebilirsiniz.
            </p>
          )}
        </section>

        {/* DETAILED FEATURE MODULES SECTION */}
        <section className="flex flex-col gap-8">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              StokPro Tarafından Sunulan <span className="text-blue-600">Temel Modüller</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              İşletmenizi dijitalleştirmek için gereken tüm modüller StokPro bünyesindedir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="card hover:border-blue-500 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black mb-2">
                <FiBox />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Barkodlu Stok & Depo Takibi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Ürünlerinizi barkod okuyucu veya seri no ile kaydedin. Kritik stok seviyesine düşen ürünleri anında takip edin.
              </p>
            </div>

            <div className="card hover:border-emerald-500 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-black mb-2">
                <FiUsers />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Müşteri Cari & Veresiye Takibi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Müşterilerinize veresiye satış yapın, borç ve ödeme geçmişlerini tarihsel olarak döküm alın.
              </p>
            </div>

            <div className="card hover:border-purple-500 transition-all">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-black mb-2">
                <FiPieChart />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Ön Muhasebe & PDF Fatura</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Kasa gelir-gider hesaplarınızı tutun. Tamamlanan her satış için resmi PDF faturası veya fiş çıktısı alın.
              </p>
            </div>

          </div>
        </section>

        {/* ARTIFICIAL INTELLIGENCE STORE INSIGHTS */}
        <section className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col gap-6 shadow-xl border border-slate-800">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">AKILLI MAĞAZA ANALİZİ</span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              StokPro Yapay Zeka Mağaza Zekası
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              StokPro, verilerinizi işleyerek satılmayan ölü stokları ve en çok kazandıran şampiyon ürünleri otomatik tespit eder.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-1">
              <FiSearch className="text-blue-400 text-xl" />
              <strong className="text-sm text-white">Hızlı Arama</strong>
              <span className="text-xs text-slate-400">Ürün ve müşterileri anında bulun.</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-1">
              <FiAlertTriangle className="text-amber-400 text-xl" />
              <strong className="text-sm text-white">Kritik Stok Uyarısı</strong>
              <span className="text-xs text-slate-400">Tükenmek üzere olan ürün uyarısı.</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-1">
              <FiTrendingDown className="text-red-400 text-xl" />
              <strong className="text-sm text-white">Ölü Stok Tespiti</strong>
              <span className="text-xs text-slate-400">Satılmayan ürünlerde indirim önerisi.</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-1">
              <FiAward className="text-purple-400 text-xl" />
              <strong className="text-sm text-white">En Çok Kazandıranlar</strong>
              <span className="text-xs text-slate-400">Kar marjı en yüksek ürün listesi.</span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER WITH EXPLICIT GOOGLE OAUTH COMPLIANCE LINKS */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 text-white font-black rounded flex items-center justify-center text-xs">S</div>
            <strong className="text-slate-900 dark:text-white font-black text-sm">StokPro®</strong>
            <span>— Ticari Stok & Ön Muhasebe Otomasyonu</span>
          </div>

          <div className="flex items-center gap-6 font-bold">
            <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">
              Gizlilik Politikası (Privacy Policy)
            </Link>
            <Link href="/terms-of-service" className="hover:text-blue-600 transition-colors">
              Hizmet Şartları (Terms of Service)
            </Link>
          </div>

          <div>
            © {new Date().getFullYear()} StokPro. Tüm hakları saklıdır.
          </div>

        </div>
      </footer>

    </div>
  );
}
