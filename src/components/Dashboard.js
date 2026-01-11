import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { 
  FiTrendingUp, FiTrendingDown, FiActivity, FiUsers, FiAlertCircle 
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

// --- GRAFİK MOTORUNU BAŞLAT (BEYAZ EKRAN ÇÖZÜMÜ) ---
ChartJS.register(ArcElement, Tooltip, Legend);

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
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]); 
  const [customers, setCustomers] = useState([]);
  const [customerPaymentsMap, setCustomerPaymentsMap] = useState({});
  const [legacyIncomes, setLegacyIncomes] = useState([]);
  const [legacyExpenses, setLegacyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Abonelik kontrolü (Hata vermemesi için try-catch)
  let subLoading = false;
  let subActive = true;
  try {
    const sub = useSubscription();
    subLoading = sub.loading;
    subActive = sub.active;
  } catch (e) { console.warn(e); }

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

        // Bildirim Sistemi
        try {
            await bildirimIzniIste();
            const kritik = (productsData || []).filter(p => Number(p.stock) < 10);
            if (kritik.length > 0) {
              const son = localStorage.getItem("sonStokBildirimi");
              const simdi = Date.now();
              if (!son || (simdi - son > 43200000)) { // 12 saat
                 bildirimGonder("Stok Uyarısı", `${kritik.length} ürün azalıyor.`);
                 localStorage.setItem("sonStokBildirimi", simdi);
              }
            }
        } catch (e) {}

        // Ödemeler
        const pMap = {};
        if (Array.isArray(customersData)) {
            for (const c of customersData) {
                try {
                    const pays = await listCustomerPayments(c.id);
                    pMap[c.id] = Array.isArray(pays) ? pays : [];
                } catch { pMap[c.id] = []; }
            }
        }
        if (mounted) setCustomerPaymentsMap(pMap);

      } catch (err) {
        if (mounted) setError("Veri yükleme hatası.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const last7 = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const last30 = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);

  // --- HESAPLAMA FONKSİYONLARI ---
  function calculateStats(sinceDate) {
    let cashSales = 0;
    let creditSales = 0;
    
    (sales || []).forEach(s => {
       const d = parseTimestamp(s.createdAt || s.date);
       if(d && d >= sinceDate) {
           const total = parseNumber(s.totals?.total || s.total || 0);
           if (s.saleType === 'credit' || s.saleType === 'veresiye') {
               creditSales += total;
           } else {
               cashSales += total;
           }
       }
    });

    let legacyInc = 0;
    (legacyIncomes || []).forEach(i => {
        const d = parseTimestamp(i.createdAt || i.date);
        if(d && d >= sinceDate) legacyInc += parseNumber(i.amount || 0);
    });

    let legacyExp = 0;
    (legacyExpenses || []).forEach(e => {
        const d = parseTimestamp(e.createdAt || e.date);
        if(d && d >= sinceDate) legacyExp += parseNumber(e.amount || 0);
    });

    let payments = 0;
    Object.values(customerPaymentsMap).forEach(list => {
        (list || []).forEach(p => {
            const d = parseTimestamp(p.createdAt || p.date);
            if(d && d >= sinceDate) payments += parseNumber(p.amount || 0);
        });
    });

    // Gelir = Nakit Satış + Manuel Gelir (Tahsilat kasaya girer ama gelir sayılmaz muhasebede, ama nakit akışıdır)
    // Burada basit kasa mantığı: Nakit Satış + Manuel Gelir + Tahsilat
    const totalCashIn = cashSales + legacyInc + payments; 
    
    return { cashSales, creditSales, legacyInc, legacyExp, payments, totalCashIn };
  }

  const weekly = useMemo(() => calculateStats(last7), [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, last7]);
  const monthly = useMemo(() => calculateStats(last30), [sales, legacyIncomes, legacyExpenses, customerPaymentsMap, last30]);
  
  const totalDebt = useMemo(() => (customers || []).reduce((acc, c) => acc + parseNumber(c.balance || c.debt || 0), 0), [customers]);

  // Son İşlemler Listesi
  const recentTransactions = useMemo(() => {
    const list = [];
    (sales || []).forEach(s => list.push({
        id: s.id, 
        type: 'sale', 
        date: parseTimestamp(s.createdAt), 
        amount: parseNumber(s.totals?.total || s.total), 
        label: s.saleType === 'credit' ? "Veresiye Satış" : "Nakit Satış",
        isNegative: false
    }));
    (legacyExpenses || []).forEach(e => list.push({
        id: e.id, 
        type: 'expense', 
        date: parseTimestamp(e.createdAt), 
        amount: parseNumber(e.amount), 
        label: e.description || "Gider",
        isNegative: true
    }));
    Object.keys(customerPaymentsMap).forEach(cid => {
        customerPaymentsMap[cid].forEach(p => {
             list.push({
                 id: p.id,
                 type: 'payment',
                 date: parseTimestamp(p.createdAt),
                 amount: parseNumber(p.amount),
                 label: "Tahsilat",
                 isNegative: false
             })
        })
    });
    return list.filter(i => i.date).sort((a, b) => b.date - a.date).slice(0, 10);
  }, [sales, legacyExpenses, customerPaymentsMap]);

  if (loading) return <div className="dash-yukleme"><div className="dash-spinner"></div> Yükleniyor...</div>;

  const donutData = {
    labels: ["Nakit Satış", "Tahsilat", "Ek Gelir"],
    datasets: [{
      data: [monthly.cashSales, monthly.payments, monthly.legacyInc],
      backgroundColor: ["#2563eb", "#10b981", "#8b5cf6"],
      borderWidth: 0
    }]
  };

  return (
    <div className="dash-sayfa">
      
      {/* BAŞLIK & ABONELİK */}
      <div className="dash-ust-bilgi">
        <h3 className="dash-baslik">Yönetim Paneli</h3>
        {!subLoading && !subActive && (
          <div className="dash-uyari-badge">
            <FiAlertCircle /> Abonelik Gerekli - 
            <a href="https://www.stokpro.shop/product-key">Etkinleştir</a>
          </div>
        )}
      </div>

      {/* --- HAFTALIK ÖZET KARTLARI --- */}
      <h4 className="bolum-baslik">Haftalık Durum (Son 7 Gün)</h4>
      <div className="dash-metrik-grid">
        
        <div className="dash-kart">
          <div className="kart-ikon mavi"><FiTrendingUp /></div>
          <div className="kart-icerik">
            <div className="dash-etiket">Haftalık Nakit Girişi</div>
            <div className="dash-deger">{weekly.totalCashIn.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
            <div className="dash-alt">
              Nakit Satış: {weekly.cashSales.toLocaleString("tr-TR")} ₺ <br/>
              Tahsilat: {weekly.payments.toLocaleString("tr-TR")} ₺
            </div>
          </div>
        </div>

        <div className="dash-kart">
          <div className="kart-ikon kirmizi"><FiTrendingDown /></div>
          <div className="kart-icerik">
            <div className="dash-etiket">Haftalık Gider</div>
            <div className="dash-deger">{weekly.legacyExp.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
            <div className="dash-alt">Manuel Giderler</div>
          </div>
        </div>

        <div className="dash-kart">
          <div className="kart-ikon mor"><FiActivity /></div>
          <div className="kart-icerik">
             <div className="dash-etiket">Haftalık Veresiye</div>
             <div className="dash-deger">{weekly.creditSales.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
             <div className="dash-alt">Borç defterine eklendi</div>
          </div>
        </div>

        <div className="dash-kart">
          <div className="kart-ikon sari"><FiUsers /></div>
          <div className="kart-icerik">
             <div className="dash-etiket">Toplam Müşteri Alacağı</div>
             <div className="dash-deger">{totalDebt.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
             <div className="dash-alt">{customers.length} kayıtlı müşteri</div>
          </div>
        </div>

      </div>

      {/* --- AYLIK DETAYLAR & GRAFİK --- */}
      <h4 className="bolum-baslik" style={{marginTop: '30px'}}>Aylık Özet (Son 30 Gün)</h4>
      <div className="dash-aylik-grid">
        
        {/* SOL TARAF: RAKAMSAL DETAYLAR */}
        <div className="dash-kart sol-detay">
           <div className="detay-satir">
              <span>Aylık Nakit Satış</span>
              <strong>{monthly.cashSales.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong>
           </div>
           <div className="detay-satir">
              <span>Aylık Manuel Gelir</span>
              <strong>{monthly.legacyInc.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong>
           </div>
           <div className="detay-satir">
              <span>Aylık Tahsilat</span>
              <strong>{monthly.payments.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong>
           </div>
           <hr className="ayirac" />
           <div className="detay-satir buyuk">
              <span>Toplam Kasa Girişi</span>
              <strong style={{color: '#2563eb'}}>{monthly.totalCashIn.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong>
           </div>
           <div className="detay-satir buyuk">
              <span>Toplam Gider</span>
              <strong style={{color: '#ef4444'}}>{monthly.legacyExp.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong>
           </div>
           <div className="detay-satir sonuc">
              <span>NET KASA (Kar/Zarar)</span>
              <strong>{(monthly.totalCashIn - monthly.legacyExp).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong>
           </div>
        </div>

        {/* SAĞ TARAF: GRAFİK */}
        <div className="dash-kart sag-grafik">
            <h5 className="grafik-baslik">Gelir Dağılımı</h5>
            <div className="chart-kapsul">
                {monthly.totalCashIn > 0 ? (
                    <Doughnut 
                        data={donutData} 
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} 
                    />
                ) : (
                    <p className="veri-yok">Bu ay henüz veri yok.</p>
                )}
            </div>
        </div>
      </div>

      {/* --- SON İŞLEMLER --- */}
      <div className="dash-kart" style={{marginTop: '20px'}}>
         <div className="kart-baslik-satir">
            <h4 className="dash-etiket-buyuk">Son İşlemler</h4>
            <Link to="/reports" style={{fontSize:'0.9rem', color:'#2563eb'}}>Tümü</Link>
         </div>
         <div className="dash-recent-list">
            {recentTransactions.map((t) => (
               <div key={t.id} className="dash-recent-item">
                  <div className="recent-info">
                     <span className="recent-label">{t.label}</span>
                     <span className="recent-date">{t.date?.toLocaleString()}</span>
                  </div>
                  <div className={`recent-amount ${t.isNegative ? 'neg' : 'poz'}`}>
                     {t.isNegative ? '-' : '+'}{t.amount.toLocaleString("tr-TR")} ₺
                  </div>
               </div>
            ))}
            {recentTransactions.length === 0 && <p className="veri-yok">İşlem bulunamadı.</p>}
         </div>
      </div>

      {/* RAPOR MODÜLÜ */}
      <AdvancedReport />

    </div>
  );
}


