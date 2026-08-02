"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  FiArrowRight, FiCheckCircle, FiDownload, 
  FiShield, FiZap, FiUsers, FiLock, FiTrendingUp,
  FiServer, FiLock as FiDataLock, FiCheck, FiX, FiLayers
} from "react-icons/fi";

const appId = (typeof window !== 'undefined' && window.__app_id) 
  ? window.__app_id 
  : (process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION || 'stokpro-freedom-movement');

// Profesyonel Saygınlık & Toplumsal Kanıt Sayacı (Sahte Konsensüs)
const TrustStats = () => {
  const [count, setCount] = useState(310);
  const targetCount = 384; // Ölçekli ve güven veren hedef sayı

  useEffect(() => {
    let start = 310;
    const duration = 1800; 
    const increment = Math.max(1, (targetCount - start) / (duration / 16)); 

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
  }, []);

  return (
    <div className="flex flex-col items-center justify-center my-3 p-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden w-full max-w-3xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Sektörel Geçiş Bilgilendirmesi */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-4">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Sektörel Dönüşüm: Son 30 Günde +28 İşletme Geçiş Yaptı
      </div>

      <div className="flex items-center justify-center gap-8 flex-wrap">
        <div className="flex items-end gap-1.5 h-10">
          <div className="w-2 bg-blue-600/60 rounded-t h-[40%]"></div>
          <div className="w-2 bg-blue-600/80 rounded-t h-[65%]"></div>
          <div className="w-2 bg-blue-600 rounded-t h-[80%]"></div>
          <div className="w-2 bg-emerald-500 rounded-t h-[95%]"></div>
          <div className="w-2 bg-emerald-400 rounded-t h-[100%]"></div>
        </div>

        <div className="flex flex-col text-center sm:text-left">
          <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none flex items-center justify-center sm:justify-start gap-1">
            <span>{count.toLocaleString('tr-TR')}</span>
            <span className="text-emerald-400 text-3xl font-bold">+</span>
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1.5 flex items-center justify-center sm:justify-start gap-2">
            <FiUsers className="text-emerald-400 shrink-0" size={16} />
            <span>Aktif Ticari İşletme StokPro Standartlarında Yönetiliyor</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 font-normal mt-4 text-center max-w-xl leading-relaxed">
        Pazardaki birçok kurum, verimliliği artıran ve fahiş lisans giderlerini ortadan kaldıran StokPro ekosistemine dâhil oldu. <strong className="text-slate-200 font-semibold">Siz de işletmenizi bu yeni nesil standarta taşıyın.</strong>
      </p>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    try {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));

      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        unsubscribe();
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } catch (err) {
      console.warn("Auth initialization error:", err);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">

      {/* ÜST BİLGİLENDİRME BARI */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 py-2.5 px-4 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2">
        <FiZap className="text-blue-400 shrink-0" size={14} />
        <span>Geleneksel Yazılım Maliyetlerine Son Verin — 350+'den Fazla Kurumsal Esnafın Tercihi</span>
      </div>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 flex flex-col gap-20">

        {/* HERO BÖLÜMÜ - DIŞ DÜŞMAN VE SAHTE KONSENSÜS BİRLEŞİMİ */}
        <section className="text-center flex flex-col items-center gap-6 max-w-4xl mx-auto pt-2">

          {/* SİSTEM ROZETİ */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-blue-900/50 text-blue-400 text-xs font-semibold tracking-wide shadow-sm">
            <FiShield size={14} /> 
            <span>STOKPRO® BAĞIMSIZ TİCARİ YAZILIM STANDARDI</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Geleneksel Yazılım Dayatmalarına Büyüyün: <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Tam Veri Mülkiyeti ve Bağımsız Kurumsal Yönetim
            </span>
          </h1>

          {/* YUMUŞATILMIŞ / RESMİ "DIŞ DÜŞMAN" KARŞILAŞTIRMA KUTUSU */}
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-left flex flex-col gap-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiServer className="text-blue-400 shrink-0" size={20} /> 
                Neden Geleneksel Hantal Yazılımları Terk Etmelisiniz?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Pazardaki birçok eski nesil yazılım sağlayıcısı, verilerinize erişimi kısıtlar, her yıl fahiş yenileme ücretleri talep eder ve sizi kendi bağımlı ekosistemlerine mahkûm eder. <strong className="text-white font-semibold">StokPro ise işletmenizin verilerini tamamen sizin kontrolünüze verir</strong>; gizli maliyet çıkarmaz, tam veri mahremiyeti ve bağımsız bir altyapı sunar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-red-950/30">
                <FiX className="text-red-400 shrink-0 mt-0.5" size={18} />
                <span className="text-xs text-slate-300 leading-normal">
                  <strong className="text-red-400 block font-semibold mb-0.5">Geleneksel Sağlayıcılar:</strong>
                  Yıllık zorunlu lisans zamları, kapalı veri havuzu, yüksek maliyetli modüller.
                </span>
              </div>
              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-emerald-950/30">
                <FiCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <span className="text-xs text-slate-300 leading-normal">
                  <strong className="text-emerald-400 block font-semibold mb-0.5">StokPro Standartları:</strong>
                  Açık ve şeffaf altyapı, %100 veri mülkiyeti, hızlı barkod & cari yönetim.
                </span>
              </div>
            </div>
          </div>

          {/* KONSENSÜS BİLEŞENİ */}
          <TrustStats />

          {/* ÇAĞRI BUTONLARI */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => router.push(user ? "/dashboard" : "/register")} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <span>{user ? "Yönetim Paneline Geç" : "İşletmenizi Sisteme Dâhil Edin"}</span> 
              <FiArrowRight size={18} />
            </button>

            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FiDownload size={16} /> Uygulamayı İndir
              </button>
            )}
          </div>

          {!user && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium pt-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <FiCheckCircle className="text-emerald-400" size={15} /> 350+ Seçkin İşletme Ağı
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <FiLock className="text-blue-400" size={15} /> Taahhütsüz ve Şeffaf Yapı
              </span>
            </div>
          )}
        </section>

        {/* KARŞILAŞTIRMA BÖLÜMÜ - RESMİ KARAR MATRİSİ */}
        <section className="flex flex-col gap-8 bg-slate-900/40 p-6 sm:p-10 rounded-2xl border border-slate-800/80">
          <div className="text-center flex flex-col gap-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sektörel Standart Karşılaştırması
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-normal">
              Eski nesil iş yapış biçimleri yerini daha esnek, güvenli ve bağımsız çözümlere bırakıyor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ESKİ NESİL (Geleneksel Bağımlılık) */}
            <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-xl flex flex-col gap-4">
              <div className="text-[11px] font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded w-max tracking-wide uppercase">
                Geleneksel Yazılım Sağlayıcıları
              </div>
              <h3 className="text-base font-bold text-slate-200">Karşılaşılan Sınırlamalar</h3>
              <ul className="flex flex-col gap-3 text-xs text-slate-400 font-normal">
                <li className="flex items-center gap-2.5">
                  <FiX className="text-red-400 shrink-0" size={16} /> Veriler şirket sunucularında tutulur, dışa aktarım zordur.
                </li>
                <li className="flex items-center gap-2.5">
                  <FiX className="text-red-400 shrink-0" size={16} /> Her yıl tek taraflı belirlenen yüksek lisans bedelleri.
                </li>
                <li className="flex items-center gap-2.5">
                  <FiX className="text-red-400 shrink-0" size={16} /> Mobil erişim ve ek kullanıcılar için ekstra ücretlendirmeler.
                </li>
              </ul>
            </div>

            {/* YENİ NESİL (StokPro Standardı) */}
            <div className="bg-slate-900/90 border border-blue-500/30 p-6 rounded-xl flex flex-col gap-4 shadow-lg relative">
              <div className="text-[11px] font-bold bg-blue-950 text-blue-300 px-3 py-1 rounded w-max border border-blue-800/50 tracking-wide uppercase">
                StokPro Standartları (350+ Kurum)
              </div>
              <h3 className="text-base font-bold text-white">Bağımsızlık & Verimlilik Avantajları</h3>
              <ul className="flex flex-col gap-3 text-xs text-slate-200 font-medium">
                <li className="flex items-center gap-2.5 text-emerald-300">
                  <FiCheck className="text-emerald-400 shrink-0" size={16} /> %100 Veri Mahremiyeti: İstediğiniz an yedekleme ve döküm.
                </li>
                <li className="flex items-center gap-2.5 text-emerald-300">
                  <FiCheck className="text-emerald-400 shrink-0" size={16} /> Sürpriz Maliyetsiz: Şeffaf ve sürdürülebilir fiyatlandırma.
                </li>
                <li className="flex items-center gap-2.5 text-emerald-300">
                  <FiCheck className="text-emerald-400 shrink-0" size={16} /> Anlık Mobil & Masaüstü Senkronizasyon: Sınır tanımayan erişim.
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* MÜŞTERİ REFERANSLARI / KONSENSÜS */}
        <section className="flex flex-col gap-6">
          <div className="text-center flex flex-col gap-1.5">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">KULLANICI DENEYİMLERİ</span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Sektör Temsilcileri Ne Diyor?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                "Önceki yazılım firmasının her yıl çıkardığı fahiş fiyat artışlarından yorulmuştuk. StokPro'ya geçtikten sonra hem veri kontrolümüzü geri aldık hem de altyapı maliyetlerimizi %60 düşürdük."
              </p>
              <div className="text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800/60">
                — M. Kaya, Hırdavat Ticaret A.Ş.
              </div>
            </div>

            <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                "Çevremizdeki birçok perakendecinin StokPro'ya geçtiğini görünce biz de sistemi inceledik. Karmaşık eğitim süreçlerine gerek kalmadan aynı gün entegre olduk."
              </p>
              <div className="text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800/60">
                — A. Tekin, Perakende Mağazacılık
              </div>
            </div>

            <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                "Barkod okuma hızı ve veresiye cari takibi tam esnafın ihtiyacına göre tasarlanmış. Eski ağır programların bürokrasisinden kurtulmak büyük rahatlık."
              </p>
              <div className="text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800/60">
                — S. Yılmaz, Yapı Malzemeleri
              </div>
            </div>
          </div>
        </section>

        {/* SON ÇAĞRI BÖLÜMÜ */}
        <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 rounded-2xl p-8 text-center flex flex-col items-center gap-5 shadow-2xl">
          <div className="flex flex-col gap-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              İşletmenizi Yeni Nesil Dijital Standartlara Taşıyın
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal">
              350’den fazla kurumsal işletme eski hantal yöntemleri bıraktı. Siz de hemen bugün ücretsiz hesabınızı oluşturun.
            </p>
          </div>

          <button 
            onClick={() => router.push(user ? "/dashboard" : "/register")} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl text-sm shadow-xl transition-all flex items-center gap-2.5 cursor-pointer"
          >
            <span>StokPro Ekosistemine Katılın</span>
            <FiArrowRight size={18} />
          </button>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 py-6 px-5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 text-white font-bold rounded flex items-center justify-center text-[10px]">S</div>
            <strong className="text-white font-semibold text-sm">StokPro®</strong>
            <span>— Bağımsız Stok & Ön Muhasebe Yazılımı</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">
              Gizlilik Politikası (Privacy Policy)
            </Link>
            <Link href="/terms-of-service" className="hover:text-blue-400 transition-colors">
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

