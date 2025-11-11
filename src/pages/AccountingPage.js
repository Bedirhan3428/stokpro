import React, { useMemo } from 'react';
import { formatCurrency, getYearWeek, formatMonth } from '../utils/helpers';

const AccountingPage = ({ normalizedSales, expenses, incomes }) => { // incomes prop'u eklendi

    const { totalRevenue, totalExpenses, netProfit, categoryRevenue, monthlyReport, weeklyReport } = useMemo(() => {
        let totalRev = 0;
        const categoryMap = {};
        const monthlyMap = {};
        const weeklyMap = {};

        // 1. Satışları grupla
        normalizedSales.forEach(saleItem => {
            totalRev += saleItem.totalPrice;
            const saleDate = saleItem.date?.toDate() || new Date();

            const category = saleItem.category || 'Diğer';
            categoryMap[category] = (categoryMap[category] || 0) + saleItem.totalPrice;

            const yearMonth = saleDate.getFullYear() + '-' + String(saleDate.getMonth() + 1).padStart(2, '0');

            monthlyMap[yearMonth] = monthlyMap[yearMonth] || { revenue: 0, expense: 0 };
            monthlyMap[yearMonth].revenue += saleItem.totalPrice;

            const yearWeek = getYearWeek(saleDate);
            weeklyMap[yearWeek] = weeklyMap[yearWeek] || { revenue: 0, expense: 0 };
            weeklyMap[yearWeek].revenue += saleItem.totalPrice;
        });
        
        // YENİ: Diğer Gelirleri dahil et
        incomes.forEach(income => {
            const incomeDate = income.date?.getTime() ? new Date(income.date) : new Date();

            const yearMonth = incomeDate.getFullYear() + '-' + String(incomeDate.getMonth() + 1).padStart(2, '0');
            monthlyMap[yearMonth] = monthlyMap[yearMonth] || { revenue: 0, expense: 0 };
            monthlyMap[yearMonth].revenue += income.amount;

            const yearWeek = getYearWeek(incomeDate);
            weeklyMap[yearWeek] = weeklyMap[yearWeek] || { revenue: 0, expense: 0 };
            weeklyMap[yearWeek].revenue += income.amount;
            
            totalRev += income.amount;
        });


        // 2. Giderleri grupla
        let totalExp = 0;
        expenses.forEach(expense => {
            totalExp += expense.amount;
            const expenseDate = expense.date?.getTime() ? new Date(expense.date) : new Date();

            // Aylık Gider
            const yearMonth = expenseDate.getFullYear() + '-' + String(expenseDate.getMonth() + 1).padStart(2, '0');
            monthlyMap[yearMonth] = monthlyMap[yearMonth] || { revenue: 0, expense: 0 };
            monthlyMap[yearMonth].expense += expense.amount;

            // Haftalık Gider
            const yearWeek = getYearWeek(expenseDate);
            weeklyMap[yearWeek] = weeklyMap[yearWeek] || { revenue: 0, expense: 0 };
            weeklyMap[yearWeek].expense += expense.amount;
        });

        // 3. Raporları finalleştir ve sırala
        const sortedCategories = Object.entries(categoryMap)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);

        const sortedMonthly = Object.entries(monthlyMap)
            .map(([period, data]) => ({
                period,
                revenue: data.revenue || 0,
                expense: data.expense || 0,
                profit: (data.revenue || 0) - (data.expense || 0)
            }))
            .sort((a, b) => b.period.localeCompare(a.period));

        const sortedWeekly = Object.entries(weeklyMap)
            .map(([period, data]) => ({
                period,
                revenue: data.revenue || 0,
                expense: data.expense || 0,
                profit: (data.revenue || 0) - (data.expense || 0)
            }))
            .sort((a, b) => b.period.localeCompare(a.period));

        return {
            totalRevenue: totalRev,
            totalExpenses: totalExp,
            netProfit: totalRev - totalExp,
            categoryRevenue: sortedCategories,
            monthlyReport: sortedMonthly,
            weeklyReport: sortedWeekly
        };
    }, [normalizedSales, expenses, incomes]); // incomes dependency'ye eklendi


    return (
        <div className="page-container">
            <h1 className="page-title">Muhasebe & Finansal Raporlar</h1>

            {/* Finansal Özet (3 Kart) */}
            <div className="summary-grid">
                {/* Toplam Gelir */}
                <div className="summary-card revenue-card">
                    <h2 className="card-subtitle">Toplam Gelir</h2>
                    <p className="card-value value-revenue">
                        {formatCurrency(totalRevenue)}
                    </p>
                </div>
                {/* Toplam Gider */}
                <div className="summary-card expense-card">
                    <h2 className="card-subtitle">Toplam Gider</h2>
                    <p className="card-value value-expense">
                        {formatCurrency(totalExpenses)}
                    </p>
                </div>
                {/* Net Kâr */}
                <div className="summary-card profit-card">
                    <h2 className="card-subtitle">Net Kâr</h2>
                    <p className="card-value" style={{ color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>
                        {formatCurrency(netProfit)}
                    </p>
                </div>
            </div>

            {/* Raporlar Grid */}
            <div className="report-grid">

                {/* Aylık Kazanç/Kâr */}
                <div className="report-card monthly-report-card">
                    <h2 className="report-title">Aylık Finansal Rapor</h2>
                    <div className="table-wrapper">
                        <table className="data-table"><thead className="table-header"><tr className="header-row"><th className="table-th th-period">Ay</th><th className="table-th th-revenue">Gelir</th><th className="table-th th-expense">Gider</th><th className="table-th th-profit">Kâr</th></tr></thead><tbody className="table-body">{monthlyReport.length === 0 ? (<tr><td colSpan="4" className="table-td-empty">Veri yok.</td></tr>) : (monthlyReport.map((m) => (<tr key={m.period} className="table-row"><td className="table-td table-td-period">{formatMonth(m.period)}</td><td className="table-td table-td-revenue-val">{formatCurrency(m.revenue)}</td><td className="table-td table-td-expense-val">{formatCurrency(m.expense)}</td><td className="table-td table-td-profit-val" style={{ color: m.profit >= 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(m.profit)}</td></tr>)))}</tbody></table>
                    </div>
                </div>

                {/* Haftalık Kazanç/Kâr */}
                <div className="report-card weekly-report-card">
                    <h2 className="report-title">Haftalık Finansal Rapor</h2>
                    <div className="table-wrapper">
                        <table className="data-table"><thead className="table-header"><tr className="header-row"><th className="py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Hafta</th><th className="py-2 px-3 text-sm font-semibold text-gray-600 dark:text-green-300 text-right">Gelir</th><th className="py-2 px-3 text-sm font-semibold text-gray-600 dark:text-red-300 text-right">Gider</th><th className="py-2 px-3 text-sm font-semibold text-gray-600 dark:text-blue-300 text-right">Kâr</th></tr></thead><tbody className="table-body">{weeklyReport.length === 0 ? (<tr><td colSpan="4" className="table-td-empty">Veri yok.</td></tr>) : (weeklyReport.map((w) => (<tr key={w.period} className="table-row"><td className="table-td table-td-period">{w.period}</td><td className="table-td table-td-revenue-val">{formatCurrency(w.revenue)}</td><td className="table-td table-td-expense-val">{formatCurrency(w.expense)}</td><td className="table-td table-td-profit-val" style={{ color: w.profit >= 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(w.profit)}</td></tr>)))}</tbody></table>
                    </div>
                </div>

                {/* Kategori Bazlı Satış Geliri */}
                <div className="report-card category-report-card report-span-2">
                    <h2 className="report-title">Kategori Bazlı Satış Geliri</h2>
                    <div className="table-wrapper">
                        <table className="data-table"><thead className="table-header"><tr className="header-row"><th className="py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Kategori</th><th className="py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Gelir</th></tr></thead><tbody className="table-body">{categoryRevenue.length === 0 ? (<tr><td colSpan="2" className="table-td-empty">Veri yok.</td></tr>) : (categoryRevenue.map((cat) => (<tr key={cat.name} className="table-row"><td className="table-td table-td-category">{cat.name}</td><td className="table-td table-td-revenue-val-cat">{formatCurrency(cat.total)}</td></tr>)))}</tbody></table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AccountingPage;