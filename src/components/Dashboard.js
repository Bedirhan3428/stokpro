import "../styles/Dashboard.css";
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
import { listProductsForCurrentUser } from "../utils/artifactUserProducts"; 
import "../utils/chartSetup";
import AdvancedReport from "./AdvancedReport";
import useSubscription from "../hooks/useSubscription";
import { bildirimIzniIste, bildirimGonder } from "../utils/notificationHelper";

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
  return desc || `Ledger ${l.type || ""}`;
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

        // --- AKILLI STOK BİLDİRİMİ (GÜNCELLENDİ) ---
        await bildirimIzniIste();
        
        // 1. Kritik ürünleri bul
        const kritikUrunler = (productsData || []).filter(p => Number(p.stock) < 10);
        
        if (kritikUrunler.length > 0) {
          // 2. Son bildirim zamanını kontrol et
          const sonBildirimZamani = localStorage.getItem("sonStokBildirimi");
          const suAn = Date.now();
          const beklemeSuresi = 12 * 60 * 60 * 1000; // 12 Saat (Milisaniye cinsinden)

          // Eğer hiç bildirim atılmadıysa VEYA son bildirimden 12 saat geçtiyse
          if (!sonBildirimZamani || (suAn - sonBildirimZamani > beklemeSuresi)) {
            
            const ornekUrun = kritikUrunler[0].name;
            const kalanSayi = kritikUrunler.length - 1;
            let mesaj = "";
            
            if (kalanSayi > 0) {
              mesaj = `⚠️ ${ornekUrun} ve ${kalanSayi} diğer ürünün stoğu kritik seviyede!`;
            } else {
              mesaj = `⚠️ ${ornekUrun} stoğu bitmek üzere! Mevcut: ${kritikUrunler[0].stock}`;
            }
            
            bildirimGonder("Kritik Stok Uyarısı", mesaj);
            
            // 3. Şu anki zamanı kaydet
            localStorage.setItem("sonStokBildirimi", suAn);
          }
        }
        // ---------------------------------------------

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
        setSales([]);
        setLedger([]);
        setCustomers([]);
        setCustomerPaymentsMap({});
        setLegacyIncomes([]);
        setLegacyExpenses([]);
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
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
        label: labelForLedgerEntry(l),
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
        const cust = (customers || []).find((c) => String(c.id) === String(custId));
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
    return txs.filter((t) => t.date).sort((a, b) => b.date - a.date).slice(0, 20);
  }, [sales, ledger, legacyIncomes, legacyExpenses, customerPaymentsMap, customers]);

  if (loading) {
    return (
      <div className="dash-kart">
        <div className="dash-yukleme">
          <div className="dash-spinner" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const donutData = {
    labels: ["Satışlar (Nakit)", "Manuel Gelirler", "Tahsilatlar", "Manuel Giderler"],
    datasets: [
      {
        data: [monthly.cashSales || 0, monthly.legacyIncome || 0, monthly.customerPayments || 0, monthly.legacyExpense || 0],
        backgroundColor: ["#1f6feb", "#34d399", "#60a5fa", "#ef4444"]
      }
    ]
  };

  return (
<div class="kar-efekti">
    <div className="dash-sayfa">
       {!subLoading && !subActive && (
        <div className="acc-kart acc-uyari-kutu">
          <div className="acc-uyari-baslik">Abonelik gerekli</div>
          <div className="acc-yazi-ince">
           <a href="https://www.stokpro.shop/product-key" style={{color:"#1f6feb",fontWeight:"bold"}}>Satın Almak için tıklayın</a>
          </div>
        </div>
      )}
      <h3 className="dash-baslik">Dashboard</h3>
      {error && <div className="dash-hata">Hata: {error}</div>}

      <div className="dash-metrik-grid">
        <div className="dash-kart">
          <div className="dash-etiket">Haftalık - Gelir (satış + manuel)</div>
          <div className="dash-deger">
            {((weekly.cashSales || 0) + (weekly.legacyIncome || 0)).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
          <div className="dash-alt">
            Nakit: {(weekly.cashSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} • Manuel Gelirler:{" "}
            {(weekly.legacyIncome || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
          <div className="dash-alt">
            Tahsilatlar: {(weekly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} • Veresiye:{" "}
            {(weekly.creditSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
        </div>

        <div className="dash-kart">
          <div className="dash-etiket">Haftalık - Gider (manuel)</div>
          <div className="dash-deger">{(weekly.expensesTotal || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
          <div className="dash-alt">Manuel Gider: {(weekly.legacyExpense || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="dash-kart">
          <div className="dash-etiket">Haftalık - Tahsilatlar</div>
          <div className="dash-deger">{(weekly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="dash-kart">
          <div className="dash-etiket">Toplam Müşteri Borcu</div>
          <div className="dash-deger">{totalCustomerDebt.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
          <div className="dash-alt">{(customers || []).length} müşteri</div>
        </div>
      </div>

      <div className="dash-kart">
        <h4 className="dash-etiket-buyuk">Aylık Özet</h4>
        <div className="dash-aylik-grid">
          <div className="dash-aylik-sol">
            <div className="dash-iki">
              <div className="dash-mini-kart">
                <div className="dash-etiket">Aylık Nakit Satış</div>
                <div className="dash-kalin">{(monthly.cashSales || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
              <div className="dash-mini-kart">
                <div className="dash-etiket">Aylık Manuel Gelirler</div>
                <div className="dash-kalin">{(monthly.legacyIncome || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
              <div className="dash-mini-kart">
                <div className="dash-etiket">Aylık Tahsilatlar</div>
                <div className="dash-kalin">{(monthly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
              <div className="dash-mini-kart">
                <div className="dash-etiket">Aylık Manuel Giderler</div>
                <div className="dash-kalin">{(monthly.legacyExpense || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>

              <div className="dash-buyuk-kart">
                <div className="dash-etiket">Aylık Gelir (satış + manuel)</div>
                <div className="dash-deger">
                  {(monthly.incomeWithoutPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </div>
                <div className="dash-alt">Tahsilatlar: {(monthly.customerPayments || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                <div className="dash-alt">Giderler (manuel): {(monthly.expensesTotal || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                <div className="dash-kalin">Aylık Kar/Zarar: {(monthly.profitLoss || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>
            </div>
          </div>

          <div className="dash-aylik-sag">
            <div className="dash-donut">
              <Doughnut
                data={donutData}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
              />
            </div>
            <div className="dash-mini">Aylık: Satışlar / Manuel Gelirler / Tahsilatlar / Manuel Giderler</div>
          </div>
        </div>
      </div>

      {categoryStats.length > 0 && (
        <div className="dash-kart">
          <h4 className="dash-etiket-buyuk">Kategori Bazlı Satış Dağılımı</h4>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {categoryStats.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '120px', fontSize: '0.9rem', fontWeight: 500 }}>
                  {cat.name}
                </div>
                <div style={{ flex: 1, backgroundColor: 'var(--border)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.percent}%`, backgroundColor: '#1f6feb', height: '100%' }}></div>
                </div>
                <div style={{ minWidth: '100px', textAlign: 'right', fontSize: '0.9rem', color: 'var(--subtext)' }}>
                  {cat.value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '5px' }}>({cat.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-kart">
        <h4 className="dash-etiket-buyuk">Son İşlemler (son 20)</h4>
        <div className="dash-recent-kapsul">
          {recentTransactions.length === 0 && <div className="dash-alt">İşlem yok.</div>}
          {recentTransactions.map((t) => (
            <div key={t.id} className="dash-recent">
              <div>
                <div className="dash-kalin">{t.label}</div>
                <div className="dash-alt">{t.date ? new Date(t.date).toLocaleString() : "—"} • {t.kind}</div>
              </div>
              <div className="dash-kalin">
                {(t.amount || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </div>
            </div>
          ))}
        </div>
        <div className="dash-mini">Gösterilen: en son 20 işlem.</div>
      </div>

      <AdvancedReport />
    </div>
</div>
  );
}


