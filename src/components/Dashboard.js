import "../styles/global.css";
import "../styles/Dashboard.css";

/* Dashboard (updated)
 - Use customer names in recent transactions when available.
 - No write-button gating on Dashboard itself, but recent transactions labels now show customer name.
 - Inline styles moved to Dashboard.css with className usage.
*/
import React, { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  listSales,
  listLedger,
  listCustomers,
  listCustomerPayments,
  listLegacyIncomes,
  listLegacyExpenses
} from "../utils/firebaseHelpers";
import "../utils/chartSetup";
import AdvancedReport from "./AdvancedReport";

function parseTimestamp(createdAt) {
  if (!createdAt) return null;
  if (typeof createdAt === "object" && typeof createdAt.toDate === "function") return createdAt.toDate();
  if (typeof createdAt === "object" && createdAt.seconds) return new Date(createdAt.seconds * 1000);
  const d = new Date(createdAt);
  if (!isNaN(d.getTime())) return d;
  return null;
}
function parseNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerPaymentsMap, setCustomerPaymentsMap] = useState({});
  const [legacyIncomes, setLegacyIncomes] = useState([]);
  const [legacyExpenses, setLegacyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          salesData,
          ledgerData,
          customersData,
          legacyInc,
          legacyExp
        ] = await Promise.all([
          listSales(),
          listLedger(),
          listCustomers(),
          listLegacyIncomes(),
          listLegacyExpenses()
        ]);

        if (!mounted) return;
        setSales(Array.isArray(salesData) ? salesData : []);
        setLedger(Array.isArray(ledgerData) ? ledgerData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setLegacyIncomes(Array.isArray(legacyInc) ? legacyInc : []);
        setLegacyExpenses(Array.isArray(legacyExp) ? legacyExp : []);

        // fetch payments per customer in parallel (best-effort)
        const paymentsMap = {};
        await Promise.all(
          (Array.isArray(customersData) ? customersData : []).map(async (c) => {
            try {
              const payments = await listCustomerPayments(c.id);
              paymentsMap[c.id] = Array.isArray(payments) ? payments : [];
            } catch (err) {
              console.warn("Failed fetching payments for", c.id, err);
              paymentsMap[c.id] = [];
            }
          })
        );
        if (!mounted) return;
        setCustomerPaymentsMap(paymentsMap);
      } catch (err) {
        console.error("Dashboard load error:", err);
        if (mounted) setError(String(err?.message || err));
        setSales([]);
        setLedger([]);
        setCustomers([]);
        setCustomerPaymentsMap({});
        setLegacyIncomes([]);
        setLegacyExpenses([]);
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
      const t = parseNumber(s.totals?.total ?? s.total ?? s.totalPrice ?? 0);
      total += t;
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

  // Weekly aggregates (ledger excluded from totals)
  const weekly = useMemo(() => {
    const cash = sumSalesInRange(sales, last7, false);
    const cashAll = sumSalesInRange(sales, last7, true);
    const creditAmount = Math.max(0, cashAll.total - cash.total);
    const legacyIncome = sumLegacyIncomesInRange(last7);
    const legacyExpense = sumLegacyExpensesInRange(last7);
    const customerPayments = sumCustomerPaymentsInRange(last7);
    const incomeWithoutPayments = cash.total + legacyIncome;
    const incomeWithPayments = incomeWithoutPayments + customerPayments;
    const expensesTotal = legacyExpense;
    const net = incomeWithoutPayments - expensesTotal;
    return {
      cashSales: cash.total,
      cashSalesCount: cash.count,
      creditSales: creditAmount,
      legacyIncome,
      legacyExpense,
      customerPayments,
      incomeWithoutPayments,
      incomeWithPayments,
      expensesTotal,
      net
    };
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, last7]);

  // Monthly aggregates (ledger excluded from totals)
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
    const net = incomeWithoutPayments - expensesTotal;
    const profitLoss = incomeWithPayments - expensesTotal;
    return {
      cashSales: cash.total,
      cashSalesCount: cash.count,
      creditSales: creditAmount,
      legacyIncome,
      legacyExpense,
      customerPayments,
      incomeWithoutPayments,
      incomeWithPayments,
      expensesTotal,
      net,
      profitLoss
    };
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, last30]);

  // Recent transactions: include last 20 transactions (most recent). UI will display a scroll area showing 3 at a time.
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
    // ledger entries kept for visibility but not used in totals
    for (const l of ledger || []) {
      const d = parseTimestamp(l.createdAt ?? l.date ?? l.created_at);
      let amt = 0;
      if (typeof l.amount !== "undefined") amt = parseNumber(l.amount);
      else if (Array.isArray(l.lines)) amt = l.lines.reduce((s, ln) => s + (parseNumber(ln.debit) - parseNumber(ln.credit)), 0);
      txs.push({
        id: `ledger_${l.id}`,
        kind: `ledger:${l.type || "entry"}`,
        date: d,
        amount: amt,
        label: l.description || `Ledger ${l.type || ""}`,
        raw: l
      });
    }
    for (const inc of legacyIncomes || []) {
      const d = parseTimestamp(inc.createdAt ?? inc.date ?? inc.created_at ?? inc.createdOn);
      txs.push({
        id: `legacy_inc_${inc.id}`,
        kind: "manual_income",
        date: d,
        amount: parseNumber(inc.amount ?? inc.value ?? inc.totalPrice ?? inc.total ?? 0),
        label: inc.description || "Manuel Gelir",
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
        label: exp.description || "Manuel Gider",
        raw: exp
      });
    }
    for (const custId of Object.keys(customerPaymentsMap || {})) {
      for (const p of customerPaymentsMap[custId] || []) {
        const d = parseTimestamp(p.createdAt ?? p.date ?? p.created_at);
        // Try to resolve customer name
        const cust = (customers || []).find(c => String(c.id) === String(custId));
        const customerLabel = cust ? `${cust.name}` : String(custId);
        txs.push({
          id: `pay_${custId}_${p.id ?? Math.random()}`,
          kind: "customer_payment",
          date: d,
          amount: parseNumber(p.amount ?? p.value ?? p.total ?? 0),
          label: `Müşteri Ödemesi (${customerLabel})`,
          customerId: custId,
          raw: p
        });
      }
    }
    // sort desc and take most recent 20
    return txs.filter(t => t.date).sort((a, b) => b.date - a.date).slice(0, 20);
  }, [sales, ledger, legacyIncomes, legacyExpenses, customerPaymentsMap, customers]);

  if (loading) {
    return (
      <div className="card">
        <div className="app-loading">
          <div className="spinner" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const donutData = {
    labels: ["Satışlar (Nakit)", "Manuel Gelirler", "Tahsilatlar", "Manuel Giderler"],
    datasets: [{
      data: [
        monthly.cashSales || 0,
        monthly.legacyIncome || 0,
        monthly.customerPayments || 0,
        monthly.legacyExpense || 0
      ],
      backgroundColor: ["#4ade80", "#34d399", "#f59e0b", "#ef4444"]
    }]
  };

  return (
    <div className="page-dashboard">
      <h3 className="dashboard-title">Dashboard</h3>
      {error && <div className="dashboard-error">Hata: {error}</div>}

      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-sub">Haftalık - Gelir (satış + manuel)</div>
          <div className="metric-value">
            {((weekly.cashSales || 0) + (weekly.legacyIncome || 0)).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
          <div className="muted">Nakit: {(weekly.cashSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} • Manuel Gelirler: {(weekly.legacyIncome || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
          <div className="muted">Tahsilatlar: {(weekly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} • Veresiye: {(weekly.creditSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="metric-card">
          <div className="metric-sub">Haftalık - Gider (manuel)</div>
          <div className="metric-value">{(weekly.expensesTotal || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
          <div className="muted">Manuel Gider: {(weekly.legacyExpense || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="metric-card">
          <div className="metric-sub">Haftalık - Tahsilatlar</div>
          <div className="metric-value">{(weekly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="metric-card">
          <div className="metric-sub">Toplam Müşteri Borcu</div>
          <div className="metric-value">{totalCustomerDebt.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
          <div className="muted">{(customers || []).length} müşteri</div>
        </div>
      </div>

      <div className="card monthly-card">
        <h4 className="section-title">Aylık Özet</h4>
        <div className="monthly-grid">
          <div className="monthly-left">
            <div className="grid two-cols">
              <div className="card small-card">
                <div className="metric-sub">Aylık Nakit Satış</div>
                <div className="metric-strong">{(monthly.cashSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>

              <div className="card small-card">
                <div className="metric-sub">Aylık Manuel Gelirler</div>
                <div className="metric-strong">{(monthly.legacyIncome || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>

              <div className="card small-card">
                <div className="metric-sub">Aylık Tahsilatlar</div>
                <div className="metric-strong">{(monthly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>

              <div className="card small-card">
                <div className="metric-sub">Aylık Manuel Giderler</div>
                <div className="metric-strong">{(monthly.legacyExpense || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>

              <div className="card large-card">
                <div className="metric-sub">Aylık Gelir (satış + manuel)</div>
                <div className="metric-value">{((monthly.incomeWithoutPayments || 0)).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                <div className="muted">Tahsilatlar: {(monthly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                <div className="muted">Giderler (manuel): {(monthly.expensesTotal || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                <div className="metric-strong">Aylık Kar/Zarar (Gelir+Tahsilat - Gider): {(monthly.profitLoss || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
            </div>
          </div>

          <div className="monthly-right">
            <div className="donut-wrap">
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
            </div>
            <div className="donut-caption">Aylık: Satışlar / Manuel Gelirler / Tahsilatlar / Manuel Giderler</div>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h4 className="section-title">Son İşlemler (son 20)</h4>

        <div className="recent-wrapper">
          <div className="recent-container">
            {recentTransactions.length === 0 && <div className="recent-empty">İşlem yok.</div>}
            {recentTransactions.map((t) => (
              <div key={t.id} className="recent-item card">
                <div className="recent-meta">
                  <div className="recent-label">{t.label}</div>
                  <div className="muted">{t.date ? new Date(t.date).toLocaleString() : "—"} • {t.kind}</div>
                </div>
                <div className="recent-amount">
                  {(t.amount || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </div>
              </div>
            ))}
          </div>

          <div className="recent-note">Gösterilen: en son 20 işlem — kutuda aynı anda 3 işlem görünür, kaydırarak kalanlarını görebilirsiniz.</div>
        </div>
      </div>

      <AdvancedReport />
    </div>
  );
}