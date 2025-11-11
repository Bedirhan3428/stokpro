import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../utils/helpers';
import { IconTrash } from '../components/Icons';

// Yeni prop'lar: incomes, onAddIncome, onDeleteIncome eklendi
const ExpenseManager = ({ expenses, incomes, onAddExpense, onDeleteExpense, onAddIncome, onDeleteIncome, isSubscriptionActive }) => {
    
    // YENİ STATE: Formun hangi modda olduğunu tutar
    const [mode, setMode] = useState('expense'); // 'expense' | 'income' 
    
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Diğer');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10)); 
    const [localError, setLocalError] = useState(''); 

    const INCOME_CATEGORIES = ['Hizmet Geliri', 'Faiz/Temettü', 'İade', 'Diğer Gelir']; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(''); 

        const financeAmount = Number(amount);
        const submitFn = mode === 'expense' ? onAddExpense : onAddIncome;

        if (financeAmount <= 0 || !description || !category || !date) {
            setLocalError(`Lütfen tüm alanları doğru doldurun (${mode === 'expense' ? 'Gider' : 'Gelir'} Miktarı 0'dan büyük olmalı).`);
            return;
        }

        try {
            const data = {
                amount: financeAmount,
                description,
                category,
                date: new Date(date),
            };
            
            await submitFn(data); // Dinamik API çağrısı (Toast App.js'ten tetiklenir)

            // Başarılı işlem sonrası formu temizle
            setAmount('');
            setDescription('');
            setCategory('Diğer');
            setDate(new Date().toISOString().substring(0, 10));

        } catch (e) {
            // Hata Toast'ta görünecektir
        }
    };

    const handleDelete = async (financeId, financeType) => {
        try {
            if (financeType === 'expense') {
                await onDeleteExpense(financeId);
            } else {
                await onDeleteIncome(financeId);
            }
            // Toast App.js Hook'u tarafından tetiklenir
        } catch (e) {
             console.error('Silme işlemi başarısız.');
        }
    };

    // Tüm Finansal Kayıtları Birleştirme ve Sıralama
    const allFinanceRecords = useMemo(() => {
        const expensesWithFlag = expenses.map(e => ({ ...e, type: 'expense' }));
        const incomesWithFlag = incomes.map(i => ({ ...i, type: 'income' }));
        
        return [...expensesWithFlag, ...incomesWithFlag].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    }, [expenses, incomes]);


    // Toplam Hesaplamaları
    const totalExpenses = useMemo(() => expenses.reduce((acc, expense) => acc + expense.amount, 0), [expenses]);
    const totalIncomes = useMemo(() => incomes.reduce((acc, income) => acc + income.amount, 0), [incomes]);
    
    const currentCategories = mode === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    return (
        <div className="page-container expense-manager-page">

            <div className="content-grid grid-3-columns"> 

                {/* Gider/Gelir Ekleme Formu */}
                <div className="form-column"> 
                    <h1 className="page-title-small">Yeni {mode === 'expense' ? 'Gider' : 'Gelir'} Kaydet</h1>
                    
                    {/* ABONELİK BİTTİYSE UYARI */}
                    {!isSubscriptionActive && (
                        <div className="alert-message alert-restricted mb-4">
                            Üyelik süreniz dolduğu için **kayıt yapamazsınız**. Yalnızca okuma modundasınız.
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className={`form-card form-${mode}-add`}>
                        
                        {/* MOD SEÇİM BUTONLARI */}
                        <div className="finance-mode-switch">
                            <button 
                                type="button" 
                                onClick={() => setMode('expense')} 
                                className={`btn btn-mode ${mode === 'expense' ? 'btn-active-danger' : 'btn-inactive'}`}
                            >
                                Gider Ekle
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setMode('income')} 
                                className={`btn btn-mode ${mode === 'income' ? 'btn-active-success' : 'btn-inactive'}`}
                            >
                                Gelir Ekle
                            </button>
                        </div>

                        {/* YEREL HATA UYARISI */}
                        {localError && <div className="alert-message alert-error">{localError}</div>}

                        {/* Miktar */}
                        <div className="form-group">
                            <label htmlFor="amount" className="form-label">Miktar (TL)</label>
                            <input
                                id="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={!isSubscriptionActive} 
                                className={`form-input input-${mode}`}
                            />
                        </div>

                        {/* Kategori */}
                        <div className="form-group">
                            <label htmlFor="category" className="form-label">{mode === 'expense' ? 'Gider' : 'Gelir'} Kategorisi</label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={!isSubscriptionActive} 
                                className={`form-select input-${mode}`}
                            >
                                {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Açıklama & Tarih (Aynı Kalır) */}
                        <div className="form-group">
                            <label htmlFor="description" className="form-label">Açıklama</label>
                            <input
                                id="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={!isSubscriptionActive} 
                                className={`form-input input-${mode}`}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date" className="form-label">Tarih</label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                disabled={!isSubscriptionActive} 
                                className={`form-input input-${mode}`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!isSubscriptionActive} 
                            className={`btn btn-${mode === 'expense' ? 'danger' : 'success'} btn-full`}
                        >
                            {isSubscriptionActive ? `${mode === 'expense' ? 'Gideri' : 'Geliri'} Kaydet` : 'Üyelik Gerekiyor'}
                        </button>
                    </form>
                </div>

                {/* Gider/Gelir Listesi */}
                <div className="list-column column-span-2"> 
                    <div className="list-header">
                        <h2 className="report-title">Tüm Finansal Kayıtlar</h2>
                        <span className="total-expense-value">
                            Gider Toplam: {formatCurrency(totalExpenses)} / Gelir Toplam: {formatCurrency(totalIncomes)}
                        </span>
                    </div>

                    <div className="report-card expense-list-card">
                        <div className="table-wrapper scroll-y-auto max-h-lg">
                            <table className="data-table">
                                <thead className="table-header table-header-sticky">
                                    <tr className="header-row">
                                        <th className="table-th th-type">Tip</th>
                                        <th className="table-th th-date">Tarih</th>
                                        <th className="table-th th-description">Açıklama</th>
                                        <th className="table-th th-category">Kategori</th>
                                        <th className="table-th th-amount">Miktar</th>
                                        <th className="table-th th-actions"></th>
                                    </tr>
                                </thead>
                                <tbody className="table-body table-body-divide">
                                    {allFinanceRecords.length === 0 && (
                                        <tr><td colSpan="6" className="table-td-empty">Henüz kayıt bulunamadı.</td></tr>
                                    )}
                                    {allFinanceRecords.map(record => (
                                        <tr key={record.id} className={`table-row row-hover row-${record.type}`}>
                                            <td className={`table-td table-td-type text-${record.type}`}>{record.type === 'expense' ? 'Gider' : 'Gelir'}</td>
                                            <td className="table-td table-td-date">{formatDate(record.date)}</td>
                                            <td className="table-td table-td-description">{record.description}</td>
                                            <td className="table-td table-td-category">{record.category}</td>
                                            <td className={`table-td table-td-amount value-${record.type}`}>{formatCurrency(record.amount)}</td>
                                            <td className="table-td table-td-actions">
                                                <button
                                                    onClick={() => handleDelete(record.id, record.type)}
                                                    disabled={!isSubscriptionActive} 
                                                    className={`btn-icon btn-delete-${record.type}`}
                                                    title={isSubscriptionActive ? "Kaydı Sil" : "Üyelik Gerekli"}
                                                >
                                                    <IconTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseManager;