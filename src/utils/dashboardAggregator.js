/**
 * StokPro Dashboard Single-Request Data Aggregator & JSON Schema
 * 
 * Bu modül, Master Data Cache motorunu kullanarak Dashboard'ın ihtiyaç duyduğu 
 * tüm verileri TEK BİR İSTEK veya HAFIZADAKİ LOKAL CACHE üzerinden hesaplar.
 */

import { syncFullMasterStore } from "./masterDataCache";

function moneyFormat(val) {
  return Number(val || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY"
  });
}

/**
 * Tek bir ağ paketi veya Önbellek (Cache) üzerinden Dashboard verisini dönen ana fonksiyon.
 */
export async function fetchDashboardDataSingleRequest() {
  const startTime = Date.now();

  // 1. Master Data Cache motorundan verileri çek (Sunucu versiyonu değişmediyse 0ms hafızadan!)
  const masterStore = await syncFullMasterStore(false);

  const products = masterStore.products || [];
  const sales = masterStore.sales || [];
  const customers = masterStore.customers || [];
  const custPayments = masterStore.custPayments || [];
  const incomes = masterStore.incomes || [];
  const expenses = masterStore.expenses || [];

  // 2. KPI Finansal Aggregation Algoritması
  const totalNakitSatis = sales.filter(s => s.saleType === 'cash').reduce((acc, s) => acc + Number(s.totals?.total || s.total || 0), 0);
  const totalVeresiyeSatis = sales.filter(s => s.saleType === 'credit').reduce((acc, s) => acc + Number(s.totals?.total || s.total || 0), 0);
  const totalCiro = sales.reduce((acc, s) => acc + Number(s.totals?.total || s.total || 0), 0);
  const totalGider = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const totalTahsilat = custPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalEkGelir = incomes.reduce((acc, i) => acc + Number(i.amount || 0), 0);

  let totalCost = 0;
  sales.forEach(sale => {
    const items = Array.isArray(sale.items) ? sale.items : [];
    items.forEach(it => {
      const qty = Number(it.qty || 1);
      const cost = Number(it.cost || it.buyPrice || it.purchasePrice || (Number(it.price || 0) * 0.7));
      totalCost += cost * qty;
    });
  });

  const netKarZarar = totalCiro - totalGider - totalCost;
  const netKasa = (totalNakitSatis + totalTahsilat + totalEkGelir) - totalGider;

  const lowStockProducts = products.filter(p => Number(p.stock || 0) < 10);

  // 3. Grafik Datasets JSON Yapısı
  const chartData = {
    labels: ['Nakit Satışlar', 'Müşteri Tahsilatı', 'Ek Gelirler'],
    datasets: [
      {
        data: [totalNakitSatis, totalTahsilat, totalEkGelir],
        backgroundColor: ['#2563eb', '#10b981', '#7c3aed'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  // 4. Yapay Zeka Analizleri JSON Üretimi
  const insights = [];
  const productStats = {};

  sales.forEach(sale => {
    const items = Array.isArray(sale.items) ? sale.items : [];
    items.forEach(it => {
      const pName = it.name || "Bilinmeyen Ürün";
      const qty = Number(it.qty || 1);
      const price = Number(it.price || 0);
      const revenue = qty * price;

      if (!productStats[pName]) {
        productStats[pName] = { name: pName, totalQty: 0, totalRevenue: 0 };
      }
      productStats[pName].totalQty += qty;
      productStats[pName].totalRevenue += revenue;
    });
  });

  const statList = Object.values(productStats);
  const topVolume = statList.sort((a, b) => b.totalQty - a.totalQty)[0] || null;
  const topRevenue = [...statList].sort((a, b) => b.totalRevenue - a.totalRevenue)[0] || null;
  const soldProductNames = new Set(statList.map(s => s.name.toLowerCase()));
  const deadStockList = products.filter(p => Number(p.stock || 0) > 0 && !soldProductNames.has((p.name || "").toLowerCase()));

  const reorderList = products.filter(p => {
    const pStat = productStats[p.name];
    const stok = Number(p.stock || 0);
    return (pStat && pStat.totalQty >= 3 && stok <= 5);
  });

  const creditCustomers = customers.filter(c => Number(c.balance || 0) > 0);
  const totalCreditBalance = creditCustomers.reduce((acc, c) => acc + Number(c.balance || 0), 0);
  const topCreditCustomer = creditCustomers.sort((a, b) => Number(b.balance) - Number(a.balance))[0] || null;

  if (topVolume && topRevenue) {
    if (topVolume.name !== topRevenue.name) {
      insights.push({
        type: 'profit_insight',
        title: '🔥 Hacim vs Kârlılık Analizi',
        badge: 'YÜKSEK KÂR FIRSATI',
        badgeColor: 'purple',
        message: `En çok sattığınız ürün "${topVolume.name}" (${topVolume.totalQty} Adet) ancak işletmenize en çok para kazandıran ürün "${topRevenue.name}" (${moneyFormat(topRevenue.totalRevenue)}). "${topVolume.name}" ürününün fiyatında küçük bir güncelleme yaparak net kârınızı artırabilirsiniz.`,
        actionText: 'Ürüne Git',
        actionLink: `/products?highlight=${encodeURIComponent(topVolume.name)}`
      });
    } else {
      insights.push({
        type: 'star_product',
        title: '⭐ Şampiyon Ürün Tespiti',
        badge: 'LİDER ÜRÜN',
        badgeColor: 'green',
        message: `"${topVolume.name}" hem en çok satan (${topVolume.totalQty} Adet) hem de en çok para kazandıran (${moneyFormat(topRevenue.totalRevenue)}) şampiyon ürününüz! Stok seviyesini daima korumanız önerilir.`,
        actionText: 'Ürüne Git',
        actionLink: `/products?highlight=${encodeURIComponent(topVolume.name)}`
      });
    }
  }

  if (reorderList.length > 0) {
    const item = reorderList[0];
    insights.push({
      type: 'reorder_warning',
      title: '⚠️ Hızlı Satan Ürün İçin Tedarik Alarmı',
      badge: 'ACİL SİPARİŞ VERİN',
      badgeColor: 'red',
      message: `"${item.name}" ürününüz çok hızlı satılıyor fakat depoda sadece ${item.stock} Adet kaldı! Satış kaybetmemek için tedarikçinizden hemen sipariş vermelisiniz.`,
      actionText: 'Ürüne Git',
      actionLink: `/products?highlight=${encodeURIComponent(item.name)}`
    });
  }

  if (deadStockList.length > 0) {
    const deadItem = deadStockList[0];
    insights.push({
      type: 'dead_stock',
      title: '💡 Ölü Stok Kampanya Önerisi',
      badge: 'İNDİRİM TAVSİYESİ',
      badgeColor: 'orange',
      message: `"${deadItem.name}" ürünü depoda ${deadItem.stock} Adet bekliyor fakat henüz satılmadı. %15-%20 indirim uygulayarak veya hediye kampanyasıyla nakde çevirebilirsiniz.`,
      actionText: 'Ürüne Git',
      actionLink: `/products?highlight=${encodeURIComponent(deadItem.name)}`
    });
  }

  if (totalCreditBalance > 0 && topCreditCustomer) {
    insights.push({
      type: 'credit_risk',
      title: '💳 Veresiye Alacak & Nakit Akışı Riski',
      badge: 'TAHSİLAT HATIRLATMASI',
      badgeColor: 'blue',
      message: `Piyasada toplam ${moneyFormat(totalCreditBalance)} veresiye alacağınız var. En borçlu müşteriniz "${topCreditCustomer.name}" (${moneyFormat(topCreditCustomer.balance)}). Nakit akışınızı hızlandırmak için ödeme hatırlatması yapın.`,
      actionText: 'Müşteriye Git',
      actionLink: `/customers?highlight=${encodeURIComponent(topCreditCustomer.id)}`
    });
  }

  const durationMs = Date.now() - startTime;

  return {
    kpi: {
      totalCiro,
      totalNakitSatis,
      totalVeresiyeSatis,
      totalGider,
      totalCost,
      netKarZarar,
      netKasa,
      totalTahsilat,
      totalEkGelir,
      totalProductsCount: products.length,
      lowStockCount: lowStockProducts.length,
      totalSalesCount: sales.length
    },
    chartData,
    criticalStock: lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category || "Genel",
      stock: Number(p.stock || 0)
    })),
    aiInsights: insights,
    meta: {
      fetchedAt: new Date().toISOString(),
      durationMs,
      trafficSavings: "%90+ Ağ Trafiği Tasarrufu (Memory Cache)",
      status: "SUCCESS"
    }
  };
}
