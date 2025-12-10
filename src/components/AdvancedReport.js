import "../styles/AdvancedReport.css";
import React, { useEffect, useMemo, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
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

function parseTimestamp(v) {
  if (!v) return null;
  if (typeof v === "object" && typeof v.toDate === "function") return v.toDate();
  if (typeof v === "object" && v.seconds) return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function parseNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function rangeDays(startDate, endDate) {
  const arr = [];
  const s = new Date(startDate);
  const e = new Date(endDate);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) arr.push(new Date(d));
  return arr;
}
function parseDateToDay(d) {
  if (!d) return null;
  if (typeof d === "object" && typeof d.toDate === "function") d = d.toDate();
  else if (typeof d === "object" && d.seconds) d = new Date(d.seconds * 1000);
  else d = new Date(d);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function sum(arr) {
  return arr.reduce((s, v) => s + (Number(v) || 0), 0);
}
function movingAverage(arr, window) {
  const out = [];
  const w = Math.max(1, Math.floor(window));
  for (let i = 0; i < arr.length; i++) {
    const slice = arr.slice(Math.max(0, i - w + 1), i + 1);
    out.push(sum(slice) / slice.length);
  }
  return out;
}
function zscoreAnomalies(values, threshold = 3.0) {
  const mean = values.reduce((s, v) => s + v, 0) / Math.max(1, values.length);
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, values.length);
  const std = Math.sqrt(variance);
  const anomalies = [];
  for (let i = 0; i < values.length; i++) {
    const z = std === 0 ? 0 : Math.abs((values[i] - mean) / std);
    if (z > threshold) anomalies.push(i);
  }
  return { anomalies, mean, std };
}
function linearRegressionForecast(values, daysForward = 7) {
  const n = values.length;
  if (n === 0) return { forecast: Array(daysForward).fill(0), slope: 0, intercept: 0 };
  const xs = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let num = 0,
    den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (values[i] - meanY);
    den += Math.pow(xs[i] - meanX, 2);
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const forecast = [];
  for (let f = 0; f < daysForward; f++) {
    const x = n + f;
    forecast.push(intercept + slope * x);
  }
  return { forecast, slope, intercept };
}

function normalizeSalesArray(rawSales) {
  if (!Array.isArray(rawSales)) return [];
  return rawSales.map((s) => {
    const itemsArr = Array.isArray(s.items) ? s.items : [];
    const items = itemsArr.map((it) => {
      const qty = Number(it.qty ?? it.quantity ?? 1);
      const rawPrice = it.price ?? it.unitPrice ?? it.unit_price ?? null;
      let price = 0;
      if (rawPrice != null) price = Number(rawPrice || 0);
      else if (typeof it.totalPrice !== "undefined" || typeof it.total_price !== "undefined") {
        const totalP = Number(it.totalPrice ?? it.total_price ?? 0);
        price = qty > 0 ? totalP / qty : totalP;
      } else price = Number(it.unit_price_per ?? 0) || 0;
      return {
        name: it.name ?? it.productName ?? it.product_name ?? "Ürün",
        price,
        qty,
        productId: it.productId ?? it.product_id ?? null,
        raw: it
      };
    });
    const createdAt = s.createdAt ?? s.date ?? s.created_at ?? s.timestamp ?? null;
    const topTotal = Number(s.totals?.total ?? s.total ?? s.totalPrice ?? s.total_price ?? NaN);
    const computedFromItems = items.reduce((sm, it) => sm + (Number(it.price || 0) * Number(it.qty || 0)), 0);
    const totalVal = Number.isNaN(topTotal) || topTotal === 0 ? computedFromItems : topTotal;
    return {
      id: String(s.id ?? s._id ?? s.saleId ?? Math.random().toString(36).slice(2, 9)),
      createdAt,
      saleType: (s.saleType ?? s.sale_type ?? s.type ?? "cash")?.toString().toLowerCase(),
      items,
      totals: { total: Number(totalVal || 0) },
      customerId: s.customerId ?? s.customer_id ?? null,
      raw: s
    };
  });
}

export default function AdvancedReport() {
  const [salesRaw, setSalesRaw] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerPaymentsMap, setCustomerPaymentsMap] = useState({});
  const [legacyIncomes, setLegacyIncomes] = useState([]);
  const [legacyExpenses, setLegacyExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const lookbackDays = 90;
  const maShort = 7;
  const maLong = 30;
  const forecastHorizon = 14;

  useEffect(() => {
    yukleHepsi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function yukleHepsi() {
    setLoading(true);
    try {
      const [s, l, c, p, legacyInc, legacyExp] = await Promise.all([
        listSales(),
        listLedger(),
        listCustomers(),
        listProductsForCurrentUser(),
        listLegacyIncomes(),
        listLegacyExpenses()
      ]);
      setSalesRaw(Array.isArray(s) ? s : []);
      setLedger(Array.isArray(l) ? l : []);
      setCustomers(Array.isArray(c) ? c : []);
      setProducts(Array.isArray(p) ? p : []);
      setLegacyIncomes(Array.isArray(legacyInc) ? legacyInc : []);
      setLegacyExpenses(Array.isArray(legacyExp) ? legacyExp : []);
      const paymentsMap = {};
      await Promise.all(
        (Array.isArray(c) ? c : []).map(async (cust) => {
          try {
            const pays = await listCustomerPayments(cust.id);
            paymentsMap[cust.id] = Array.isArray(pays) ? pays : [];
          } catch {
            paymentsMap[cust.id] = [];
          }
        })
      );
      setCustomerPaymentsMap(paymentsMap);
      bildir({ type: "success", title: "Veriler yüklendi", message: "Rapor hazır." });
    } catch (err) {
      console.error(err);
      bildir({ type: "error", title: "Yükleme hatası", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  function bildir(n) {
    setNote(n);
    clearTimeout(window.__advRepNoteT);
    window.__advRepNoteT = setTimeout(() => setNote(null), 3500);
  }

  const sales = useMemo(() => normalizeSalesArray(salesRaw), [salesRaw]);

  const { days, dailySalesSeries, dailyManualIncomeSeries, dailyManualExpenseSeries, totals, paymentsTotal } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (lookbackDays - 1));
    const dayList = rangeDays(start, end).map((d) => {
      const y = d.getFullYear(),
        m = String(d.getMonth() + 1).padStart(2, "0"),
        day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    });
    const salesMap = Object.fromEntries(dayList.map((d) => [d, 0]));
    const incMap = Object.fromEntries(dayList.map((d) => [d, 0]));
    const expMap = Object.fromEntries(dayList.map((d) => [d, 0]));
    let payments = 0;

    for (const s of sales) {
      if ((s.saleType || "cash") === "credit") continue;
      const day = parseDateToDay(s.createdAt);
      if (!day || !(day in salesMap)) continue;
      salesMap[day] += Number(s.totals?.total ?? 0);
    }

    for (const inc of legacyIncomes || []) {
      const day = parseDateToDay(inc.createdAt ?? inc.date ?? inc.created_at);
      if (!day || !(day in incMap)) continue;
      incMap[day] += parseNumber(inc.amount ?? inc.value ?? inc.total ?? 0);
    }
    for (const exp of legacyExpenses || []) {
      const day = parseDateToDay(exp.createdAt ?? exp.date ?? exp.created_at);
      if (!day || !(day in expMap)) continue;
      expMap[day] += parseNumber(exp.amount ?? exp.value ?? exp.total ?? 0);
    }

    for (const cid of Object.keys(customerPaymentsMap || {})) {
      for (const p of customerPaymentsMap[cid] || []) {
        const day = parseDateToDay(p.createdAt ?? p.date ?? p.created_at);
        if (!day || !(day in incMap)) continue;
        payments += parseNumber(p.amount ?? p.value ?? p.total ?? 0);
      }
    }

    const dailySales = dayList.map((d) => Math.max(0, salesMap[d] || 0));
    const dailyInc = dayList.map((d) => Math.max(0, incMap[d] || 0));
    const dailyExp = dayList.map((d) => Math.max(0, expMap[d] || 0));

    const totals = {
      salesTotal: sum(dailySales),
      manualIncomeTotal: sum(dailyInc),
      manualExpenseTotal: sum(dailyExp)
    };
    return { days: dayList, dailySalesSeries: dailySales, dailyManualIncomeSeries: dailyInc, dailyManualExpenseSeries: dailyExp, totals, paymentsTotal: payments };
  }, [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, lookbackDays]);

  const maShortSeries = useMemo(() => movingAverage(dailySalesSeries, maShort), [dailySalesSeries]);
  const maLongSeries = useMemo(() => movingAverage(dailySalesSeries, maLong), [dailySalesSeries]);
  const { anomalies, mean: salesMean, std: salesStd } = useMemo(() => zscoreAnomalies(dailySalesSeries, 3.0), [dailySalesSeries]);
  const { forecast, slope, intercept } = useMemo(
    () => linearRegressionForecast(dailySalesSeries, forecastHorizon),
    [dailySalesSeries]
  );
  const forecastLines = useMemo(() => {
    if (!days || days.length === 0) return [];
    const lastDayDate = new Date(days[days.length - 1] + "T00:00:00");
    return forecast.map((v, i) => {
      const d = new Date(lastDayDate);
      d.setDate(d.getDate() + i + 1);
      return { dateISO: d.toISOString().slice(0, 10), dateLabel: d.toLocaleDateString("tr-TR"), value: Math.max(0, v) };
    });
  }, [days, forecast]);

  const last7 = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const last30 = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);

  function sumSalesInRange(arr, since, includeCredit = false) {
    let total = 0,
      count = 0;
    for (const s of arr || []) {
      const d = parseTimestamp(s.createdAt ?? s.date ?? s.created_at);
      if (!d || d < since) continue;
      const st = (s.saleType ?? s.type ?? "").toString().toLowerCase();
      if (!includeCredit && (st === "credit" || st === "veresiye")) continue;
      total += parseNumber(s.totals?.total ?? s.total ?? 0);
      count++;
    }
    return { total, count };
  }
  function sumLegacyInRange(arr, since) {
    let total = 0;
    for (const it of arr || []) {
      const d = parseTimestamp(it.createdAt ?? it.date ?? it.created_at);
      if (!d || d < since) continue;
      total += parseNumber(it.amount ?? it.value ?? it.total ?? 0);
    }
    return total;
  }
  function sumPaymentsRange(since) {
    let total = 0;
    for (const cid of Object.keys(customerPaymentsMap || {})) {
      for (const p of customerPaymentsMap[cid] || []) {
        const d = parseTimestamp(p.createdAt ?? p.date ?? p.created_at);
        if (!d || d < since) continue;
        total += parseNumber(p.amount ?? p.value ?? p.total ?? 0);
      }
    }
    return total;
  }

  const weekly = useMemo(() => {
    const cash = sumSalesInRange(salesRaw, last7, false).total;
    const legacyInc = sumLegacyInRange(legacyIncomes, last7);
    const legacyExp = sumLegacyInRange(legacyExpenses, last7);
    const payments = sumPaymentsRange(last7);
    const incomeWithoutPayments = cash + legacyInc;
    const incomeWithPayments = incomeWithoutPayments + payments;
    const net = incomeWithoutPayments - legacyExp;
    return { cash, legacyInc, legacyExp, payments, incomeWithoutPayments, incomeWithPayments, net };
  }, [salesRaw, legacyIncomes, legacyExpenses, customerPaymentsMap, last7]);

  const monthly = useMemo(() => {
    const cash = sumSalesInRange(salesRaw, last30, false).total;
    const legacyInc = sumLegacyInRange(legacyIncomes, last30);
    const legacyExp = sumLegacyInRange(legacyExpenses, last30);
    const payments = sumPaymentsRange(last30);
    const incomeWithoutPayments = cash + legacyInc;
    const incomeWithPayments = incomeWithoutPayments + payments;
    const net = incomeWithoutPayments - legacyExp;
    const profitLoss = incomeWithPayments - legacyExp;
    return { cash, legacyInc, legacyExp, payments, incomeWithoutPayments, incomeWithPayments, net, profitLoss };
  }, [salesRaw, legacyIncomes, legacyExpenses, customerPaymentsMap, last30]);

  const { topProducts, productRevenueTotal } = useMemo(() => {
    const byProd = {};
    for (const s of sales) {
      if ((s.saleType || "cash") === "credit") continue;
      for (const it of s.items || []) {
        const pid = it.productId || it.name || "__unknown";
        const rev = Math.max(0, Number(it.price || 0)) * Math.max(0, Number(it.qty || 0));
        byProd[pid] = (byProd[pid] || 0) + rev;
      }
    }
    const productTotal = Object.values(byProd).reduce((a, b) => a + (Number(b) || 0), 0);
    const arr = Object.entries(byProd)
      .map(([id, amt]) => {
        const p = products.find((x) => x.id === id);
        return { id, name: p ? p.name : id, amount: amt };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
    return { topProducts: arr, productRevenueTotal: Math.max(0, productTotal) };
  }, [sales, products]);

  const topCustomers = useMemo(() => {
    const result = [];
    const purchasesMap = new Map();
    for (const s of sales) {
      const cid = s.customerId;
      if (!cid) continue;
      const key = String(cid);
      purchasesMap.set(key, (purchasesMap.get(key) || 0) + parseNumber(s.totals?.total ?? 0));
    }

    for (const cust of customers || []) {
      const id = String(cust.id);
      const debt = parseNumber(cust.balance ?? cust.debt ?? 0);
      const payments = (customerPaymentsMap[id] || []).reduce(
        (s, p) => s + parseNumber(p.amount ?? p.value ?? p.total ?? 0),
        0
      );
      const purchases = purchasesMap.get(id) || 0;
      result.push({ id, name: cust.name || id, debt, payments, purchases });
    }

    return result.filter((r) => r.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 10);
  }, [customers, customerPaymentsMap, sales]);

  const totalDebt = useMemo(
    () => Math.max(1, topCustomers.reduce((s, c) => s + (Number(c.debt) || 0), 0)),
    [topCustomers]
  );

  const recentTransactions = useMemo(() => {
    const txs = [];
    for (const s of salesRaw || []) {
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
      const d = parseTimestamp(inc.createdAt ?? inc.date ?? inc.created_at);
      txs.push({
        id: `inc_${inc.id}`,
        kind: "manual_income",
        date: d,
        amount: parseNumber(inc.amount ?? inc.value ?? inc.total ?? 0),
        label: inc.description || "Manuel Gelir",
        raw: inc
      });
    }
    for (const exp of legacyExpenses || []) {
      const d = parseTimestamp(exp.createdAt ?? exp.date ?? exp.created_at);
      txs.push({
        id: `exp_${exp.id}`,
        kind: "manual_expense",
        date: d,
        amount: parseNumber(exp.amount ?? exp.value ?? exp.total ?? 0),
        label: exp.description || "Manuel Gider",
        raw: exp
      });
    }
    for (const cid of Object.keys(customerPaymentsMap || {})) {
      for (const p of customerPaymentsMap[cid] || []) {
        const d = parseTimestamp(p.createdAt ?? p.date ?? p.created_at);
        txs.push({
          id: `pay_${cid}_${p.id || Math.random()}`,
          kind: "customer_payment",
          date: d,
          amount: parseNumber(p.amount ?? p.value ?? p.total ?? 0),
          label: `Müşteri Ödemesi (${cid})`,
          raw: p,
          customerId: cid
        });
      }
    }
    for (const l of ledger || []) {
      const d = parseTimestamp(l.createdAt ?? l.date ?? l.created_at);
      let amt = 0;
      if (typeof l.amount !== "undefined") amt = parseNumber(l.amount);
      else if (Array.isArray(l.lines)) amt = l.lines.reduce((s, ln) => s + (parseNumber(ln.debit) - parseNumber(ln.credit)), 0);
      txs.push({ id: `ledger_${l.id}`, kind: `ledger:${l.type || "entry"}`, date: d, amount: amt, label: l.description || `Ledger ${l.type || ""}`, raw: l });
    }
    return txs.filter((t) => t.date).sort((a, b) => b.date - a.date).slice(0, 20);
  }, [salesRaw, legacyIncomes, legacyExpenses, customerPaymentsMap, ledger]);

  const lineChartData = useMemo(
    () => ({
      labels: days,
      datasets: [
        {
          label: "Günlük Satış (Nakit)",
          data: dailySalesSeries,
          borderColor: "#1f6feb",
          backgroundColor: "rgba(31,111,235,0.10)",
          fill: true,
          tension: 0.2
        },
        { label: `${maShort}g Ort`, data: maShortSeries, borderColor: "#16a34a", borderDash: [4, 4], fill: false, tension: 0.2 },
        { label: `${maLong}g Ort`, data: maLongSeries, borderColor: "#f97316", borderDash: [6, 4], fill: false, tension: 0.2 }
      ]
    }),
    [days, dailySalesSeries, maShortSeries, maLongSeries]
  );

  const doughnutData = useMemo(
    () => ({
      labels: ["Satışlar (Nakit)", "Manuel Gelirler", "Tahsilatlar", "Manuel Giderler"],
      datasets: [
        {
          data: [totals.salesTotal || 0, totals.manualIncomeTotal || 0, paymentsTotal || 0, totals.manualExpenseTotal || 0],
          backgroundColor: ["#1f6feb", "#34d399", "#60a5fa", "#ef4444"]
        }
      ]
    }),
    [totals, paymentsTotal]
  );

  function tl(v) {
    try {
      return Number(v || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
    } catch {
      return v;
    }
  }
  function borcYuzde(amount) {
    const pct = (amount / totalDebt) * 100;
    return `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`;
  }

  if (loading) {
    return (
      <div className="rapor-kapsul">
        <div className="rapor-kart">
          <div className="rapor-yukleme">
            <div className="rapor-spinner" />
            <p>Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rapor-kapsul">
      {note && <div className="rapor-bant">{note.title} — {note.message}</div>}

      <div className="rapor-baslik-satir">
        <div>
          <h3 className="rapor-baslik">Gelişmiş Rapor</h3>
          <p className="rapor-alt">Dashboard verileriyle senkron</p>
        </div>
        <div className="rapor-aksiyonlar">
          <button className="rapor-btn ghost" onClick={yukleHepsi} disabled={loading}>
            {loading ? "Yenileniyor..." : "Yenile"}
          </button>
          <button
            className="rapor-btn primary"
            onClick={() => {
              setGeneratedAt(new Date());
              bildir({ type: "success", title: "Rapor hazır", message: "Rapor oluşturuldu." });
            }}
          >
            Raporu Oluştur
          </button>
        </div>
      </div>

      <div className="rapor-ana-grid">
        <div className="rapor-sol">
          <div className="rapor-iki">
            <div className="rapor-kart p16">
              <div className="rapor-alt">Toplam (son {lookbackDays}g)</div>
              <div className="rapor-kalin">{tl(totals.salesTotal)} satış geliri</div>
              <div className="rapor-alt">Manuel Gelir: {tl(totals.manualIncomeTotal)} • Tahsilatlar: {tl(paymentsTotal)}</div>
              {generatedAt && <div className="rapor-mini">Oluşturuldu: {generatedAt.toLocaleString()}</div>}
            </div>

            <div className="rapor-kart p16">
              <div className="rapor-kalin">Anomali Tespiti</div>
              <div className="rapor-alt">{anomalies.length} günlük satış anomalisi</div>
              <div className="rapor-anomali-liste">
                {anomalies.length === 0 ? (
                  <div className="rapor-alt">Anomali yok.</div>
                ) : (
                  anomalies.map((i) => (
                    <div key={i} className="rapor-anomali">
                      <div className="rapor-alt">{days[i]}</div>
                      <div className="rapor-kalin">{tl(dailySalesSeries[i])}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rapor-kart">
            <h4>Günlük Satış (son {lookbackDays} gün)</h4>
            <div className="rapor-grafik">
              <Line data={lineChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
            </div>
          </div>

          <div className="rapor-iki yukari">
            <div className="rapor-kart">
              <h5>Tahmin ({forecastHorizon} gün)</h5>
              <div className="rapor-tahmin-grid">
                {forecastLines.length === 0 && <div className="rapor-alt">Tahmin yok.</div>}
                {forecastLines.map((f, i) => (
                  <div key={i} className="rapor-tahmin">
                    <div className="rapor-tarih">{f.dateLabel}</div>
                    <div className="rapor-kalin">{tl(f.value)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rapor-kart">
              <h5>Öneriler</h5>
              <ul className="rapor-oneri">
                {(() => {
                  const recs = [];
                  const recent = dailySalesSeries.slice(-14);
                  const prev = dailySalesSeries.slice(-28, -14);
                  const recentAvg = recent.length ? sum(recent) / recent.length : 0;
                  const prevAvg = prev.length ? sum(prev) / prev.length : 0;
                  if (prevAvg > 0 && recentAvg / prevAvg < 0.85) recs.push("Son 2 haftada satışlarda düşüş var. Kampanya düşünün.");
                  if (slope > 0) recs.push("Satış eğilimi pozitif, stokları izleyin.");
                  if (totals.manualExpenseTotal / Math.max(1, totals.salesTotal) > 0.4) recs.push("Manuel giderler satışa oranla yüksek.");
                  if (topProducts.length && topProducts[0].amount / Math.max(1, productRevenueTotal) > 0.25) recs.push(`En iyi ürün '${topProducts[0].name}' gelire yüksek katkı yapıyor.`);
                  if (topCustomers.length && topCustomers[0].debt / Math.max(1, totalDebt) > 0.25) recs.push(`En borçlu müşteri '${topCustomers[0].name}' toplam borçta büyük paya sahip.`);
                  if (anomalies.length > 0) recs.push(`${anomalies.length} adet anomali tespit edildi.`);
                  if (recs.length === 0) recs.push("Veriler stabil.");
                  return recs.map((r, i) => (
                    <li key={i} className="rapor-oneri-oge">
                      {r}
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </div>

          <div className="rapor-kart">
            <h4>En Çok Satan Ürünler</h4>
            <div className="rapor-urun-listesi">
              {topProducts.length === 0 ? (
                <div className="rapor-alt">Veri yok.</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={p.id} className="rapor-urun-karti">
                    <div>
                      <div className="rapor-kalin">{idx + 1}. {p.name}</div>
                      <div className="rapor-alt">{tl(p.amount)} toplam</div>
                    </div>
                    <div className="rapor-mini">{borcYuzde(p.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="rapor-sag">
          <div className="rapor-kart">
            <h4>Gelir Kırılımı</h4>
            <div className="rapor-grafik-kucuk">
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
            </div>
            <div className="rapor-mini">Nakit Satış / Manuel Gelir / Tahsilatlar / Manuel Gider</div>
          </div>

          <div className="rapor-kart">
            <h4>En Borçlu Müşteriler</h4>
            <div className="rapor-musteri-listesi">
              {topCustomers.length === 0 ? (
                <div className="rapor-alt">Veri yok.</div>
              ) : (
                topCustomers.map((c, idx) => (
                  <div key={c.id} className="rapor-musteri-karti">
                    <div>
                      <div className="rapor-kalin">{idx + 1}. {c.name}</div>
                      <div className="rapor-alt">Borç: {tl(c.debt)} • Ödeme: {tl(c.payments)}</div>
                    </div>
                    <div className="rapor-mini">{borcYuzde(c.debt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rapor-kart">
            <h4>Analiz Notları</h4>
            <div className="rapor-mini">
              - Ortalama günlük satış: {tl(salesMean)} (std: {tl(salesStd)})<br />
              - Anomali eşiği: z-score &gt; 3.0<br />
              - Tahmin: basit doğrusal regresyon
            </div>
          </div>
        </aside>
      </div>

      <div className="rapor-bant-bilgi">
        Günlük seri uzunluğu: {dailySalesSeries.length} • Haftalık gelir: {tl(weekly.incomeWithPayments)} • Aylık gelir: {tl(monthly.incomeWithPayments)}
      </div>
    </div>
  );
}