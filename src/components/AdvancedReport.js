import "../styles/AdvancedReport.css";
import React, { useEffect, useMemo, useState } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  listSales,
  listLedger,
  listCustomers,
  listCustomerPayments,
  listLegacyIncomes,
  listLegacyExpenses
} from "../utils/firebaseHelpers";
import { listProductsForCurrentUser } from "../utils/artifactUserProducts";
import "../utils/chartSetup";

/* --- YARDIMCI MATEMATİK FONKSİYONLARI --- */
function parseTimestamp(v) {
  if (!v) return null;
  if (typeof v === "object" && typeof v.toDate === "function") return v.toDate();
  if (typeof v === "object" && v.seconds) return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseDateKey(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Doğrusal Regresyon (Tahminleme için)
function linearRegression(y) {
  const x = y.map((_, i) => i);
  const n = y.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default function AdvancedReport() {
  const [salesRaw, setSalesRaw] = useState([]);
  const [products, setProducts] = useState([]);
  const [legacyIncomes, setLegacyIncomes] = useState([]);
  const [legacyExpenses, setLegacyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Analiz periyodu (Son 30 gün varsayılan)
  const DAYS_LOOKBACK = 30;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, p, lInc, lExp] = await Promise.all([
        listSales(),
        listProductsForCurrentUser(),
        listLegacyIncomes(),
        listLegacyExpenses()
      ]);
      setSalesRaw(Array.isArray(s) ? s : []);
      setProducts(Array.isArray(p) ? p : []);
      setLegacyIncomes(Array.isArray(lInc) ? lInc : []);
      setLegacyExpenses(Array.isArray(lExp) ? lExp : []);
    } catch (err) {
      console.error("Rapor hatası:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- ANALİZ MOTORU ---
  const analysis = useMemo(() => {
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - DAYS_LOOKBACK);

    // 1. Veri Hazırlığı
    const dailyData = {};
    let totalRevenue = 0;
    let totalSalesCount = 0;
    
    // Satışları işle
    const filteredSales = salesRaw.filter(s => {
      const d = parseTimestamp(s.createdAt || s.date);
      return d && d >= cutoffDate;
    });

    filteredSales.forEach(s => {
      const d = parseTimestamp(s.createdAt || s.date);
      const key = parseDateKey(d);
      const amount = Number(s.totals?.total || s.total || 0);
      
      if (!dailyData[key]) dailyData[key] = 0;
      dailyData[key] += amount;
      totalRevenue += amount;
      totalSalesCount++;
    });

    // Grafikler için diziler
    const sortedDays = Object.keys(dailyData).sort();
    const revenueSeries = sortedDays.map(d => dailyData[d]);

    // 2. Trend Analizi (Regresyon)
    const { slope } = linearRegression(revenueSeries);
    const trendDirection = slope > 0 ? "up" : "down";

    // 3. Haftanın En İyi Günü Analizi (Seasonality)
    const dayPerformance = Array(7).fill(0); // 0: Pazar, 1: Pzt...
    const dayCounts = Array(7).fill(0);
    
    filteredSales.forEach(s => {
      const d = parseTimestamp(s.createdAt || s.date);
      if(d) {
        const dayIdx = d.getDay();
        dayPerformance[dayIdx] += Number(s.totals?.total || 0);
        dayCounts[dayIdx]++;
      }
    });

    const avgDayPerformance = dayPerformance.map((total, idx) => total / (dayCounts[idx] || 1));
    const bestDayIndex = avgDayPerformance.indexOf(Math.max(...avgDayPerformance));
    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

    // 4. ABC Analizi (Ürün Bazlı)
    const productRevenue = {};
    filteredSales.forEach(s => {
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach(item => {
        const pid = item.productId || item.name;
        const rev = (Number(item.price) || 0) * (Number(item.qty) || 0);
        productRevenue[pid] = (productRevenue[pid] || 0) + rev;
      });
    });

    const sortedProducts = Object.entries(productRevenue)
      .map(([id, rev]) => {
        const pName = products.find(p => p.id === id)?.name || id;
        return { id, name: pName, revenue: rev };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Kümülatif hesapla ve sınıflara ayır
    let accumulated = 0;
    const abcList = sortedProducts.map(p => {
      accumulated += p.revenue;
      const percentage = (accumulated / totalRevenue) * 100;
      let grade = 'C';
      if (percentage <= 80) grade = 'A';
      else if (percentage <= 95) grade = 'B';
      
      return { ...p, grade, percentage };
    });

    // 5. Tahmini Ay Sonu (Projection)
    const avgDaily = totalRevenue / DAYS_LOOKBACK;
    const projectedMonth = avgDaily * 30;

    return {
      totalRevenue,
      salesCount: totalSalesCount,
      chartLabels: sortedDays,
      chartData: revenueSeries,
      trend: { slope, direction: trendDirection },
      bestDay: dayNames[bestDayIndex],
      abc: {
        aItems: abcList.filter(x => x.grade === 'A'),
        bItems: abcList.filter(x => x.grade === 'B'),
        cItems: abcList.filter(x => x.grade === 'C'),
      },
      projectedMonth
    };

  }, [salesRaw, products]);

  // Grafik Ayarları
  const mainChartData = {
    labels: analysis.chartLabels,
    datasets: [
      {
        label: 'Günlük Ciro',
        data: analysis.chartData,
        borderColor: '#1f6feb',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(31, 111, 235, 0.2)');
          gradient.addColorStop(1, 'rgba(31, 111, 235, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4, // Eğri çizgi
        pointRadius: 2,
      }
    ]
  };

  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
      y: { grid: { color: '#f0f0f0' } }
    }
  };

  if (loading) {
    return <div className="adv-loading"><div className="adv-spinner"></div>Veriler analiz ediliyor...</div>;
  }

  return (
    <div className="adv-container">
      <div className="adv-header">
        <div>
          <h2 className="adv-title">İş Zekası Raporu</h2>
          <p className="adv-subtitle">Son 30 Günlük Yapay Zeka Destekli Analiz</p>
        </div>
        <div className="adv-badge">Canlı Veri</div>
      </div>

      {/* --- KPI KARTLARI --- */}
      <div className="adv-grid-3">
        <div className="adv-card highlight-blue">
          <div className="adv-card-label">Toplam Ciro (30 Gün)</div>
          <div className="adv-big-number">
            {analysis.totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
          </div>
          <div className="adv-trend">
            {analysis.trend.direction === 'up' ? '📈 Yükseliş Trendi' : '📉 Düşüş Eğilimi'}
          </div>
        </div>

        <div className="adv-card">
          <div className="adv-card-label">Tahmini Ay Sonu</div>
          <div className="adv-big-number">
            ~{analysis.projectedMonth.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
          </div>
          <div className="adv-desc">Mevcut performansa göre</div>
        </div>

        <div className="adv-card">
          <div className="adv-card-label">En Yoğun Gün</div>
          <div className="adv-big-number">{analysis.bestDay}</div>
          <div className="adv-desc">Ortalama satışın en yüksek olduğu gün</div>
        </div>
      </div>

      {/* --- GRAFİK ALANI --- */}
      <div className="adv-card graph-container">
        <div className="adv-card-header">
          <h4>Satış Trendi</h4>
          <span className="adv-tag">Günlük</span>
        </div>
        <div className="chart-wrapper">
          <Line data={mainChartData} options={mainChartOptions} />
        </div>
      </div>

      {/* --- ABC ANALİZİ ve ÖNERİLER --- */}
      <div className="adv-grid-2">
        
        {/* ABC ANALİZİ */}
        <div className="adv-card">
          <div className="adv-card-header">
            <h4>ABC Ürün Analizi</h4>
            <span className="adv-info-icon" title="A: Cironun %80'ini yapanlar, B: %15, C: %5">?</span>
          </div>
          <div className="abc-container">
            <div className="abc-group">
              <div className="abc-header a-grade">
                <span>A Sınıfı (Yıldızlar)</span>
                <span>{analysis.abc.aItems.length} Ürün</span>
              </div>
              <div className="abc-list">
                {analysis.abc.aItems.slice(0, 5).map(p => (
                  <div key={p.id} className="abc-item">
                    <span>{p.name}</span>
                    <strong>{p.revenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}</strong>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="abc-stats">
              <div className="abc-stat-box">
                <span className="grade b-grade">B</span>
                <small>{analysis.abc.bItems.length} Ürün (Standart)</small>
              </div>
              <div className="abc-stat-box">
                <span className="grade c-grade">C</span>
                <small>{analysis.abc.cItems.length} Ürün (Düşük Hacim)</small>
              </div>
            </div>
          </div>
        </div>

        {/* AKILLI ÖNERİLER */}
        <div className="adv-card">
          <div className="adv-card-header">
            <h4>Akıllı Asistan Önerileri</h4>
          </div>
          <div className="adv-suggestions">
            <ul className="suggestion-list">
              {analysis.trend.direction === 'down' && (
                <li className="warning">
                  ⚠️ Satışlarda düşüş eğilimi var. Son günlerdeki cirolar ortalamanın altında. Kampanya yapmayı düşünebilirsin.
                </li>
              )}
              {analysis.bestDay && (
                <li className="info">
                  💡 <strong>{analysis.bestDay}</strong> günleri senin en bereketli günlerin. Stoklarını bugüne özel hazırlıklı tut.
                </li>
              )}
              {analysis.abc.cItems.length > 5 && (
                <li className="info">
                  📦 C Sınıfı (Az satan) {analysis.abc.cItems.length} farklı ürünün var. Bunları eritmek için indirim yapabilirsin.
                </li>
              )}
              {analysis.abc.aItems.length < 3 && (
                <li className="danger">
                  🚨 Cironun büyük kısmı sadece {analysis.abc.aItems.length} ürüne bağlı. Riskli durum, ürün çeşitliliğini artır.
                </li>
              )}
              <li className="success">
                ✅ Toplam {analysis.salesCount} adet satış işlemi analiz edildi. Veri akışı sağlıklı.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

