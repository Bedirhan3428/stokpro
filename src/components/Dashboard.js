import "../styles/Dashboard.css";
import React, { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import {
  listSales,
  listLedger,
  listCustomers,
  listCustomerPayments,
  listLegacyIncomes,
  listLegacyExpenses,
  getUserProfile
} from "../utils/firebaseHelpers";
import { listProductsForCurrentUser } from "../utils/artifactUserProducts"; 
import "../utils/chartSetup";
import AdvancedReport from "./AdvancedReport";
import useSubscription from "../hooks/useSubscription";
import { auth } from "../firebase";

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
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]); 
  const [ledger, setLedger] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerPaymentsMap, setCustomerPaymentsMap] = useState({});
  const [legacyIncomes, setLegacyIncomes] = useState([]);
  const [legacyExpenses, setLegacyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userName, setUserName] = useState("");
  const [isTrialEligible, setIsTrialEligible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const { loading: subLoading, active: subActive } = useSubscription();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const uid = auth.currentUser?.uid;

        const [salesData, ledgerData, customersData, legacyInc, legacyExp, productsData, userProfile] = await Promise.all([
          listSales(),
          listLedger(),
          listCustomers(),
          listLegacyIncomes(),
          listLegacyExpenses(),
          listProductsForCurrentUser(),
          uid ? getUserProfile(uid) : Promise.resolve(null)
        ]);

        if (!mounted) return;

        setSales(Array.isArray(salesData) ? salesData : []);
        setLedger(Array.isArray(ledgerData) ? ledgerData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setLegacyIncomes(Array.isArray(legacyInc) ? legacyInc : []);
        setLegacyExpenses(Array.isArray(legacyExp) ? legacyExp : []);
        setProducts(Array.isArray(productsData) ? productsData : []);

        if (userProfile) {
          setUserName(userProfile.name || "Kullanıcı");
          const createdAt = parseTimestamp(userProfile.createdAt) || new Date();
          const now = new Date();
          const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
          setIsTrialEligible(diffDays < 14);
        }

        if ((!productsData || productsData.length === 0)) {
          setShowWelcome(true);
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

  const last7 = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const last30 = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);

  function sumSalesInRange(salesArray, since, includeCredit = false) {
    let total = 0;
    let count = 0;
    for (const s of salesArray || []) {
      const d = parseTimestamp(s.createdAt ?? s.date ?? s.created_at);
      if (!d || d < since) continue;
      const saleType = (s.saleType ?? s.type ?? "").toString().toLowerCase();
      if (!includeCredit && (saleType === "credit" || saleType === "veresiye")) continue;
      total += parseNumber(s.totals?.total ?? s.total ?? s.totalPrice ?? 0);
      count += 1;
    }
    return { total, count };
  }

  function sumCustomerPaymentsInRange(since) {
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

  function sumLegacyIncomesInRange(since) {
    let total = 0;
    for (const i of legacyIncomes || []) {
      const d = parseTimestamp(i.createdAt ?? i.date ?? i.created_at ?? i.createdOn ?? i.timestamp);
      if (!d || d < since) continue;
      total += parseNumber(i.amount ?? i.value ?? i.totalPrice ?? i.total ?? 0);
    }
    return total;
  }
  function sumLegacyExpensesInRange(since) {
    let total = 0;
    for (const e of legacyExpenses || []) {
      const d = parseTimestamp(e.createdAt ?? e.date ?? e.created_at ?? e.createdOn ?? e.timestamp);
      if (!d || d < since) continue;
      total += parseNumber(e.amount ?? e.value ?? e.totalPrice ?? e.total ?? 0);
    }
    return total;
  }

  const totalCustomerDebt = useMemo(() => {
    return (customers || []).reduce((s, c) => s + parseNumber(c.balance ?? c.debt ?? 0), 0);
  }, [customers]);

  const weekly = useMemo(() => {
    const cash = sumSalesInRange(sales, last7, false);
    const cashAll = sumSalesInRange(sales, last7, true);
    const creditAmount = Math.max(0, cashAll.total - cash.total);
    const legacyIncome = sumLegacyIncomesInRange(last7);
    const legacyExpense = sumLegacyExpensesInRange(last7);
    const customerPayments = sumCustomerPaymentsInRange(last7);
    const incomeWithoutPayments = cash.total + legacyIncome;
    const expensesTotal = legacyExpense;
    return {
      cashSales: cash.total,
      creditSales: creditAmount,
      legacyIncome,
      legacyExpense,
      customerPayments,
      incomeWithoutPayments,
      expensesTotal,
    };
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, last7]);

  const monthly = useMemo(() => {
    const cash = sumSalesInRange(sales, last30, false);
    const cashAll = sumSalesInRange(sales, last30, true);
    const creditAmount = Math.max(0, cashAll.total - cash.total);
    const legacyIncome = sumLegacyIncomesInRange(last30);
    const legacyExpense = sumLegacyExpensesInRange(last30);
    const customerPayments = sumCustomerPaymentsInRange(last30);
    const incomeWithoutPayments = cash.total + legacyIncome;
    const incomeWithPayments = incomeWithoutPayments + customerPayments;
    const expensesTotal = legacyExpense;
    const profitLoss = incomeWithPayments - expensesTotal;
    return {
      cashSales: cash.total,
      creditSales: creditAmount,
      legacyIncome,
      legacyExpense,
      customerPayments,
      incomeWithoutPayments,
      expensesTotal,
      profitLoss
    };
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, last30]);

  const categoryStats = useMemo(() => {
    const stats = {};
    if (!sales.length || !products.length) return [];
    sales.forEach(sale => {
      const items = Array.isArray(sale.items) ? sale.items : [];
      items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cat = product?.category || "Diğer";
        const total = (Number(item.price) || 0) * (Number(item.qty) || 0);
        stats[cat] = (stats[cat] || 0) + total;
      });
    });
    const sorted = Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const grandTotal = sorted.reduce((acc, curr) => acc + curr.value, 0);
    return sorted.map(s => ({
      ...s,
      percent: grandTotal > 0 ? ((s.value / grandTotal) * 100).toFixed(1) : 0
    }));
  }, [sales, products]);

  const recentTransactions = useMemo(() => {
    const txs = [];
    for (const s of sales || []) {
      const d = parseTimestamp(s.createdAt ?? s.date ?? s.created_at);
      txs.push({
        id: `sale_${s.id}`,
        kind: ((s.saleType ?? s.type) || "sale").toString(),
        date: d,
        amount: parseNumber(s.totals?.total ?? s.total ?? 0),
        label: (s.saleType ?? "").toString().toLowerCase() === "credit" ? "Veresiye Satış" : "Satış",
        raw: s
      });
    }
    for (const inc of legacyIncomes || []) {
      const d = parseTimestamp(inc.createdAt ?? inc.date ?? inc.created_at ?? inc.createdOn);
      txs.push({
        id: `legacy_inc_${inc.id}`,
        kind: "manual_income",
        date: d,
        amount: parseNumber(inc.amount ?? inc.value ?? inc.totalPrice ?? inc.total ?? 0),
        label: inc.description || "Ek Gelir",
        raw: inc
      });
    }
    for (const exp of legacyExpenses || []) {
      const d = parseTimestamp(exp.createdAt ?? exp.date ?? exp.created_at ?? exp.createdOn);
      txs.push({
        id: `legacy_exp_${exp.id}`,
        kind: "manual_expense",
        date: d,
        amount: parseNumber(exp.amount ?? exp.value ?? exp.totalPrice ?? exp.total ?? 0),
        label: exp.description || "Gider",
        isExpense: true,
        raw: exp
      });
    }
    for (const custId of Object.keys(customerPaymentsMap || {})) {
      for (const p of customerPaymentsMap[custId] || []) {
        const d = parseTimestamp(p.createdAt ?? p.date ?? p.created_at);
        const cust = (customers || []).find((c) => String(c.id) === String(custId));
        const customerLabel = cust ? `${cust.name}` : String(custId);
        txs.push({
          id: `pay_${custId}_${p.id ?? Math.random()}`,
          kind: "customer_payment",
          date: d,
          amount: parseNumber(p.amount ?? p.value ?? p.total ?? 0),
          label: `Tahsilat (${customerLabel})`,
          customerId: custId,
          raw: p
        });
      }
    }
    return txs.filter((t) => t.date).sort((a, b) => b.date - a.date).slice(0, 20);
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, customers]);

  if (loading) {
    return (
      <div className="dash-kart">
        <div className="dash-yukleme"><div className="dash-spinner" /><p>Yükleniyor...</p></div>
      </div>
    );
  }

  const donutData = {
    labels: ["Satışlar (Nakit)", "Ek Gelirler", "Tahsilatlar", "Giderler"],
    datasets: [
      {
        data: [monthly.cashSales || 0, monthly.legacyIncome || 0, monthly.customerPayments || 0, monthly.legacyExpense || 0],
        backgroundColor: ["#1f6feb", "#34d399", "#60a5fa", "#ef4444"],
        borderColor: "transparent"
      }
    ]
  };

  return (
    <div className="dash-sayfa">
       {/* --- POPUP --- */}
       {showWelcome && !loading && (
        <div className="dash-kart welcome-box">
          <button onClick={() => setShowWelcome(false)} className="close-btn">×</button>
          <h4>Hoş geldin {userName}! 👋</h4>
          <p>Hadi ilk ürününü ekleyerek işe koyulalım!</p>
          <button onClick={() => navigate('/products')} className="action-btn">Ürün Ekle</button>
        </div>
      )}

       {/* --- ABONELİK UYARISI --- */}
       {!subLoading && !subActive && (
          <div className={`acc-uyari-kutu ${isTrialEligible ? 'trial-box' : 'subscription-box'}`}>
            <div className={`acc-uyari-baslik ${isTrialEligible ? 'trial-eligible' : 'subscription-required'}`}>
              {isTrialEligible ? "Ücretsiz Deneme Fırsatı" : "Abonelik Gerekli"}
            </div>
            <div className="acc-yazi-ince">
              <a href="https://www.stokpro.shop/product-key" className={`acc-action-link ${isTrialEligible ? 'trial-link' : 'subscription-link'}`}>
                {isTrialEligible ? "Şimdi Ücretsiz Dene" : "Satın Al"}
              </a>
            </div>
          </div>
      )}

      <h3 className="dash-baslik">Genel Bakış</h3>
      {error && <div className="dash-hata">Hata: {error}</div>}

      <div className="dash-metrik-grid">
        <div className="dash-kart">
          <div className="dash-etiket">Haftalık Gelir</div>
          <div className="dash-deger highlight">
            {((weekly.cashSales || 0) + (weekly.legacyIncome || 0)).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
          <div className="dash-alt">
            Nakit Satış: {(weekly.cashSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
            <br/>
            Ek Gelir: {(weekly.legacyIncome || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
        </div>

        <div className="dash-kart">
          {/* GİDER YAZISI BELİRGİN VE KIRMIZI */}
          <div className="dash-etiket expense-label">Haftalık Giderler</div>
          <div className="dash-deger expense-value">
            {(weekly.expensesTotal || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
        </div>

        <div className="dash-kart">
          <div className="dash-etiket">Haftalık Tahsilat</div>
          <div className="dash-deger">{(weekly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="dash-kart">
          <div className="dash-etiket">Toplam Alacak</div>
          <div className="dash-deger">{totalCustomerDebt.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
          <div className="dash-alt">{(customers || []).length} kayıtlı müşteri</div>
        </div>
      </div>

      <div className="dash-kart">
        <h4 className="dash-etiket-buyuk">Bu Ayın Özeti</h4>
        <div className="dash-aylik-grid">
          <div className="dash-aylik-sol">
            <div className="dash-iki">
              <div className="dash-mini-kart">
                <div className="dash-etiket">Nakit Satış</div>
                <div className="dash-kalin">{(monthly.cashSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
              <div className="dash-mini-kart">
                <div className="dash-etiket">Ek Gelirler</div>
                <div className="dash-kalin">{(monthly.legacyIncome || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
              <div className="dash-mini-kart">
                <div className="dash-etiket">Tahsilatlar</div>
                <div className="dash-kalin">{(monthly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
              {/* MİNİ KARTTA GİDERLER VURGULU */}
              <div className="dash-mini-kart expense-card-border">
                <div className="dash-etiket expense-label-mini">Giderler</div>
                <div className="dash-kalin expense-value-mini">{(monthly.legacyExpense || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>

              <div className="dash-buyuk-kart">
                <div className="dash-etiket">Toplam Gelir</div>
                <div className="dash-deger">
                  {(monthly.incomeWithoutPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </div>
                <div className="dash-alt">Giderler: <span className="expense-text">{(monthly.expensesTotal || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span></div>
                <div className="dash-kalin" style={{marginTop: '8px', color: monthly.profitLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}}>
                  Kar/Zarar: {(monthly.profitLoss || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </div>
              </div>
            </div>
          </div>

          <div className="dash-aylik-sag">
            <div className="dash-donut">
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: '#9ca3af' } } } }} />
            </div>
          </div>
        </div>
      </div>

      {categoryStats.length > 0 && (
        <div className="dash-kart">
          <h4 className="dash-etiket-buyuk">Kategori Satışları</h4>
          <div className="cat-list">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="cat-item">
                <div className="cat-name">{cat.name}</div>
                <div className="cat-bar-bg">
                  <div className="cat-bar-fill" style={{ width: `${cat.percent}%` }}></div>
                </div>
                <div className="cat-val">
                  {cat.value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  <small>({cat.percent}%)</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-kart">
        <h4 className="dash-etiket-buyuk">Son İşlemler</h4>
        <div className="dash-recent-kapsul">
          {recentTransactions.length === 0 && <div className="dash-alt">Henüz işlem yok.</div>}
          {recentTransactions.map((t) => (
            <div key={t.id} className={`dash-recent ${t.isExpense ? 'expense-border' : ''}`}>
              <div>
                <div className={`dash-kalin ${t.isExpense ? 'expense-text' : ''}`}>{t.label}</div>
                <div className="dash-alt">{t.date ? new Date(t.date).toLocaleDateString('tr-TR', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : "—"}</div>
              </div>
              <div className={`dash-kalin ${t.isExpense ? 'expense-text' : ''}`}>
                {(t.amount || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdvancedReport />
    </div>
  );
}

