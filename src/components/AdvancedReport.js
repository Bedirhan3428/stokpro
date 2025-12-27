import "../styles/AdvancedReport.css";
import React, { useEffect, useMemo, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  listSales,
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

// Doğrusal Regresyon
function linearRegression(y) {
  const x = y.map((_, i) => i);
  const n = y.length;
  if (n === 0) return { slope: 0, intercept: 0 };
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
  const [loading, setLoading] = useState(true);

  // Analiz periyodu
  const DAYS_LOOKBACK = 30;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        listSales(),
        listProductsForCurrentUser(),
      ]);
      setSalesRaw(Array.isArray(s) ? s : []);
      setProducts(Array.isArray(p) ? p : []);
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

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);

    // 1. Veri Hazırlığı
    const dailyData = {};
    let totalRevenue = 0;
    let totalSalesCount = 0;

    // Ürün İstatistikleri
    const productStats = {}; 
    
    products.forEach(p => {
      // Ürün yaşını hesapla (Gün cinsinden)
      const createdAt = parseTimestamp(p.createdAt) || new Date(0); // Tarih yoksa eski say
      const ageInDays = (today - createdAt) / (1000 * 60 * 60 * 24);

      productStats[p.id] = { 
        id: p.id,
        name: p.name, 
        stock: Number(p.stock || 0), 
        totalQty30: 0, 
        recentQty3: 0,
        revenue: 0,
        ageInDays: ageInDays // Yeni ürün kontrolü için
      };
    });

    // Satışları İşle
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

      // Ürün detaylarına in
      const items = Array.isArray(s.items) ? s.items : [];
      items.forEach(item => {
        const pid = item.productId;
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        
        if (productStats[pid]) {
            productStats[pid].totalQty30 += qty;
            productStats[pid].revenue += (qty * price);
            if (d >= threeDaysAgo) {
                productStats[pid].recentQty3 += qty;
            }
        }
      });
    });

    // --- GRUPLAMA VE FİLTRELEME ---
    
    // 1. Kritik Stok Listesi (< 10 veya 3 gün içinde bitecek)
    const criticalStockList = Object.values(productStats)
      .filter(p => {
        if (p.stock <= 0) return false; // Zaten bitmişleri sayma
        
        const dailyVelocity = p.totalQty30 / DAYS_LOOKBACK;
        const daysToDeplete = dailyVelocity > 0 ? p.stock / dailyVelocity : 999;
        
        // KURAL: Stok 10'dan azsa VEYA satış hızına göre 3 günde bitecekse
        return p.stock < 10 || daysToDeplete <= 3;
      })
      .sort((a, b) => a.stock - b.stock) // En az stoktan en çoka
      .slice(0, 5); // Sadece ilk 5

    // 2. Ölü Stok Listesi (Hiç satmamış ama yeni de değil)
    const deadStockList = Object.values(productStats)
      .filter(p => {
        // KURAL: Stokta var + Son 30 gün satmamış + En az 30 günlük ürün (yeni eklenen değil)
        return p.stock > 0 && p.totalQty30 === 0 && p.ageInDays > 30;
      })
      .sort((a, b) => b.stock - a.stock) // En çok stokta bekleyenden aza
      .slice(0, 5);

    // 3. Trend Listesi (Ani artış)
    const trendingList = Object.values(productStats)
      .filter(p => {
        const dailyVelocity = p.totalQty30 / DAYS_LOOKBACK;
        const expected3DaySales = dailyVelocity * 3;
        // KURAL: Son 3 günde 3'ten fazla satmış ve beklentinin %30 üzerinde
        return p.recentQty3 > 3 && p.recentQty3 > (expected3DaySales * 1.3);
      })
      .sort((a, b) => b.recentQty3 - a.recentQty3)
      .slice(0, 3);

    // 4. En İyi Gelir Getirenler (Top Performers)
    const topRevenueList = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);


    // Genel Grafik Verileri
    const sortedDays = Object.keys(dailyData).sort();
    const revenueSeries = sortedDays.map(d => dailyData[d]);
    const { slope } = linearRegression(revenueSeries);
    const trendDirection = slope > 0 ? "up" : "down";
    
    // En yoğun gün
    const dayPerformance = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);
    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    
    filteredSales.forEach(s => {
        const d = parseTimestamp(s.createdAt || s.date);
        if(d) {
            dayPerformance[d.getDay()] += Number(s.totals?.total || 0);
            dayCounts[d.getDay()]++;
        }
    });
    const avgDayPerformance = dayPerformance.map((t, i) => t / (dayCounts[i] || 1));
    const bestDayIndex = avgDayPerformance.indexOf(Math.max(...avgDayPerformance));

    const avgDaily = totalRevenue / DAYS_LOOKBACK;
    const projectedMonth = avgDaily * 30;

    return {
      totalRevenue,
      chartLabels: sortedDays,
      chartData: revenueSeries,
      trend: { direction: trendDirection },
      bestDay: dayNames[bestDayIndex],
      projectedMonth,
      // Yeni Listeler
      criticalStockList,
      deadStockList,
      trendingList,
      topRevenueList,
      salesCount: totalSalesCount
    };

  }, [salesRaw, products]);

  // Chart config
  const mainChartData = {
    labels: analysis.chartLabels,
    datasets: [{
      label: 'Ciro',
      data: analysis.chartData,
      borderColor: '#1f6feb',
      backgroundColor: 'rgba(31, 111, 235, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
    }]
  };
  
  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { grid: { color: '#f0f0f0' } } }
  };

  if (loading) return <div className="adv-loading">Veriler analiz ediliyor...</div>;

  return (
    <div className="adv-container">
      <div className="adv-header">
        <div>
          <h2 className="adv-title">İş Zekası Raporu</h2>
          <p className="adv-subtitle">Hoşgeldin Bedirhan, işte işletmenin durumu.</p>
        </div>
      </div>

      {/* KPI KARTLARI */}
      <div className="adv-grid-3">
        <div className="adv-card highlight-blue">
          <div className="adv-card-label">30 Günlük Ciro</div>
          <div className="adv-big-number">
            {analysis.totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="adv-card">
          <div className="adv-card-label">Tahmini Ay Sonu</div>
          <div className="adv-big-number">
            ~{analysis.projectedMonth.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="adv-card">
          <div className="adv-card-label">En Yoğun Gün</div>
          <div className="adv-big-number">{analysis.bestDay}</div>
        </div>
      </div>

      {/* GRAFİK */}
      <div className="adv-card graph-container">
        <div className="adv-card-header"><h4>Satış Grafiği</h4></div>
        <div className="chart-wrapper"><Line data={mainChartData} options={mainChartOptions} /></div>
      </div>

      {/* --- ANALİZ LİSTELERİ --- */}
      <div className="adv-grid-2">
        
        {/* KRİTİK STOKLAR (Sol Üst) */}
        <div className="adv-card">
          <div className="adv-card-header">
            <h4 style={{color: '#d93025'}}>🚨 Kritik Stok (Acil)</h4>
            <small>10 adetin altı veya hızlı bitenler</small>
          </div>
          {analysis.criticalStockList.length === 0 ? (
            <div className="empty-state">Stok durumu harika! Kritik ürün yok. ✅</div>
          ) : (
            <div className="list-group">
              {analysis.criticalStockList.map(p => (
                <div key={p.id} className="list-row critical-row">
                  <span className="row-name">{p.name}</span>
                  <span className="row-val bad-val">{p.stock} Adet</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TREND OLANLAR (Sağ Üst) */}
        <div className="adv-card">
          <div className="adv-card-header">
            <h4 style={{color: '#188038'}}>📈 Yükselen Yıldızlar</h4>
            <small>Son 3 günde talep patlaması</small>
          </div>
          {analysis.trendingList.length === 0 ? (
            <div className="empty-state">Ani bir satış sıçraması yok. Stabil.</div>
          ) : (
            <div className="list-group">
              {analysis.trendingList.map(p => (
                <div key={p.id} className="list-row trend-row">
                  <span className="row-name">{p.name}</span>
                  <span className="row-val good-val">+{p.recentQty3} Satış</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ÖLÜ STOKLAR (Sol Alt) */}
        <div className="adv-card">
          <div className="adv-card-header">
            <h4 style={{color: '#e37400'}}>📦 Ölü Stoklar</h4>
            <small>30+ gündür ekli ve hiç satmamış</small>
          </div>
          {analysis.deadStockList.length === 0 ? (
            <div className="empty-state">Raf bekleyen ürün yok. Süper! 🚀</div>
          ) : (
            <div className="list-group">
              {analysis.deadStockList.map(p => (
                <div key={p.id} className="list-row dead-row">
                  <span className="row-name">{p.name}</span>
                  <span className="row-val">{p.stock} Adet Bekliyor</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EN ÇOK GELİR GETİRENLER (Sağ Alt) */}
        <div className="adv-card">
          <div className="adv-card-header">
            <h4 style={{color: '#1a73e8'}}>🏆 Gelir Şampiyonları</h4>
            <small>Ciroya en çok katkı sağlayanlar</small>
          </div>
          <div className="list-group">
            {analysis.topRevenueList.map((p, idx) => (
              <div key={p.id} className="list-row">
                <span className="row-name">
                    <span className="rank-badge">{idx + 1}</span> {p.name}
                </span>
                <span className="row-val strong-val">
                  {p.revenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

