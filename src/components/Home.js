"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import {
  FiArrowRight,
  FiSearch,
  FiAlertTriangle,
  FiTrendingDown,
  FiAward,
  FiBox,
  FiUsers,
  FiDownload,
  FiFileText,
  FiLayers,
  FiShoppingBag,
  FiTruck,
  FiGrid,
  FiMonitor,
} from "react-icons/fi";

const appId =
  typeof window !== "undefined" && window.__app_id
    ? window.__app_id
    : process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
      process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
      "1:330292329201:web:d19827937fb863ea490750";

const TrustStats = () => {
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      const cachedCount = localStorage.getItem("cached_user_count");
      if (cachedCount) {
        setTargetCount(Number(cachedCount));
      } else {
        setTargetCount(100);
      }

      try {
        const db = getFirestore();
        const usersRef = collection(db, "artifacts", appId, "users");
        const snapshot = await getDocs(usersRef);
        const realCount = snapshot.size + 49;

        if (realCount > 0) {
          setTargetCount(realCount);
          localStorage.setItem("cached_user_count", realCount.toString());
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
    const duration = 1200;
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
    <div className="inline-flex items-center gap-5 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-end gap-1 h-9">
        <div className="w-2 bg-[#18181B]/25 dark:bg-white/20 rounded-sm h-[40%]" />
        <div className="w-2 bg-[#18181B]/45 dark:bg-white/35 rounded-sm h-[65%]" />
        <div className="w-2 bg-[#18181B]/65 dark:bg-white/50 rounded-sm h-[52%]" />
        <div className="w-2 bg-[#A66B49]/80 rounded-sm h-[84%]" />
        <div className="w-2 bg-[#A66B49] rounded-sm h-full" />
      </div>

      <div className="h-8 w-px bg-[#E8E8E4] dark:bg-white/10" />

      <div className="text-left">
        <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight leading-none">
          {count.toLocaleString("tr-TR")}+
        </div>
        <div className="text-xs font-semibold text-[#71717A] dark:text-zinc-400 mt-1">
          Aktif İşletme &amp; Mağaza Terminali
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));

    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsStandalone(Boolean(isInStandaloneMode));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [auth]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const sectors = [
    {
      code: "01",
      title: "Tekstil & İmalat",
      desc: "Renk/beden varyant matrisi, barkod etiketleme, fason ve toptan müşteri takibi.",
      icon: FiLayers,
    },
    {
      code: "02",
      title: "Perakende & Mağaza",
      desc: "Barkod okuyucu ile hızlı kasa satışı, nakit/kart tahsilat ve kritik stok takibi.",
      icon: FiShoppingBag,
    },
    {
      code: "03",
      title: "Toptan & Dağıtım",
      desc: "Toplu ürün girişleri, tedarikçi cari hesap ekstreleri ve sevkiyat faturaları.",
      icon: FiTruck,
    },
    {
      code: "04",
      title: "Çoklu Şube & Depo",
      desc: "Merkez-şube envanter dökümü, depo sayımları ve konsolide mali raporlar.",
      icon: FiGrid,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F7F5] dark:bg-[#0D0D11] text-[#18181B] dark:text-[#F7F7F5] flex flex-col font-sans relative overflow-hidden">
      {/* İnce Karamel Atmosfer Işığı */}
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[680px] h-[320px] bg-[#A66B49]/8 dark:bg-[#A66B49]/12 rounded-full blur-3xl pointer-events-none" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-12 sm:py-16 flex flex-col gap-16 sm:gap-20 z-10">
        {/* HERO BÖLÜMÜ */}
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 text-[11px] font-mono font-bold tracking-wider uppercase text-[#18181B] dark:text-[#F7F7F5]">
            <span className="w-2 h-2 rounded-full bg-[#A66B49]" />
            <span>STOKPRO® POS &amp; ÖN MUHASEBE SİSTEMİ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-[3.35rem] font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-[-0.03em] leading-[1.1]">
            Stok, Cari ve Kasa Yönetimi{" "}
            <span className="text-[#A66B49]">Tek Merkezde.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#71717A] dark:text-zinc-400 leading-relaxed max-w-2xl">
            <strong className="text-[#18181B] dark:text-[#F7F7F5] font-semibold">StokPro</strong>;
            perakende mağazaları, toptancılar ve ticari işletmeler için geliştirilmiş barkodlu stok
            takip, müşteri cari alacak yönetimi ve hızlı satış (POS) yazılımıdır. Depo adetlerinizi
            anlık izleyin, nakit veya veresiye satış kaydedin ve resmi fatura çıktılarınızı tek
            ekrandan yönetin.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto pt-1">
            <button
              type="button"
              onClick={() => router.push(user ? "/dashboard" : "/register")}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white text-sm font-bold transition cursor-pointer shadow-sm"
            >
              <span>{user ? "Yönetim Paneline Geç" : "Hemen Ücretsiz Başla"}</span>
              <FiArrowRight size={17} className="text-[#A66B49] dark:text-white" />
            </button>

            <a
              href="/downloads/StokPro-Setup.exe"
              download="StokPro-Setup.exe"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#F0F0EC] dark:bg-[#16161B] dark:hover:bg-white/10 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#F7F7F5] text-sm font-bold transition no-underline"
            >
              <FiMonitor size={16} className="text-[#A66B49]" />
              <span>Masaüstü POS Kurulumu</span>
            </a>

            {!isStandalone && deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-[#F0F0EC] dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#F7F7F5] text-sm font-semibold transition cursor-pointer"
              >
                <FiDownload size={16} className="text-[#A66B49]" />
                <span>Kısayol Ekle</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <TrustStats />
          </div>
        </section>

        {/* TEMEL MODÜLLER (3 SÜTUN MİMARİ KARTLAR) */}
        <section className="flex flex-col gap-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E8E8E4] dark:border-white/10 pb-4">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#A66B49]">
                ÇEKİRDEK MİMARİ
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight mt-1">
                Temel Modüller
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400">
              Günlük kasa, depo ve ön muhasebe operasyonları için sadeleştirilmiş iş akışı.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 hover:border-[#A66B49]/50 rounded-2xl p-6 flex flex-col gap-3 transition">
              <div className="w-11 h-11 rounded-xl bg-[#F7F7F5] dark:bg-white/5 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#A66B49] flex items-center justify-center">
                <FiBox size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight">
                Barkodlu Stok &amp; Depo
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400 leading-relaxed">
                Ürün kartlarınızı barkod okuyucu veya EAN-13 üretici ile kaydedin; kritik stok
                seviyesine düşen kalemleri anında görün.
              </p>
            </div>

            <div className="bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 hover:border-[#A66B49]/50 rounded-2xl p-6 flex flex-col gap-3 transition">
              <div className="w-11 h-11 rounded-xl bg-[#F7F7F5] dark:bg-white/5 border border-[#E8E8E4] dark:border-white/10 text-[#A66B49] flex items-center justify-center">
                <FiUsers size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight">
                Müşteri &amp; Tedarikçi Cari
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400 leading-relaxed">
                Veresiye satışları, tahsilatları ve tedarikçi bakiyelerini tarihsel hesap ekstresi
                olarak tek tıkla inceleyin ve yazdırın.
              </p>
            </div>

            <div className="bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 hover:border-[#A66B49]/50 rounded-2xl p-6 flex flex-col gap-3 transition">
              <div className="w-11 h-11 rounded-xl bg-[#F7F7F5] dark:bg-white/5 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#A66B49] flex items-center justify-center">
                <FiFileText size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight">
                Ön Muhasebe &amp; Fatura
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400 leading-relaxed">
                Nakit kasa giriş-çıkışlarını, masraf kalemlerini, KDV dağılımını ve A4/termal fiş
                evraklarını hatasız takip edin.
              </p>
            </div>
          </div>
        </section>

        {/* SEKTÖREL UYUM (4 SÜTUN) */}
        <section className="flex flex-col gap-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E8E8E4] dark:border-white/10 pb-4">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#A66B49]">
                ESNEK YAPI
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight mt-1">
                Sektöre Göre Şekillenen Operasyon
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400">
              İmalattan perakende kasaya kadar farklı iş modellerine uyumlu veri yapısı.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sectors.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.code}
                  className="bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[#A66B49]/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#F7F7F5] dark:bg-white/5 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#F7F7F5] flex items-center justify-center">
                      <Icon size={17} />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#A66B49]">{item.code}</span>
                  </div>

                  <div className="space-y-1.5">
                    <strong className="text-sm font-extrabold text-[#18181B] dark:text-[#F7F7F5] block">
                      {item.title}
                    </strong>
                    <p className="text-xs text-[#71717A] dark:text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* OBSİDYEN ANALİZ BLOKU (STOKPRO DESKTOP KARAKTERİSTİK KOYU KART) */}
        <section className="bg-[#18181B] border border-zinc-800 rounded-3xl p-7 sm:p-10 text-[#F7F7F5] flex flex-col gap-7 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] font-bold text-[#A66B49] uppercase tracking-widest block">
                MAĞAZA ANALİTİĞİ
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Anlık Envanter ve Kârlılık Kontrolü
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
              Hareketsiz kalan stokları, tükenmek üzere olan ürünleri ve en yüksek marjlı kalemleri
              tek bakışta tespit edin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
              <FiSearch className="text-[#A66B49] text-lg" />
              <strong className="text-sm font-bold text-white">Milisaniyelik Arama</strong>
              <span className="text-xs text-zinc-400 leading-relaxed">
                Barkod, stok kodu veya cari adına göre anında filtreleme.
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
              <FiAlertTriangle className="text-[#A66B49] text-lg" />
              <strong className="text-sm font-bold text-white">Kritik Stok Takibi</strong>
              <span className="text-xs text-zinc-400 leading-relaxed">
                Minimum stok sınırının altına inen ürünlerde otomatik uyarı.
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
              <FiTrendingDown className="text-[#A66B49] text-lg" />
              <strong className="text-sm font-bold text-white">Hareketsiz Stok Analizi</strong>
              <span className="text-xs text-zinc-400 leading-relaxed">
                Uzun süredir satılmayan ürünleri belirleyerek sermayeyi koruma.
              </span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-2">
              <FiAward className="text-[#A66B49] text-lg" />
              <strong className="text-sm font-bold text-white">Kâr Marjı Raporu</strong>
              <span className="text-xs text-zinc-400 leading-relaxed">
                Alış maliyeti ve satış fiyatı üzerinden net ciro analizi.
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ALT BİLGİ (GOOGLE OAUTH UYUMLU LİNKLER) */}
      <footer className="w-full bg-white dark:bg-[#16161B] border-t border-[#E8E8E4] dark:border-white/10 py-7 px-5 mt-auto z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A] dark:text-zinc-400">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#18181B] dark:bg-[#A66B49] text-white font-extrabold rounded-md flex items-center justify-center text-xs">
              S
            </div>
            <strong className="text-[#18181B] dark:text-[#F7F7F5] font-extrabold text-sm">
              StokPro®
            </strong>
            <span>— Stok, Cari &amp; Ön Muhasebe</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link
              href="/privacy-policy"
              className="text-[#71717A] dark:text-zinc-400 hover:text-[#A66B49] dark:hover:text-[#A66B49] transition-colors no-underline"
            >
              Gizlilik Politikası
            </Link>
            <Link
              href="/terms-of-service"
              className="text-[#71717A] dark:text-zinc-400 hover:text-[#A66B49] dark:hover:text-[#A66B49] transition-colors no-underline"
            >
              Hizmet Şartları
            </Link>
          </div>

          <div className="font-mono text-[11px]">
            © {new Date().getFullYear()} StokPro. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
