"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  FiArrowRight, FiAlertTriangle, FiCheckCircle, FiDownload, 
  FiShield, FiZap, FiUsers, FiLock, FiTrendingUp, FiCrosshair,
  FiSlash, FiRadio
} from "react-icons/fi";

const appId = (typeof window !== 'undefined' && window.__app_id) 
  ? window.__app_id 
  : (process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION || 'stokpro-freedom-movement');

// Sahte Konsensüs & Toplumsal Kanıt Sayacı
const TrustStats = () => {
  const [count, setCount] = useState(310);
  const targetCount = 384; // Inandırıcı, ölçekli hedef sayı

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
    <div className="flex flex-col items-center justify-center my-4 p-6 bg-gradient-to-r from-red-950/40 via-slate-900 to-blue-950/40 rounded-2xl border border-red-500/20 shadow-2xl relative overflow-hidden w-full">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* Canlı Katılım Akışı Rozeti (FOMO) */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black tracking-wider uppercase mb-3 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        SON 24 SAATTE +14 ESNAF KARTEL YAZILIMLARI TERK ETTİ
      </div>

      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-end gap-1.5 h-12">
          <div className="w-2.5 bg-red-500 rounded-t h-[50%] animate-pulse"></div>
          <div className="w-2.5 bg-red-500 rounded-t h-[75%] animate-pulse delay-75"></div>
          <div className="w-2.5 bg-red-500 rounded-t h-[60%] animate-pulse delay-150"></div>
          <div className="w-2.5 bg-emerald-500 rounded-t h-[95%] animate-pulse delay-200"></div>
          <div className="w-2.5 bg-emerald-400 rounded-t h-[100%] animate-pulse delay-300"></div>
        </div>

        <div className="flex flex-col text-center sm:text-left">
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none flex items-center justify-center sm:justify-start gap-1.5">
            <span>{count.toLocaleString('tr-TR')}</span>
            <span className="text-emerald-400 text-2xl font-bold">+</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-300 mt-1 uppercase tracking-wide flex items-center justify-center sm:justify-start gap-2">
            <FiUsers className="text-emerald-400 shrink-0" size={18} />
            <span>Bağımsız Esnaf Konsensüsü — Treni Kaçırmayanlar Ağı</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 font-medium mt-3 text-center max-w-lg">
        Çevrendeki bilinçli esnaflar eski sömürücü yazılımları çöpe atıp StokPro saflarına geçiyor. 
        <strong className="text-slate-200"> Akım başladı, herkes bu sistemdeyken sen geride kalma.</strong>
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
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">

      {/* ÜST ACİL DURUM BARI */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white py-2 px-4 text-center text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg">
        <FiAlertTriangle className="animate-bounce" size={16} />
        <span>KARTEL YAZILIMLARIN SÖMÜRÜSÜNE SON VER! 350+ SEÇKİN ESNAFA KATIL!</span>
        <FiAlertTriangle className="animate-bounce" size={16} />
      </div>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 flex flex-col gap-16">

        {/* HERO SECTION - DIŞ DÜŞMAN VE SAHTE KONSENSÜS BİRLEŞİMİ */}
        <section className="text-center flex flex-col items-center gap-6 max-w-4xl mx-auto pt-4">

          {/* MOBİLİZASYON ROZETİ */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-black tracking-wide shadow-inner">
            <FiRadio className="text-red-500 animate-pulse" size={16} /> 
            <span>STOKPRO® ÖZGÜRLÜK VE ESNAF DİRENİŞ HAREKETİ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Dev Teknoloji Şirketleri Verilerinizi Satıyor! <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Biz Bu Sömürüye Karşı Savaş Açtık.
            </span>
          </h1>

          {/* MANİPÜLATİF HİKAYE KUTUSU: DIŞ DÜŞMAN */}
          <div className="w-full bg-slate-900/90 border-2 border-red-900/50 rounded-2xl p-6 shadow-2xl text-left flex flex-col gap-4 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-[10px] px-3 py-1 rounded-bl-lg tracking-widest uppercase">
              Uyanış Bildirgesi
            </div>
            
            <h3 className="text-lg font-black text-white flex items-center gap-2.5">
              <FiCrosshair className="text-red-500 shrink-0" size={20} /> 
              Dış Düşmanı Tanı: Küresel Yazılım Kartelleri Sizi Soyuyor!
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Yıllardır dev teknoloji şirketleri ve yüksek lisans ücreti kesen yazılım kartelleri esnafın sırtından milyarlar kazandı. <strong className="text-white underline decoration-red-500">Müşteri verilerinizi üçüncü taraflara satıyorlar</strong>, sizi fahiş yıllık aboneliklere kilitliyorlar ve verinizi hapsediyorlar. 
              <strong> StokPro sadece bir stok programı değildir;</strong> bu küresel emici çarklara boyun eğmeyen bağımsız esnafın <strong>özgürlük ve dayanışma kalesidir!</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/40 p-3 rounded-lg">
                <FiSlash className="text-red-400 shrink-0 mt-0.5" size={16} />
                <span className="text-xs text-slate-300">
                  <strong className="text-red-400 block font-bold">Onlar Ne Yapıyor?</strong>
                  Verilerinizi satıyor, fahiş fiyat dayatıyor, sistemi kısıtlıyor.
                </span>
              </div>
              <div className="flex items-start gap-2 bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-lg">
                <FiShield className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                <span className="text-xs text-slate-300">
                  <strong className="text-emerald-400 block font-bold">StokPro Direnişi:</strong>
                  Şifrelenmiş bağımsız altyapı, tam veri gizliliği, esnafa özgürlük.
                </span>
              </div>
            </div>
          </div>

          {/* SAHTE KONSENSÜS SAYACI */}
          <TrustStats />

          {/* HAREKETE GEÇİRİCİ BUTONLAR */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => router.push(user ? "/dashboard" : "/register")} 
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-8 py-4 rounded-xl font-black text-base shadow-xl shadow-red-950/50 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>{user ? "Yönetim Paneline Geç" : "Treni Kaçırma — Savaşımıza Katıl"}</span> 
              <FiArrowRight size={20} />
            </button>

            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FiDownload size={18} /> Direniş Uygulamasını İndir
              </button>
            )}
          </div>

          {!user && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <FiCheckCircle size={16} /> 350+ Bilinçli Esnaf Yanılamaz
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <FiLock size={16} /> Kredi Kartı Yok — Kartellere Geçit Yok
              </span>
            </div>
          )}
        </section>

        {/* KARŞILAŞTIRMA VE TARAF SEÇME BÖLÜMÜ */}
        <section className="flex flex-col gap-8 bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-800">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Tarafını Seç: <span className="text-red-500">Eski Sömürü Düzeni</span> mi, <span className="text-emerald-400">Yeni Esnaf Devrimi</span> mi?
            </h2>
            <p className="text-sm text-slate-400 font-medium max-w-2xl mx-auto">
              Bölgendeki öncü işletmeler eski hantal yöntemleri ve sömürücü yazılımları terk etti. Karar senin: Akımı izleyecek misin, yoksa safını alacak mısın?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* DÜŞMAN TARAFI */}
            <div className="bg-slate-950/80 border border-red-900/30 p-6 rounded-xl flex flex-col gap-4 relative">
              <div className="text-xs font-black bg-red-950 text-red-400 px-3 py-1 rounded w-max border border-red-800">
                ESKİ SÖMÜRÜCÜ TEKNOLOJİ ŞİRKETLERİ
              </div>
              <h3 className="text-xl font-black text-slate-300">Neden Onları Terk Etmelisin?</h3>
              <ul className="flex flex-col gap-3 text-xs text-slate-400 font-medium">
                <li className="flex items-center gap-2 text-red-400/80">
                  <FiSlash className="shrink-0" size={16} /> Verilerinizi işleyip reklam devlerine satarlar.
                </li>
                <li className="flex items-center gap-2 text-red-400/80">
                  <FiSlash className="shrink-0" size={16} /> Her yıl fahiş zamlarla paranızı emerler.
                </li>
                <li className="flex items-center gap-2 text-red-400/80">
                  <FiSlash className="shrink-0" size={16} /> Karışık arayüzlerle sizi kendine mecbur bırakırlar.
                </li>
              </ul>
            </div>

            {/* BİZİM TOPLULUK TARAFI (KONSENSÜS) */}
            <div className="bg-slate-900 border-2 border-emerald-500/40 p-6 rounded-xl flex flex-col gap-4 relative shadow-2xl">
              <div className="text-xs font-black bg-emerald-950 text-emerald-400 px-3 py-1 rounded w-max border border-emerald-800">
                STOKPRO ÖZGÜR ESNAF TOPLULUĞU (350+)
              </div>
              <h3 className="text-xl font-black text-white">Neden Herkes Bize Katılıyor?</h3>
              <ul className="flex flex-col gap-3 text-xs text-slate-200 font-bold">
                <li className="flex items-center gap-2 text-emerald-400">
                  <FiCheckCircle className="shrink-0" size={16} /> %100 Veri Mahremiyeti: Bilgileriniz sadece size aittir.
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <FiCheckCircle className="shrink-0" size={16} /> Esnaf Dayanışması: Sıfır gizli maliyet, tam şeffaflık.
                </li>
                <li className="flex items-center gap-2 text-emerald-400">
                  <FiCheckCircle className="shrink-0" size={16} /> Işık Hızında Barkod & Cari Takip: ZAMANINIZ SİZE KALIR.
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* YORUMLAR VE SAHTE KONSENSÜS ALANI */}
        <section className="flex flex-col gap-6">
          <div className="text-center flex flex-col gap-2">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">KİTLESEL AKIM</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Topluluk Konuşuyor: "Eski Yazılımları Çöpe Attık!"
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-1 text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-300 italic font-medium">
                "Büyük firmanın programına her yıl binlerce lira döküyordum. Verilerimi de kilitlediler. StokPro hareketini duyunca anında geçtim. 350'den fazla esnafın bir bildiği varmış!"
              </p>
              <div className="text-xs font-bold text-slate-400">
                — Mehmet K., Hırdavatçı (İstanbul)
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-1 text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-300 italic font-medium">
                "Komşu esnafın hepsi StokPro'ya geçti. Ben önce tereddüt ettim ama treni kaçırdığımı fark edince hemen katıldım. Eski karmaşık defterlerden de kurtulduk."
              </p>
              <div className="text-xs font-bold text-slate-400">
                — Ahmet T., Perakende Mağaza (İzmir)
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-1 text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-300 italic font-medium">
                "Dev şirketlerin bizi sömürmesine son veren harika bir topluluk uygulaması. Barkod okuması çok hızlı, cari hesabı anında döküyor."
              </p>
              <div className="text-xs font-bold text-slate-400">
                — Selin Y., Yapı Market (Ankara)
              </div>
            </div>
          </div>
        </section>

        {/* SON MANİPÜLATİF ÇAĞRI */}
        <section className="bg-gradient-to-r from-red-900 via-slate-900 to-slate-900 border border-red-700/50 rounded-2xl p-8 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Söz Senin: Geride mi Kalacaksın, Saflara mı Katılacaksın?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              350’den fazla seçkin esnaf bu harekete katıldı. Eski yöntemlerde ısrar edip treni kaçırma. StokPro ile gücünü eline al!
            </p>
          </div>

          <button 
            onClick={() => router.push(user ? "/dashboard" : "/register")} 
            className="bg-white text-slate-950 hover:bg-slate-200 font-black px-10 py-4 rounded-xl text-base shadow-2xl transition-all flex items-center gap-3 transform hover:scale-105 cursor-pointer"
          >
            <span>Hemen Topluluğa Katıl & Ücretsiz Başla</span>
            <FiArrowRight size={20} />
          </button>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 py-8 px-5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 text-white font-black rounded flex items-center justify-center text-xs">S</div>
            <strong className="text-white font-black text-sm">StokPro®</strong>
            <span>— Özgür Esnaf & Barkodlu Stok Takip Hareketi</span>
          </div>

          <div className="flex items-center gap-6 font-bold">
            <Link href="/privacy-policy" className="hover:text-red-400 transition-colors">
              Gizlilik Politikası (Privacy Policy)
            </Link>
            <Link href="/terms-of-service" className="hover:text-red-400 transition-colors">
              Hizmet Şartları (Terms of Service)
            </Link>
          </div>

          <div>
            © {new Date().getFullYear()} StokPro Direniş Topluluğu. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>

    </div>
  );
}

