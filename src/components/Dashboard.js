"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, 
  FiAlertCircle, FiArrowUpRight, FiPackage, FiActivity,
  FiZap, FiAward, FiAlertTriangle, FiShoppingBag, FiInfo,
  FiChevronLeft, FiChevronRight, FiArrowRight
} from "react-icons/fi";

import { fetchDashboardDataSingleRequest } from "../utils/dashboardAggregator";
import { getMasterStoreSnapshot, subscribeToMasterStore } from "../utils/masterDataCache";
import useSubscription from "../hooks/useSubscription";

ChartJS.register(ArcElement, Tooltip, Legend);

function moneyFormat(val) {
  return Number(val || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY"
  });
}

function calculateDashboardFromStore(store) {
  if (!store) return null;
  const products = store.products || [];
  const sales = store.sales || [];
  const customers = store.customers || [];
  const custPayments = store.custPayments || [];
  const incomes = store.incomes || [];
  const expenses = store.expenses || [];

  let totalCiro = 0;
  let totalNakitSatis = 0;
  let totalVeresiyeSatis = 0;
  let totalCost = 0;

  sales.forEach(s => {
    const tot = Number(s.totals?.total || s.total || 0);
    totalCiro += tot;
    if (s.saleType === "credit") {
      totalVeresiyeSatis += tot;
    } else {
      totalNakitSatis += tot;
    }

    const sItems = Array.isArray(s.items) ? s.items : [];
    sItems.forEach(it => {
      const prd = products.find(p => p.id === (it.productId || it.id));
      const cost = Number(prd?.costPrice || prd?.buyPrice || prd?.cost || 0);
      totalCost += cost * Number(it.qty || 1);
    });
  });

  let totalTahsilat = custPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  let totalEkGelir = incomes.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  let totalGider = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const toplamKasaGelir = totalNakitSatis + totalTahsilat + totalEkGelir;
  const netKasa = toplamKasaGelir - totalGider; // KASA / BANKA DENGESİ
  const netKarZarar = totalCiro - totalGider - totalCost; // NET KÂR / ZARAR

  const criticalStock = products.filter(p => Number(p.stock || 0) < 10).slice(0, 5);
  const lowStockCount = products.filter(p => Number(p.stock || 0) < 10).length;

  const recentSales = sales.slice(0, 5);

  const chartData = {
    labels: ['Nakit Satışlar', 'Müşteri Tahsilatı', 'Ek Gelirler'],
    datasets: [
      {
        data: [totalNakitSatis, totalTahsilat, totalEkGelir],
        backgroundColor: ['#2563eb', '#10b981', '#7c3aed'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  return {
    kpi: {
      totalCiro,
      totalNakitSatis,
      totalVeresiyeSatis,
      totalGider,
      totalCost,
      netKarZarar,
      netKasa,
      totalTahsilat,
      totalEkGelir,
      totalProductsCount: products.length,
      lowStockCount,
      totalSalesCount: sales.length,
      totalExpenseCount: expenses.length
    },
    criticalStock,
    recentSales,
    chartData
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { loading: subLoading, active: subActive } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [showAiBrief, setShowAiBrief] = useState(true);

  // Samsung Now Brief Carousel Slide Index
  const [briefIndex, setBriefIndex] = useState(0);

  // MASTER CACHE VE GİZLEME TERCİHİ OKUMASI (0MS HIZLI YÜKLEME)
  useEffect(() => {
    const snap = getMasterStoreSnapshot();
    if (snap?.profile?.showAiBrief !== undefined) {
      setShowAiBrief(snap.profile.showAiBrief !== false);
    }

    const initialCalc = calculateDashboardFromStore(snap);
    if (initialCalc) {
      setDashboardData(initialCalc);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const unsub = subscribeToMasterStore((store) => {
      if (store?.profile?.showAiBrief !== undefined) {
        setShowAiBrief(store.profile.showAiBrief !== false);
      }
      const calc = calculateDashboardFromStore(store);
      if (calc) {
        setDashboardData(calc);
        setLoading(false);
      }
    });

    // Arka planda sunucu senkronizasyonu
    fetchDashboardDataSingleRequest().then((data) => {
      if (data) setDashboardData(data);
    }).catch(err => console.warn("Background dashboard fetch:", err))
    .finally(() => setLoading(false));

    return () => unsub();
  }, []);

  const kpi = dashboardData?.kpi || {
    totalCiro: 0,
    totalNakitSatis: 0,
    totalVeresiyeSatis: 0,
    totalGider: 0,
    totalCost: 0,
    netKarZarar: 0,
    netKasa: 0,
    totalTahsilat: 0,
    totalEkGelir: 0,
    totalProductsCount: 0,
    lowStockCount: 0,
    totalSalesCount: 0,
    totalExpenseCount: 0
  };

  const chartData = dashboardData?.chartData || {
    labels: ['Nakit Satışlar', 'Müşteri Tahsilatı', 'Ek Gelirler'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#2563eb', '#10b981', '#7c3aed'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  const criticalStock = dashboardData?.criticalStock || [];
  const recentSales = dashboardData?.recentSales || [];

  // SAMSUNG NOW BRIEF WIDGET - CANLI VE DEĞİŞKEN DİNAMİK YAPAY ZEKA SLIDE'LARI
  const aiBriefSlides = useMemo(() => {
    const slides = [];

    // SLIDE 1: NET KASA VE FİNANSAL SAĞLIK ANALİZİ
    if (kpi.netKasa >= 0) {
      slides.push({
        id: "fin_health_pos",
        badge: "GÜNLÜK FİNANSAL SAĞLIK: MÜKEMMEL",
        badgeColor: "green",
        title: `Net Kasa Bakiyeniz ${moneyFormat(kpi.netKasa)} İle Pozitif Durumda!`,
        desc: `Toplam ${moneyFormat(kpi.totalCiro)} ciro elde ettiniz. Nakit ve tahsilat girdileriniz giderlerinizi fazlasıyla karşılıyor.`,
        actionText: "Muhasebe Defterini İncele",
        actionUrl: "/accounting"
      });
    } else {
      slides.push({
        id: "fin_health_neg",
        badge: "FİNANSAL UYARI: KASA EKSİDE",
        badgeColor: "red",
        title: `Kasa Bakiyeniz ${moneyFormat(kpi.netKasa)} İle Açık Veriyor!`,
        desc: `Toplam giderleriniz (${moneyFormat(kpi.totalGider)}) nakit girdilerinizin üzerinde. Acil tahsilatları ve ödemeleri gözden geçirin.`,
        actionText: "Müşteri Alacaklarını İncele",
        actionUrl: "/customers"
      });
    }

    // SLIDE 2: KRİTİK STOK UYARISI
    if (kpi.lowStockCount > 0) {
      slides.push({
        id: "crit_stock_warn",
        badge: `KRİTİK STOK UYARISI (${kpi.lowStockCount} ÜRÜN)`,
        badgeColor: "red",
        title: `${kpi.lowStockCount} Adet Ürününüzün Stoğu 10 Adedin Altına Düştü!`,
        desc: "Satışlarınızın aksamaması için kritik seviyedeki ürünlerinize yeni stok ekleyin veya tedarikçilerinize sipariş geçin.",
        actionText: "Kritik Stokları Filtrele",
        actionUrl: "/products?stockFilter=critical"
      });
    } else {
      slides.push({
        id: "crit_stock_ok",
        badge: "ENVANTER DURUMU: KUSURSUZ",
        badgeColor: "blue",
        title: "Tüm Ürünlerinizin Stok Seviyesi Yeterli Seviyede!",
        desc: "Kritik seviyeye düşmüş herhangi bir ürün bulunmuyor. Yeni ürün veya kategori eklemek için Ürünler modülünü kullanabilirsiniz.",
        actionText: "Ürün Kataloğuna Git",
        actionUrl: "/products"
      });
    }

    // SLIDE 3: VERESİYE VE ALACAK TAKİBİ
    if (kpi.totalVeresiyeSatis > 0) {
      slides.push({
        id: "credit_sales_info",
        badge: "MÜŞTERİ VERESİYE TAKİBİ",
        badgeColor: "purple",
        title: `Toplam ${moneyFormat(kpi.totalVeresiyeSatis)} Tutarında Veresiye Satış Gerçekleştirildi`,
        desc: "Veresiye borcu olan müşterilerinizden tahsilat alarak net kasa bakiyenizi anında artırabilirsiniz.",
        actionText: "Müşteriler Modülüne Git",
        actionUrl: "/customers"
      });
    }

    return slides;
  }, [kpi]);

  const currentBrief = aiBriefSlides[briefIndex % aiBriefSlides.length] || aiBriefSlides[0];

  return (
    <div className="page-container">
      
      {!subLoading && !subActive && (
        <div className="alert-banner">
          <FiAlertCircle size={20} />
          <span>Hesabınız kısıtlı. Tüm özellikleri açmak için:</span>
          <Link href="/product-key" className="alert-link">Ücretsiz Etkinleştir</Link>
        </div>
      )}

      {/* SAMSUNG NOW BRIEF - TEK VE CANLI YAPAY ZEKA ÖZET WIDGET'I (EĞER AYARLARDAN KAPATILMADIYSA) */}
      {showAiBrief && currentBrief && (
        <div 
          className="prd-card" 
          style={{ 
            marginBottom: '20px', 
            background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.06) 100%)',
            border: '1.5px solid var(--primary-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`table-badge ${currentBrief.badgeColor}`} style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <FiZap size={13} style={{ marginRight: '4px' }} /> {currentBrief.badge}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                • StokPro AI Now Brief ({briefIndex + 1}/{aiBriefSlides.length})
              </span>
            </div>

            {/* SLIDE DEĞİŞTİRME BUTONLARI */}
            {aiBriefSlides.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button 
                  onClick={() => setBriefIndex(prev => (prev === 0 ? aiBriefSlides.length - 1 : prev - 1))}
                  className="tbl-btn secondary icon-only" 
                  style={{ width: '28px', height: '28px' }}
                  title="Önceki Analiz"
                >
                  <FiChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setBriefIndex(prev => (prev + 1) % aiBriefSlides.length)}
                  className="tbl-btn secondary icon-only" 
                  style={{ width: '28px', height: '28px' }}
                  title="Sonraki Analiz"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            {currentBrief.title}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5, maxWidth: '90%' }}>
            {currentBrief.desc}
          </p>

          <div>
            <Link 
              href={currentBrief.actionUrl} 
              className="modern-btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {currentBrief.actionText} <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* 4 ETKİLEŞİMLİ KPI ÖZET KARTI (HOVER AŞAĞI AÇILAN POPUP DETAY MENÜLÜ) */}
      <div className="kpi-grid">
        
        {/* KART 1: TOPLAM CİRO (SATIŞLAR) */}
        <div 
          className="kpi-card group relative" 
          onClick={() => router.push("/sales")}
        >
          <div className="kpi-icon blue"><FiTrendingUp /></div>
          <div className="kpi-info">
            <span className="kpi-label">TOPLAM CİRO (SATIŞLAR)</span>
            <span className="kpi-value">{moneyFormat(kpi.totalCiro)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Nakit, Kart & Veresiye Satışlar
            </span>
          </div>

          {/* HOVER AŞAĞI AÇILAN POPUP DETAY MENÜSÜ */}
          <div className="kpi-tooltip-popup">
            <div style={{ fontWeight: 900, fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '6px', marginBottom: '4px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiTrendingUp /> TOPLAM CİRO DETAYLARI
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Nakit Satışlar:</span>
              <strong style={{ color: '#34d399' }}>+{moneyFormat(kpi.totalNakitSatis)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Cari / Veresiye Satışlar:</span>
              <strong style={{ color: '#c084fc' }}>+{moneyFormat(kpi.totalVeresiyeSatis)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• İşlenen Satış Sayısı:</span>
              <strong style={{ color: '#ffffff' }}>{kpi.totalSalesCount} Adet</strong>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px', fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Formül: (Nakit + Kart + Cari/Vadeli tüm satışların toplamı)
            </div>
          </div>
        </div>

        {/* KART 2: TOPLAM GİDER / HARCAMA */}
        <div 
          className="kpi-card group relative" 
          onClick={() => router.push("/accounting")}
        >
          <div className="kpi-icon red"><FiTrendingDown /></div>
          <div className="kpi-info">
            <span className="kpi-label">TOPLAM GİDER / HARCAMA</span>
            <span className="kpi-value">{moneyFormat(kpi.totalGider)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Fatura, Personel & Mal Alımı
            </span>
          </div>

          {/* HOVER AŞAĞI AÇILAN POPUP DETAY MENÜSÜ */}
          <div className="kpi-tooltip-popup">
            <div style={{ fontWeight: 900, fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '6px', marginBottom: '4px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiTrendingDown /> GİDER HESAP DETAYLARI
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Kasa Gider Çıktıları:</span>
              <strong style={{ color: '#f87171' }}>-{moneyFormat(kpi.totalGider)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Kayıtlı Gider Sayısı:</span>
              <strong style={{ color: '#ffffff' }}>{kpi.totalExpenseCount || 0} İşlem</strong>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px', fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Formül: (Fatura, personel, mal alımı vb. tüm giderler)
            </div>
          </div>
        </div>

        {/* KART 3: NET KÂR / ZARAR */}
        <div 
          className="kpi-card group relative" 
          onClick={() => router.push("/accounting")}
        >
          <div className="kpi-icon purple"><FiAward /></div>
          <div className="kpi-info">
            <span className="kpi-label">NET KÂR / ZARAR</span>
            <span className="kpi-value" style={{ color: kpi.netKarZarar >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {moneyFormat(kpi.netKarZarar)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Ciro - Gider - Ürün Maliyeti
            </span>
          </div>

          {/* HOVER AŞAĞI AÇILAN POPUP DETAY MENÜSÜ */}
          <div className="kpi-tooltip-popup">
            <div style={{ fontWeight: 900, fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '6px', marginBottom: '4px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiAward /> NET KÂR / ZARAR TABLOSU
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Toplam Satış Cirosu:</span>
              <strong style={{ color: '#34d399' }}>+{moneyFormat(kpi.totalCiro)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Toplam Giderler:</span>
              <strong style={{ color: '#f87171' }}>-{moneyFormat(kpi.totalGider)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Satılan Ürün Maliyeti:</span>
              <strong style={{ color: '#fbbf24' }}>-{moneyFormat(kpi.totalCost)}</strong>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>• Net Kâr / Zarar:</span>
              <strong style={{ color: kpi.netKarZarar >= 0 ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>{moneyFormat(kpi.netKarZarar)}</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
              Formül: (Toplam Ciro - Toplam Gider - Ürün Maliyetleri)
            </div>
          </div>
        </div>

        {/* KART 4: KASA / BANKA DENGESİ */}
        <div 
          className="kpi-card group relative" 
          onClick={() => router.push("/accounting")}
        >
          <div className="kpi-icon green"><FiDollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-label">KASA / BANKA DENGESİ</span>
            <span className="kpi-value" style={{ color: kpi.netKasa >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {moneyFormat(kpi.netKasa)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Fiilen Kasa & Bankadaki Likit Para
            </span>
          </div>

          {/* HOVER AŞAĞI AÇILAN POPUP DETAY MENÜSÜ */}
          <div className="kpi-tooltip-popup">
            <div style={{ fontWeight: 900, fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '6px', marginBottom: '4px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiDollarSign /> LİKİT KASA DENGE TABLOSU
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Peşin Satış Girişleri:</span>
              <strong style={{ color: '#34d399' }}>+{moneyFormat(kpi.totalNakitSatis)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Müşteri Tahsilatları:</span>
              <strong style={{ color: '#34d399' }}>+{moneyFormat(kpi.totalTahsilat)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Ek Gelir Girişleri:</span>
              <strong style={{ color: '#c084fc' }}>+{moneyFormat(kpi.totalEkGelir)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>• Gider Çıktıları:</span>
              <strong style={{ color: '#f87171' }}>-{moneyFormat(kpi.totalGider)}</strong>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>• Anlık Likit Kasa:</span>
              <strong style={{ color: kpi.netKasa >= 0 ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>{moneyFormat(kpi.netKasa)}</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
              Formül: (Şu an fiilen kasada ve bankada duran likit para)
            </div>
          </div>
        </div>

      </div>

      {/* DETAYLI İSTATİSTİK VE GRAFİK BÖLÜMÜ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        {/* SOL: FİNANSAL GELİR DAĞILIMI PASTA GRAFİĞİ */}
        <div className="prd-card">
          <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiActivity style={{ color: 'var(--primary)' }} /> Kasa Girdi Dağılımı (Grafik)
            </h4>
          </div>

          <div style={{ height: '240px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Doughnut 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 12 } } }
                }
              }} 
            />
          </div>
        </div>

        {/* SAĞ: KRİTİK STOK LİSTESİ VE TARGETED DEEP LINKING */}
        <div className="prd-card">
          <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
              <FiAlertTriangle /> Kritik Seviyedeki Ürünler (&lt; 10 Adet)
            </h4>
            <Link href="/products?stockFilter=critical" className="modern-btn ghost" style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              Tümünü Gör
            </Link>
          </div>

          {criticalStock.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiPackage size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Kritik seviyede ürün bulunmuyor.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ürün Adı</th>
                    <th>Kategori</th>
                    <th style={{ textAlign: 'center' }}>Kalan Stok</th>
                    <th style={{ textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalStock.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="table-badge gray">{p.category || "Genel"}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="table-badge red">{p.stock || 0} Adet</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {/* DEEP LINK TARGETED HIGHLIGHT: TIKLANDIĞINDA ÜRÜNLER SAYFASINDA VURGULANIR */}
                        <Link 
                          href={`/products?highlight=${encodeURIComponent(p.name)}`}
                          className="tbl-btn primary"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        >
                          İncele
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
