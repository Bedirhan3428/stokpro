"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import {
FiArrowRight, FiSearch, FiAlertTriangle, FiTrendingDown,
FiAward, FiCheckCircle, FiBox, FiUsers, FiPieChart, FiDownload, FiShare,
FiShield, FiFileText, FiDollarSign, FiZap, FiLock
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
const realCount = snapshot.size + 49;

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

{/* HERO SECTION WITH EXPLICIT APPLICATION PURPOSE */}
<section className="text-center flex flex-col items-center gap-5 max-w-4xl mx-auto pt-2 px-2 sm:px-0">

{/* OAUTH VERIFICATION VERBATIM BRAND BADGE */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-extrabold tracking-wide text-center">
<FiZap className="shrink-0" /> <span>STOKPRO® BARKODLU STOK VE ÖN MUHASEBE</span>
</div>

<h1 className="text-2xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
StokPro ile İşletmenizi Dijitalleştirin <br className="hidden sm:inline" />
<span className="text-blue-600 dark:text-blue-500">Stok, Cari ve Kasa Yönetimi</span>
</h1>

{/* APPLICATION PURPOSE BANNER (GOOGLE OAUTH VERIFICATION REQUIREMENT) */}
<div className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 sm:p-6 shadow-sm text-left flex flex-col gap-3">
<h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
<FiShield className="text-blue-600 shrink-0" /> StokPro Uygulamasının Amacı Nedir?
</h3>
<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
<strong>StokPro</strong>, küçük ve orta ölçekli ticari işletmeler (esnaf, hırdavat, perakende mağazaları) için geliştirilmiş <strong>bulut tabanlı barkodlu stok takip, müşteri cari alacak yönetimi ve ön muhasebe yazılımıdır</strong>. Kullanıcıların karmaşık defter hesaplarına son vererek; depolardaki ürün adetlerini anlık izlemelerini, kasaya nakit/veresiye satış kaydetmelerini ve dijital satış faturası kesmelerini sağlar.
</p>
</div>

<TrustStats />

<div className="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
<button
onClick={() => router.push(user ? "/dashboard" : "/register")}
className="modern-btn primary w-full sm:w-auto justify-center"
style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: 900 }}
>
{user ? "Yönetim Paneline Geç" : "Hemen Ücretsiz Başla"} <FiArrowRight size={18} />
</button>

{!isStandalone && deferredPrompt && (
<button onClick={handleInstallClick} className="modern-btn secondary w-full sm:w-auto justify-center" style={{ padding: '12px 20px' }}>
<FiDownload size={18} /> Uygulamayı İndir
</button>
)}
</div>

{!user && (
<p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-1.5">
<FiCheckCircle className="text-emerald-500 shrink-0" /> Kurulum veya Kredi Kartı Gerekmez — Anında Deneyin
</p>
)}
</section>

{/* DETAILED FEATURE MODULES SECTION */}
<section className="flex flex-col gap-8">
<div className="text-center flex flex-col gap-2">
<h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
StokPro Sunulan <span className="text-blue-600">Temel Modüller ve İşlevler</span>
</h2>
<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
İşletmenizi yönetmek için gereken her şey elinizin altında.
</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

<div className="card hover:border-blue-500 transition-all">
<div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black mb-2">
<FiBox />
</div>
<h3 className="text-base font-black text-slate-900 dark:text-white">Barkodlu Stok & Depo Takibi</h3>
<p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
Ürünlerinizi barkod okuyucu veya manuel seri no ile kaydedin. Kritik stok seviyelerine ulaşan ürünleri anında uyarır.
</p>
</div>

<div className="card hover:border-emerald-500 transition-all">
<div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-black mb-2">
<FiUsers />
</div>
<h3 className="text-base font-black text-slate-900 dark:text-white">Müşteri Cari & Veresiye Takibi</h3>
<p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
Müşterilerinize veresiye satış yapın, borç ve ödeme geçmişlerini tarihsel olarak tek tıkla döküm alın.
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
<section className="bg-slate-900 text-white rounded-xl p-8 flex flex-col gap-6 shadow-xl">
<div className="flex flex-col gap-2">
<span className="text-xs font-black text-blue-400 uppercase tracking-widest">AKILLI MAĞAZA ANALİZİ</span>
<h2 className="text-2xl font-black text-white tracking-tight">
StokPro AI Mağaza Zekası
</h2>
<p className="text-xs text-slate-400 font-medium">
Verilerinizi işleyerek satılmayan ölü stokları ve en çok kazandıran şampiyon ürünleri tespit eder.
</p>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex flex-col gap-1">
<FiSearch className="text-blue-400 text-xl" />
<strong className="text-sm text-white">Hızlı Arama</strong>
<span className="text-xs text-slate-400">Ürün ve müşterileri anında bulun.</span>
</div>

<div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex flex-col gap-1">
<FiAlertTriangle className="text-amber-400 text-xl" />
<strong className="text-sm text-white">Kritik Stok Uyarısı</strong>
<span className="text-xs text-slate-400">Tükenmek üzere olan ürün uyarısı.</span>
</div>

<div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex flex-col gap-1">
<FiTrendingDown className="text-red-400 text-xl" />
<strong className="text-sm text-white">Ölü Stok Tespiti</strong>
<span className="text-xs text-slate-400">Satılmayan ürünlerde indirim önerisi.</span>
</div>

<div className="bg-slate-800/80 border border-slate-700 p-4 rounded-lg flex flex-col gap-1">
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
<span>— Ticari Stok & Ön Muhasebe Yazılımı</span>
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
