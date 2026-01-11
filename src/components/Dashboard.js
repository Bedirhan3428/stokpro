import React, { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, 
  FiAlertCircle, FiArrowUpRight, FiArrowDownLeft, FiActivity 
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
import "../utils/chartSetup";
import AdvancedReport from "./AdvancedReport";
import useSubscription from "../hooks/useSubscription";
import { bildirimIzniIste, bildirimGonder } from "../utils/notificationHelper";
import "../styles/Dashboard.css";

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
function labelForLedgerEntry(l) {
  const desc = (l.description || "").toString();
  const lines = Array.isArray(l.lines) ? l.lines : [];
  const isCredit = lines.some((ln) => String(ln.account || "").startsWith("AR:"));
  if (desc.toLowerCase().startsWith("satış") || desc.toLowerCase().startsWith("sale")) {
    return isCredit ? "Satış (Veresiye)" : "Satış (Nakit)";
  }
  return desc || `İşlem ${l.type || ""}`;
}

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]); 
  const [ledger, setLedger] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerPaymentsMap, setCustomerPaymentsMap] = useState({});
  const [legacyIncomes, setLegacyIncomes] = useState([]);
  const [legacyExpenses, setLegacyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { loading: subLoading, active: subActive } = useSubscription();

  // --- VERİ ÇEKME & BİLDİRİM ---
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [salesData, ledgerData, customersData, legacyInc, legacyExp, productsData] = await Promise.all([
          listSales(),
          listLedger(),
          listCustomers(),
          listLegacyIncomes(),
          listLegacyExpenses(),
          listProductsForCurrentUser()
        ]);

        if (!mounted) return;
        setSales(Array.isArray(salesData) ? salesData : []);
        setLedger(Array.isArray(ledgerData) ? ledgerData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setLegacyIncomes(Array.isArray(legacyInc) ? legacyInc : []);
        setLegacyExpenses(Array.isArray(legacyExp) ? legacyExp : []);
        setProducts(Array.isArray(productsData) ? productsData : []);

        // Stok Bildirim Kontrolü
        await bildirimIzniIste();
        const kritikUrunler = (productsData || []).filter(p => Number(p.stock) < 10);
        if (kritikUrunler.length > 0) {
          const sonBildirimZamani = localStorage.getItem("sonStokBildirimi");
          const suAn = Date.now();
          const beklemeSuresi = 12 * 60 * 60 * 1000; 

          if (!sonBildirimZamani || (suAn - sonBildirimZamani > beklemeSuresi)) {
            const ornekUrun = kritikUrunler[0].name;
            const kalanSayi = kritikUrunler.length - 1;
            let mesaj = kalanSayi > 0 
              ? `⚠️ ${ornekUrun} ve ${kalanSayi} diğer ürün kritik seviyede!`
              : `⚠️ ${ornekUrun} tükeniyor!`;
            
            bildirimGonder("Kritik Stok", mesaj);
            localStorage.setItem("sonStokBildirimi", suAn);
          }
        }

        const paymentsMap = {};
        await Promise.all(
          (Array.isArray(customersData) ? customersData : []).map(async (c) => {
            try {
              const payments = await listCustomerPayments(c.id);
              paymentsMap[c.id] = Array.isArray(payments) ? payments : [];
            } catch {
              paymentsMap[c.id] = [];
            }
          })
        );
        if (!mounted) return;
        setCustomerPaymentsMap(paymentsMap);
      } catch (err) {
        if (mounted) setError(String(err?.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // --- HESAPLAMALAR ---
  const last30 = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);

  function sumSalesInRange(salesArray, since, includeCredit = false) {
    let total = 0;
    for (const s of salesArray || []) {
      const d = parseTimestamp(s.createdAt ?? s.date ?? s.created_at);
      if (!d || d < since) continue;
      const saleType = (s.saleType ?? s.type ?? "").toString().toLowerCase();
      if (!includeCredit && (saleType === "credit" || saleType === "veresiye")) continue;
      total += parseNumber(s.totals?.total ?? s.total ?? s.totalPrice ?? 0);
    }
    return total;
  }

  function sumLegacyData(dataArray, since) {
    let total = 0;
    for (const item of dataArray || []) {
      const d = parseTimestamp(item.createdAt ?? item.date ?? item.created_at ?? item.createdOn);
      if (!d || d < since) continue;
      total += parseNumber(item.amount ?? item.value ?? item.total ?? 0);
    }
    return total;
  }

  function sumPayments(since) {
    let total = 0;
    for (const custId of Object.keys(customerPaymentsMap || {})) {
      const payments = customerPaymentsMap[custId] || [];
      for (const p of payments) {
        const d = parseTimestamp(p.createdAt ?? p.date ?? p.created_at);
        if (!d || d < since) continue;
        total += parseNumber(p.amount ?? p.value ?? p.total ?? 0);
      }
    }
    return total;
  }

  // Aylık Veriler
  const stats = useMemo(() => {
    const cashSales = sumSalesInRange(sales, last30, false);
    const legacyInc = sumLegacyData(legacyIncomes, last30);
    const payments = sumPayments(last30);
    const legacyExp = sumLegacyData(legacyExpenses, last30);

    const totalRevenue = cashSales + legacyInc + payments;
    const totalExpense = legacyExp;
    const netProfit = totalRevenue - totalExpense;

    const totalReceivable = (customers || []).reduce((acc, c) => acc + parseNumber(c.balance ?? c.debt ?? 0), 0);

    return { totalRevenue, totalExpense, netProfit, totalReceivable, cashSales, legacyInc, payments };
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, customers, last30]);

  // Kategori Dağılımı
  const categoryStats = useMemo(() => {
    const tempStats = {};
    if (!sales.length || !products.length) return [];
    sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cat = product?.category || "Diğer";
        tempStats[cat] = (tempStats[cat] || 0) + ((Number(item.price) || 0) * (Number(item.qty) || 0));
      });
    });
    const sorted = Object.entries(tempStats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const total = sorted.reduce((a, b) => a + b.value, 0);
    return sorted.map(s => ({ ...s, percent: total > 0 ? ((s.value / total) * 100).toFixed(1) : 0 }));
  }, [sales, products]);

  // Son İşlemler
  const recentTransactions = useMemo(() => {
    const list = [];
    sales.forEach(s => list.push({
      id: s.id, type: "sale", date: parseTimestamp(s.createdAt), 
      amount: parseNumber(s.totals?.total), label: "Satış", sub: (s.saleType === "credit" ? "Veresiye" : "Nakit")
    }));
    legacyExpenses.forEach(e => list.push({
      id: e.id, type: "expense", date: parseTimestamp(e.createdAt), 
      amount: parseNumber(e.amount), label: e.description || "Gider", sub: "Manuel Gider"
    }));
    Object.keys(customerPaymentsMap).forEach(cid => {
      customerPaymentsMap[cid].forEach(p => {
        const cName = customers.find(c => String(c.id) === String(cid))?.name || "Müşteri";
        list.push({
          id: p.id, type: "payment", date: parseTimestamp(p.createdAt), 
          amount: parseNumber(p.amount), label: "Tahsilat", sub: cName
        });
      });
    });
    return list.filter(i => i.date).sort((a, b) => b.date - a.date).slice(0, 8);
  }, [sales, legacyExpenses, customerPaymentsMap, customers]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

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
      
      {/* ABONELİK UYARISI */}
      {!subLoading && !subActive && (
        <div className="alert-banner">
          <div className="alert-content">
            <FiAlertCircle className="alert-icon" />
            <span>Hesabınız kısıtlı modda. Tüm özellikleri kullanmak için aboneliği aktifleştirin.</span>
          </div>
          <a href="https://www.stokpro.shop/product-key" className="alert-btn">Ücretsiz Etkinleştir</a>
        </div>
      )}

      {/* ÜST BÖLÜM: KPI KARTLARI */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="icon-wrapper blue"><FiTrendingUp /></div>
          <div className="kpi-info">
            <span className="kpi-label">Aylık Toplam Gelir</span>
            <h3 className="kpi-value">{stats.totalRevenue.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="icon-wrapper red"><FiTrendingDown /></div>
          <div className="kpi-info">
            <span className="kpi-label">Aylık Toplam Gider</span>
            <h3 className="kpi-value">{stats.totalExpense.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="icon-wrapper green"><FiDollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-label">Net Kar (Ay)</span>
            <h3 className="kpi-value">{stats.netProfit.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="icon-wrapper purple"><FiUsers /></div>
          <div className="kpi-info">
            <span className="kpi-label">Toplam Alacak (Veresiye)</span>
            <h3 className="kpi-value">{stats.totalReceivable.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</h3>
          </div>
        </div>
      </section>

      {/* ORTA BÖLÜM: GRAFİK VE DETAYLAR */}
      <section className="main-grid">
        
        {/* SOL: GELİR DAĞILIMI */}
        <div className="content-card chart-card">
          <div className="card-header">
            <h4>Gelir Dağılımı</h4>
          </div>
          <div className="chart-wrapper">
             <Doughnut 
               data={donutData} 
               options={{ 
                 responsive: true, 
                 maintainAspectRatio: false, 
                 plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
                 cutout: '70%'
               }} 
             />
          </div>
        </div>

        {/* SAĞ: KATEGORİLER */}
        <div className="content-card">
          <div className="card-header">
            <h4>Kategori Satışları</h4>
          </div>
          <div className="category-list">
            {categoryStats.length === 0 && <p className="empty-text">Veri yok.</p>}
            {categoryStats.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="category-item">
                <div className="cat-info">
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-amount">{cat.value.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} ₺</span>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${cat.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALT BÖLÜM: SON İŞLEMLER */}
      <section className="content-card full-width">
        <div className="card-header">
          <h4>Son İşlemler</h4>
          <Link to="/reports" className="view-all">Tümünü Gör</Link>
        </div>
        <div className="transaction-list">
          {recentTransactions.length === 0 && <p className="empty-text">Henüz işlem yok.</p>}
          {recentTransactions.map((t) => (
            <div key={t.id} className="transaction-item">
              <div className={`trans-icon ${t.type === 'expense' ? 'red' : 'green'}`}>
                {t.type === 'expense' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
              </div>
              <div className="trans-details">
                <span className="trans-title">{t.label}</span>
                <span className="trans-sub">{t.sub} • {t.date.toLocaleDateString()}</span>
              </div>
              <div className={`trans-amount ${t.type === 'expense' ? 'negative' : 'positive'}`}>
                {t.type === 'expense' ? '-' : '+'}{t.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DETAYLI RAPOR COMPONENTI */}
      <div className="advanced-report-section">
        <AdvancedReport />
      </div>

    </div>
  );
}

