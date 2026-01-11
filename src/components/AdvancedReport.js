import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  FiAlertTriangle, FiTrendingUp, FiPackage, FiActivity, FiCheckCircle, FiInfo 
} from "react-icons/fi";
import {
  listSales,
  listProductsForCurrentUser
} from "../utils/firebaseHelpers";
import "../styles/AdvancedReport.css";

// --- KRİTİK DÜZELTME: Çizgi Grafik Modüllerini Kaydet ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- YARDIMCI FONKSİYONLAR ---
function parseTimestamp(v) {
  if (!v) return null;
  if (typeof v === "object" && typeof v.toDate === "function") return v.toDate();
  if (typeof v === "object" && v.seconds) return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function getDaysDiff(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}

export default function AdvancedReport() {
  const [salesRaw, setSalesRaw] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [s, p] = await Promise.all([listSales(), listProductsForCurrentUser()]);
        if(mounted) {
          setSalesRaw(Array.isArray(s) ? s : []);
          setProducts(Array.isArray(p) ? p : []);
        }
      } catch (err) { 
        console.error("Rapor hatası:", err); 
      } finally { 
        if(mounted) setLoading(false); 
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  // --- GELİŞMİŞ ALGORİTMA MOTORU ---
  const report = useMemo(() => {
    const today = new Date();
    const lookbackDays = 30; // 30 günlük analiz
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - lookbackDays);

    // 1. Veri Hazırlığı
    const productMetrics = {};
    let totalRevenue = 0;
    
    // Ürünleri başlangıç verisiyle doldur
    (products || []).forEach(p => {
      productMetrics[p.id] = {
        ...p,
        stock: Number(p.stock || 0),
        soldQty: 0,
        revenue: 0,
        lastSaleDate: null,
        daysSinceCreation: getDaysDiff(parseTimestamp(p.createdAt) || new Date(0), today)
      };
    });

    const dailyRevenue = {};
    
    // Satışları İşle
    (salesRaw || []).forEach(s => {
      const d = parseTimestamp(s.createdAt || s.date);
      if (!d || d < cutoffDate) return;

      const dateKey = d.toISOString().split('T')[0];
      const total = Number(s.totals?.total || s.total || 0);
      
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + total;
      totalRevenue += total;

      (s.items || []).forEach(item => {
        const pid = item.productId;
        if (productMetrics[pid]) {
          productMetrics[pid].soldQty += Number(item.qty || 0);
          productMetrics[pid].revenue += (Number(item.price || 0) * Number(item.qty || 0));
          if (!productMetrics[pid].lastSaleDate || d > productMetrics[pid].lastSaleDate) {
            productMetrics[pid].lastSaleDate = d;
          }
        }
      });
    });

    // 2. Metrik Hesaplama (ABC Analizi & Hız)
    const analyzedProducts = Object.values(productMetrics).map(p => {
      // Satış Hızı (Günde ortalama kaç adet)
      const velocity = p.soldQty / lookbackDays;
      
      // Stok Ömrü (Mevcut stok kaç gün yeter?)
      const runwayDays = velocity > 0 ? (p.stock / velocity) : (p.stock > 0 ? 999 : 0);

      return { ...p, velocity, runwayDays };
    });

    // Ciroya göre sırala
    analyzedProducts.sort((a, b) => b.revenue - a.revenue);
    
    let cumulativeRevenue = 0;
    const scoredProducts = analyzedProducts.map(p => {
      cumulativeRevenue += p.revenue;
      const percentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) : 0;
      
      // A Sınıfı: Cironun ilk %80'i (En değerli)
      // B Sınıfı: %80-%95 arası
      // C Sınıfı: Son %5
      let grade = 'C';
      if (percentage <= 0.80) grade = 'A';
      else if (percentage <= 0.95) grade = 'B';
      
      return { ...p, grade };
    });

    // 3. Segmentasyon

    // Acil Stok: Hızlı satıyor (A veya B) ve stoğu 7 günden az
    const urgentRestock = scoredProducts.filter(p => 
      p.stock > 0 && p.runwayDays < 7 && (p.grade === 'A' || p.grade === 'B')
    );

    // Ölü Stok: 15 gündür var, stoğu var ama 30 gündür hiç satmamış
    const deadStock = scoredProducts.filter(p => 
      p.stock > 0 && p.soldQty === 0 && p.daysSinceCreation > 15
    ).sort((a, b) => b.stock - a.stock);

    // Yıldız Ürünler (En çok ciro yapan ilk 5)
    const starProducts = scoredProducts.filter(p => p.grade === 'A').slice(0, 5);

    // Grafik Verisi
    const sortedDates = Object.keys(dailyRevenue).sort();
    const dataSeries = sortedDates.map(d => dailyRevenue[d]);

    // Tahmini Ay Sonu
    const avgDailyRev = totalRevenue / lookbackDays;
    const projectedMonth = avgDailyRev * 30;

    return {
      totalRevenue,
      projectedMonth,
      activeProductCount: products.length,
      urgentRestock,
      deadStock,
      starProducts,
      chartLabels: sortedDates.map(d => {
         const dx = new Date(d);
         return `${dx.getDate()}/${dx.getMonth()+1}`;
      }),
      chartDataValues: dataSeries
    };
  }, [salesRaw, products]);

  // Grafik Konfigürasyonu
  const lineChartConfig = {
    labels: report.chartLabels,
    datasets: [{
      label: 'Günlük Ciro',
      data: report.chartDataValues,
      borderColor: '#2563eb',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "rgba(37,99,235,0.2)");
        gradient.addColorStop(1, "rgba(37,99,235,0)");
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHitRadius: 10,
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: { 
      x: { grid: { display: false }, ticks: { maxTicksLimit: 7, font: {size: 10} } }, 
      y: { grid: { color: '#f1f5f9' }, ticks: { font: {size: 10} } } 
    }
  };

  if (loading) return <div className="adv-loading">Veriler işleniyor...</div>;

  return (
    <div className="adv-wrapper">
      
      <div className="adv-intro">
        <h3>İş Zekası Raporu</h3>
        <p>Gelişmiş ABC analizi ve stok öngörüleri.</p>
      </div>

      {/* KPI KARTLARI */}
      <div className="adv-summary-grid">
        <div className="adv-stat-card">
          <div className="stat-icon blue"><FiTrendingUp /></div>
          <div className="stat-info">
            <span className="stat-label">30 Günlük Ciro</span>
            <span className="stat-val">{report.totalRevenue.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits: 0})}</span>
          </div>
        </div>
        <div className="adv-stat-card">
          <div className="stat-icon green"><FiActivity /></div>
          <div className="stat-info">
            <span className="stat-label">Ay Sonu Tahmini</span>
            <span className="stat-val">~{report.projectedMonth.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits: 0})}</span>
          </div>
        </div>
        <div className="adv-stat-card">
          <div className="stat-icon purple"><FiPackage /></div>
          <div className="stat-info">
            <span className="stat-label">Aktif Ürün</span>
            <span className="stat-val">{report.activeProductCount}</span>
          </div>
        </div>
      </div>

      {/* GRAFİK */}
      <div className="adv-chart-box">
        <div className="box-header">
          <h4>Satış Trendi</h4>
        </div>
        <div className="chart-container">
          <Line data={lineChartConfig} options={lineChartOptions} />
        </div>
      </div>

      {/* İÇGÖRÜLER */}
      <div className="adv-insights-grid">
        
        {/* ACİL STOK */}
        <div className="insight-card">
          <div className="insight-header">
            <div className="header-left">
              <FiAlertTriangle className="icon-alert" />
              <h4>Acil İhtiyaçlar</h4>
            </div>
            <span className="header-badge">{report.urgentRestock.length} Ürün</span>
          </div>
          <p className="insight-desc">Çok satan ve stoğu 7 günden az kalacak kritik ürünler.</p>
          
          <div className="insight-list">
            {report.urgentRestock.length === 0 && <div className="empty-msg"><FiCheckCircle /> Stoklar güvende.</div>}
            {report.urgentRestock.slice(0, 5).map(p => (
              <div key={p.id} className="insight-row critical">
                <div className="row-main">
                  <span className="prod-name">{p.name}</span>
                  <span className="prod-sub">{p.runwayDays.toFixed(0)} gün yetecek stok</span>
                </div>
                <div className="row-end">
                  <span className="badge-critical">{p.stock} Adet</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YILDIZLAR */}
        <div className="insight-card">
          <div className="insight-header">
            <div className="header-left">
              <FiTrendingUp className="icon-star" />
              <h4>Ciro Liderleri (A Sınıfı)</h4>
            </div>
          </div>
          <p className="insight-desc">Cironun %80'ini sırtlayan en değerli ürünleriniz.</p>
          
          <div className="insight-list">
            {report.starProducts.slice(0, 5).map((p, idx) => (
              <div key={p.id} className="insight-row">
                <div className="row-rank">{idx + 1}</div>
                <div className="row-main">
                  <span className="prod-name">{p.name}</span>
                  <span className="prod-sub">{p.soldQty} adet satıldı</span>
                </div>
                <div className="row-end">
                  <span className="val-text">{p.revenue.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits:0})}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ÖLÜ STOK */}
        <div className="insight-card full-width">
          <div className="insight-header">
            <div className="header-left">
              <FiInfo className="icon-info" />
              <h4>Hareketsiz Stoklar (Ölü Stok)</h4>
            </div>
          </div>
          <p className="insight-desc">En az 15 gündür sistemde olan ama son 30 gündür hiç satılmayan ürünler.</p>
          
          <div className="insight-grid-list">
            {report.deadStock.length === 0 && <div className="empty-msg">Hareketsiz ürün yok.</div>}
            {report.deadStock.slice(0, 6).map(p => (
              <div key={p.id} className="grid-item">
                <span className="grid-name">{p.name}</span>
                <span className="grid-stock">{p.stock} adet stokta</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


