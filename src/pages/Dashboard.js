import React, { useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/helpers';
// removed: import { IconLoader } from '../components/Icons';  <-- unused import removed

const Dashboard = ({ products, normalizedSales, expenses, incomes, userProfile }) => {
  const totalStockValue = useMemo(() =>
    products.reduce((acc, p) => acc + (p.stock * p.price), 0),
    [products]
  );

  const lowStockList = useMemo(() =>
    products.filter(p => p.stock > 0 && p.stock <= 10).sort((a, b) => a.stock - b.stock),
    [products]
  );

  const userName = userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Kullanıcı';

  const recentSales = useMemo(() =>
    normalizedSales.slice(0, 5),
    [normalizedSales]
  );

  const totalSalesRevenue = useMemo(() =>
    normalizedSales.reduce((acc, sale) => acc + sale.totalPrice, 0),
    [normalizedSales]
  );
  
  const totalOtherIncome = useMemo(() =>
    incomes.reduce((acc, income) => acc + income.amount, 0),
    [incomes]
  );
  
  const totalRevenue = totalSalesRevenue + totalOtherIncome;
  
  const totalExpenses = useMemo(() =>
    expenses.reduce((acc, expense) => acc + expense.amount, 0),
    [expenses]
  );
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="page-container">
      <h1 className="page-title">Gösterge Paneli</h1>

      <p className="welcome-message">
        👋 Hoş Geldin, {userName}!
      </p>

<h3 style={{ color: '#fff', backgroundColor: '#f59e0b', padding: '12px', borderRadius: '8px', textAlign: 'center', margin: '16px' }}>
  ⚠️ DİKKAT: Önümüzdeki 1-3 gün içinde büyük güncelleme geliyor!<br/>
  Veresiye defteri, detaylı raporlar, haftalık kazanç tahmini ve daha fazlası eklenecek.<br/>
  Verileriniz güvende, sadece daha iyi olacak 🔥
</h3>
      
      <div className="summary-grid">
        <div className="summary-card revenue-card">
          <h2 className="card-subtitle">Toplam Gelir</h2>
          <p className="card-value value-revenue">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="summary-card expense-card">
          <h2 className="card-subtitle">Toplam Gider</h2>
          <p className="card-value value-expense">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="summary-card profit-card">
          <h2 className="card-subtitle">Net Kâr</h2>
          <p className="card-value" style={{ color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>
            {formatCurrency(netProfit)}
          </p>
        </div>
        <div className="summary-card stock-value-card">
          <h2 className="card-subtitle">Stok Değeri</h2>
          <p className="card-value value-stock">{formatCurrency(totalStockValue)}</p>
        </div>
      </div>

      <div className="report-grid grid-2-columns">
        <div className="report-card low-stock-card">
          <h2 className="report-title low-stock-title">🚨 Azalan Stok Listesi ( &le; 10)</h2>
          <div className="list-wrapper scroll-y-auto">
            {lowStockList.length === 0 ? (
              <p className="list-empty-message">Tebrikler! Tüm stoklar yeterli seviyede.</p>
            ) : (
              lowStockList.map(product => (
                <div key={product.id} className="list-item low-stock-item">
                  <span className="item-name">{product.name}</span>
                  <span className="item-stock-count">{product.stock} adet</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="report-card recent-sales-card">
          <h2 className="report-title">Son Satışlar</h2>
          <div className="table-wrapper scroll-x-auto">
            <table className="data-table">
              <thead className="table-header">
                <tr className="header-row header-row-sales">
                  <th className="table-th">Tarih</th>
                  <th className="table-th">Ürün Adı</th>
                  <th className="table-th">Adet</th>
                  <th className="table-th">Fiyat</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {recentSales.length === 0 ? (
                  <tr><td colSpan="4" className="table-td-empty">Henüz satış yapılmamış.</td></tr>
                ) : (
                  recentSales.map(sale => (
                    <tr key={sale.id} className="table-row">
                      <td className="table-td table-td-date">{formatDate(sale.date)}</td>
                      <td className="table-td table-td-name">{sale.productName}</td>
                      <td className="table-td table-td-quantity">{sale.quantity}</td>
                      <td className="table-td table-td-price table-td-price-revenue">{formatCurrency(sale.totalPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;