import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate eklendi
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, 
  FiAlertCircle, FiArrowUpRight, FiArrowDownLeft, FiPlusCircle, FiPackage
} from "react-icons/fi";

import {
  listSales,
  listLedger,
  listCustomers,
  listCustomerPayments,
  listLegacyIncomes,
  listLegacyExpenses
} from "../utils/firebaseHelpers";
import { listProductsForCurrentUser } from "../utils/artifactUserProducts"; 
import AdvancedReport from "./AdvancedReport";
import useSubscription from "../hooks/useSubscription";
import { bildirimIzniIste, bildirimGonder } from "../utils/notificationHelper";
import "../styles/Dashboard.css";

// --- GRAFİK MODÜLLERİNİ KAYDET ---
ChartJS.register(ArcElement, Tooltip, Legend);

// --- YARDIMCI FONKSİYONLAR ---
function parseTimestamp(createdAt) {
  if (!createdAt) return null;
  if (typeof createdAt === "object" && typeof createdAt.toDate === "function") return createdAt.toDate();
  if (typeof createdAt === "object" && createdAt.seconds) return new Date(createdAt.seconds * 1000);
  const d = new Date(createdAt);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function Dashboard() {
  const navigate = useNavigate(); // Yönlendirme için
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]); 
  const [customers, setCustomers] = useState([]);
  const [customerPaymentsMap, setCustomerPaymentsMap] = useState({});
  const [legacyIncomes, setLegacyIncomes] = useState([]);
  const [legacyExpenses, setLegacyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Abonelik Kontrolü
  let subLoading = false;
  let subActive = true;
  try {
    const sub = useSubscription();
    subLoading = sub.loading;
    subActive = sub.active;
  } catch (e) { console.warn(e); }

  // --- VERİ ÇEKME ---
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [salesData, ledgerData, customersData, legacyInc, legacyExp, productsData] = await Promise.all([
          listSales().catch(() => []),
          listLedger().catch(() => []),
          listCustomers().catch(() => []),
          listLegacyIncomes().catch(() => []),
          listLegacyExpenses().catch(() => []),
          listProductsForCurrentUser().catch(() => [])
        ]);

        if (!mounted) return;

        setSales(Array.isArray(salesData) ? salesData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setLegacyIncomes(Array.isArray(legacyInc) ? legacyInc : []);
        setLegacyExpenses(Array.isArray(legacyExp) ? legacyExp : []);
        setProducts(Array.isArray(productsData) ? productsData : []);

        // Stok Bildirim
        try {
            await bildirimIzniIste();
            const kritikUrunler = (productsData || []).filter(p => Number(p.stock) < 10);
            if (kritikUrunler.length > 0) {
              const sonBildirim = localStorage.getItem("sonStokBildirimi");
              const suAn = Date.now();
              if (!sonBildirim || (suAn - sonBildirim > 43200000)) {
                 bildirimGonder("Stok Uyarısı", `${kritikUrunler.length} ürünün stoğu kritik seviyede.`);
                 localStorage.setItem("sonStokBildirimi", suAn);
              }
            }
        } catch (err) { console.log(err); }

        // Ödemeler
        const paymentsMap = {};
        if (Array.isArray(customersData)) {
            for (const c of customersData) {
                try {
                    const pays = await listCustomerPayments(c.id);
                    paymentsMap[c.id] = Array.isArray(pays) ? pays : [];
                } catch { paymentsMap[c.id] = []; }
            }
        }
        if (mounted) setCustomerPaymentsMap(paymentsMap);

      } catch (err) {
        if (mounted) setError("Veri yüklenirken hata oluştu.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // --- HESAPLAMALAR ---
  const last30 = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);

  const stats = useMemo(() => {
    let cashSales = 0;
    (sales || []).forEach(s => {
       const d = parseTimestamp(s.createdAt || s.date);
       if(d && d >= last30 && (s.saleType !== 'credit' && s.saleType !== 'veresiye')) {
           cashSales += parseNumber(s.totals?.total || s.total || 0);
       }
    });

    let legacyInc = 0;
    (legacyIncomes || []).forEach(i => {
        const d = parseTimestamp(i.createdAt || i.date);
        if(d && d >= last30) legacyInc += parseNumber(i.amount || 0);
    });

    let legacyExp = 0;
    (legacyExpenses || []).forEach(e => {
        const d = parseTimestamp(e.createdAt || e.date);
        if(d && d >= last30) legacyExp += parseNumber(e.amount || 0);
    });

    let payments = 0;
    Object.values(customerPaymentsMap).forEach(list => {
        (list || []).forEach(p => {
            const d = parseTimestamp(p.createdAt || p.date);
            if(d && d >= last30) payments += parseNumber(p.amount || 0);
        });
    });

    const totalRevenue = cashSales + legacyInc + payments;
    const totalReceivable = (customers || []).reduce((acc, c) => acc + parseNumber(c.balance || c.debt || 0), 0);
    const netProfit = totalRevenue - legacyExp;

    return { totalRevenue, totalExpense: legacyExp, netProfit, totalReceivable, cashSales, legacyInc, payments };
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, customers, last30]);

  // Son İşlemler
  const recentTransactions = useMemo(() => {
    const list = [];
    (sales || []).forEach(s => list.push({
      id: s.id, type: 'sale', date: parseTimestamp(s.createdAt), 
      amount: parseNumber(s.totals?.total || s.total), label: "Satış", sub: s.saleType === 'credit' ? 'Veresiye' : 'Nakit'
    }));
    (legacyExpenses || []).forEach(e => list.push({
      id: e.id, type: 'expense', date: parseTimestamp(e.createdAt), 
      amount: parseNumber(e.amount), label: e.description || "Gider", sub: "Manuel"
    }));
    return list.filter(i => i.date).sort((a, b) => b.date - a.date).slice(0, 8);
  }, [sales, legacyExpenses]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Yükleniyor...</p></div>;
  if (error) return <div className="error-screen">{error}</div>;

  const donutData = {
    labels: ["Nakit Satış", "Tahsilat", "Ek Gelir"],
    datasets: [{
      data: [stats.cashSales, stats.payments, stats.legacyInc],
      backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6"],
      borderWidth: 0
    }]
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h2>Genel Bakış</h2>
        <span className="date-badge">Son 30 Gün</span>
      </div>

      {/* --- YENİ KULLANICI KARŞILAMA KARTI (SADECE ÜRÜN YOKSA GÖZÜKÜR) --- */}
      {!loading && products.length === 0 && (
        <div className="welcome-card">
          <div className="welcome-content">
             <div className="welcome-icon-box">
                <FiPackage />
             </div>
             <div className="welcome-text">
                <h3>Hadi Başlayalım! 🚀</h3>
                <p>Henüz envanterin boş görünüyor. İstatistiklerini görebilmek için ilk ürününü ekleyerek işe koyulalım.</p>
             </div>
          </div>
          <button className="welcome-btn" onClick={() => navigate('/products')}>
             <FiPlusCircle /> İlk Ürünü Ekle
          </button>
        </div>
      )}

      {/* ABONELİK UYARISI */}
      {!subLoading && !subActive && (
        <div className="alert-banner">
          <FiAlertCircle size={20} />
          <span>Hesabınız kısıtlı. Tüm özellikleri açmak için:</span>
          <a href="https://www.stokpro.shop/product-key" className="alert-link">Ücretsiz Etkinleştir</a>
        </div>
      )}

      {/* KPI KARTLARI */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="icon-box blue"><FiTrendingUp /></div>
            <span className="kpi-title">Toplam Gelir</span>
          </div>
          <div className="kpi-body">
            <h3>{stats.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</h3>
            <p className="kpi-sub">Satış + Tahsilat</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="icon-box red"><FiTrendingDown /></div>
            <span className="kpi-title">Toplam Gider</span>
          </div>
          <div className="kpi-body">
            <h3>{stats.totalExpense.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</h3>
            <p className="kpi-sub">Manuel Giderler</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="icon-box green"><FiDollarSign /></div>
            <span className="kpi-title">Net Kazanç</span>
          </div>
          <div className="kpi-body">
            <h3>{stats.netProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</h3>
            <p className="kpi-sub">Gelir - Gider</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="icon-box purple"><FiUsers /></div>
            <span className="kpi-title">Alacaklar</span>
          </div>
          <div className="kpi-body">
            <h3>{stats.totalReceivable.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</h3>
            <p className="kpi-sub">Müşteri Bakiyeleri</p>
          </div>
        </div>
      </section>

      {/* GRAFİK VE LİSTE */}
      <section className="main-content">
        <div className="chart-section card">
          <div className="card-head">
            <h4>Gelir Kaynakları</h4>
          </div>
          <div className="chart-wrapper">
             {stats.totalRevenue > 0 ? (
                <Doughnut 
                  data={donutData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { position: 'bottom' } } 
                  }} 
                />
             ) : (
               <p className="no-data">Görüntülenecek gelir verisi yok.</p>
             )}
          </div>
        </div>

        <div className="transactions-section card">
          <div className="card-head">
            <h4>Son İşlemler</h4>
            <Link to="/reports" className="see-all">Tümü</Link>
          </div>
          <div className="trans-list">
            {recentTransactions.map(t => (
              <div key={t.id} className="trans-item">
                <div className={`trans-icon ${t.type === 'expense' ? 'bg-red' : 'bg-green'}`}>
                  {t.type === 'expense' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                </div>
                <div className="trans-info">
                  <span className="trans-name">{t.label}</span>
                  <span className="trans-date">{t.sub} • {t.date?.toLocaleDateString()}</span>
                </div>
                <div className={`trans-amount ${t.type === 'expense' ? 'txt-red' : 'txt-green'}`}>
                  {t.type === 'expense' ? '-' : '+'}{t.amount.toLocaleString("tr-TR")} ₺
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && <p className="no-data">Henüz işlem yok.</p>}
          </div>
        </div>
      </section>

      <div className="report-wrapper">
        <AdvancedReport />
      </div>

    </div>
  );
}


