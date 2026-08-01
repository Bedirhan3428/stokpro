"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  syncFullMasterStore, 
  getMasterStoreSnapshot, 
  subscribeToMasterStore 
} from "../utils/masterDataCache";
import useSubscription from "../hooks/useSubscription";
import InvoiceModal from "./InvoiceModal";
import { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, FiCalendar, 
  FiFilter, FiFileText, FiAlertCircle, FiPrinter, FiSearch, FiRefreshCw, FiGrid
} from "react-icons/fi";

function parseDateKey(d) {
  try {
    const dt = typeof d === "object" && d?.toDate ? d.toDate() : new Date(d);
    return isNaN(dt.getTime()) ? 0 : dt.getTime();
  } catch { return 0; }
}

function formatDateStr(d) {
  try {
    const dt = typeof d === "object" && d?.toDate ? d.toDate() : new Date(d);
    return isNaN(dt.getTime()) ? "Bilinmeyen Tarih" : dt.toLocaleDateString("tr-TR");
  } catch { return "Bilinmeyen Tarih"; }
}

function formatDayHeaderStr(d) {
  try {
    const dt = typeof d === "object" && d?.toDate ? d.toDate() : new Date(d);
    if (isNaN(dt.getTime())) return "Tarih Belirtilmemiş";
    return dt.toLocaleDateString("tr-TR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return "Tarih Belirtilmemiş"; }
}

function moneyFormat(val) {
  return Number(val || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function buildLedgerFromStore(store) {
  if (!store) return [];
  const sales = store.sales || [];
  const pays = store.custPayments || [];
  const incomes = store.incomes || [];
  const expenses = store.expenses || [];

  let items = [];

  sales.forEach(s => {
    if (s.saleType === 'cash') {
      items.push({
        id: `sale_${s.id}`,
        type: 'sale',
        label: 'Nakit Satış',
        amount: Number(s.totals?.total || s.total || 0),
        isIncome: true,
        date: s.createdAt || s.date,
        rawSale: s
      });
    }
  });

  pays.forEach(p => {
    items.push({
      id: `pay_${p.id}`,
      type: 'payment',
      label: 'Müşteri Tahsilatı',
      amount: Number(p.amount || 0),
      isIncome: true,
      date: p.createdAt || p.date,
      rawPay: p
    });
  });

  incomes.forEach(i => {
    items.push({
      id: `inc_${i.id}`,
      type: 'income',
      label: i.description || 'Ek Gelir',
      amount: Number(i.amount || 0),
      isIncome: true,
      date: i.createdAt || i.date,
      rawIncome: i
    });
  });

  expenses.forEach(e => {
    items.push({
      id: `exp_${e.id}`,
      type: 'expense',
      label: e.description || 'Gider Kaydı',
      amount: Number(e.amount || 0),
      isIncome: false,
      date: e.createdAt || e.date,
      rawExpense: e
    });
  });

  items.sort((a, b) => parseDateKey(b.date) - parseDateKey(a.date));
  return items;
}

export default function Accounting() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // DETAYLI FİLTRELEME STATE'LERİ
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [datePreset, setDatePreset] = useState("all"); // 'all', 'today', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Fatura Modal State
  const [activeInvoice, setActiveInvoice] = useState(null);

  const { loading: subLoading, active: subActive } = useSubscription();

  useEffect(() => {
    const initialSnap = getMasterStoreSnapshot();
    if (initialSnap) {
      setLedger(buildLedgerFromStore(initialSnap));
      setLoading(false);
    }

    const unsubscribe = subscribeToMasterStore((store) => {
      if (store) {
        setLedger(buildLedgerFromStore(store));
        setLoading(false);
      }
    });

    syncFullMasterStore(false).then((store) => {
      if (store) {
        setLedger(buildLedgerFromStore(store));
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => unsubscribe();
  }, []);

  // AKILLI TARİH VEYA DETAYLI HAREKET FİLTRELEME ALGORİTMASI
  const filteredLedger = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - (6 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return ledger.filter(item => {
      // 1. Metin Arama Filtresi
      const t = searchTerm.toLowerCase();
      if (t) {
        const matchesLabel = (item.label || "").toLowerCase().includes(t);
        const matchesDate = formatDateStr(item.date).includes(t);
        if (!matchesLabel && !matchesDate) return false;
      }

      // 2. İşlem Tipi Filtresi
      if (filterType === "income_only" && !item.isIncome) return false;
      if (filterType === "expense_only" && item.isIncome) return false;
      if (["sale", "payment", "income", "expense"].includes(filterType) && item.type !== filterType) return false;

      // 3. Tarih Aralığı Filtresi
      const itemTime = parseDateKey(item.date);
      if (datePreset === "today" && itemTime < todayStart) return false;
      if (datePreset === "week" && itemTime < weekStart) return false;
      if (datePreset === "month" && itemTime < monthStart) return false;
      if (datePreset === "custom") {
        if (startDate) {
          const sTime = new Date(startDate).getTime();
          if (itemTime < sTime) return false;
        }
        if (endDate) {
          const eTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
          if (itemTime > eTime) return false;
        }
      }

      // 4. Min/Max Tutar Filtresi
      if (minAmount && item.amount < Number(minAmount)) return false;
      if (maxAmount && item.amount > Number(maxAmount)) return false;

      return true;
    });
  }, [ledger, searchTerm, filterType, datePreset, startDate, endDate, minAmount, maxAmount]);

  // GÜNLERE GÖRE GRUPLANMIŞ LEDGER YAPISI
  const groupedLedger = useMemo(() => {
    const groups = [];
    let currentDayStr = null;
    let currentGroup = null;

    filteredLedger.forEach(item => {
      const dayStr = formatDateStr(item.date);
      if (dayStr !== currentDayStr) {
        currentDayStr = dayStr;
        currentGroup = {
          dayTitle: formatDayHeaderStr(item.date),
          dayDateStr: dayStr,
          totalIncome: 0,
          totalExpense: 0,
          items: []
        };
        groups.push(currentGroup);
      }

      if (item.isIncome) {
        currentGroup.totalIncome += item.amount;
      } else {
        currentGroup.totalExpense += item.amount;
      }
      currentGroup.items.push(item);
    });

    return groups;
  }, [filteredLedger]);

  // FİLTRELENEN ANLIK TOPLAM ÖZETLERİ
  const totals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredLedger.forEach(it => {
      if (it.isIncome) inc += it.amount;
      else exp += it.amount;
    });
    return { income: inc, expense: exp, net: inc - exp, count: filteredLedger.length };
  }, [filteredLedger]);

  function faturaGoster(item) {
    let rawItems = [];
    if (item.rawSale && Array.isArray(item.rawSale.items)) {
      rawItems = item.rawSale.items;
    }

    setActiveInvoice({
      label: item.label,
      total: item.amount,
      saleType: item.isIncome ? "Nakit / Gelir" : "Gider Çıktısı",
      customerName: item.rawSale?.customerName || item.label,
      items: rawItems,
      createdAt: item.date
    });
  }

  const isFilterActive = searchTerm || filterType !== "all" || datePreset !== "all" || startDate || endDate || minAmount || maxAmount;

  function resetFilters() {
    setSearchTerm("");
    setFilterType("all");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  }

  return (
    <div className="page-container">
      <InvoiceModal invoiceData={activeInvoice} onClose={() => setActiveInvoice(null)} />
      
      {!subLoading && !subActive && (
        <div className="alert-banner">
          <FiAlertCircle size={20} />
          <span>Hesabınız kısıtlı. Tüm özellikleri açmak için:</span>
          <Link href="/product-key" className="alert-link">Ücretsiz Etkinleştir</Link>
        </div>
      )}

      {/* MUHASEBE VE DEFTER ANLIK FİLTRE ÖZET KARTLARI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon green"><FiTrendingUp /></div>
          <div className="kpi-info">
            <span className="kpi-label">FİLTRELENEN GELİR GİRDİSİ</span>
            <span className="kpi-value">{moneyFormat(totals.income)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red"><FiTrendingDown /></div>
          <div className="kpi-info">
            <span className="kpi-label">FİLTRELENEN GİDER ÇIKTISI</span>
            <span className="kpi-value">{moneyFormat(totals.expense)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue"><FiDollarSign /></div>
          <div className="kpi-info">
            <span className="kpi-label">FİLTRELENEN NET BAKİYE</span>
            <span className="kpi-value" style={{ color: totals.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {moneyFormat(totals.net)}
            </span>
          </div>
        </div>
      </div>

      {/* ZENGİN FİLTRELEME VE DETAYLI FİNANSAL SÜZGEÇ BAR */}
      <div className="prd-card" style={{ marginBottom: '14px', padding: '12px 14px' }}>
        <div className="prd-filter-bar">
          
          {/* 1. METİN ARAMASI */}
          <div className="input-icon-wrapper prd-search-wrapper">
            <FiSearch className="input-icon" />
            <input 
              placeholder="Açıklama veya hareket ara..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input" 
            />
          </div>

          <div className="prd-filter-selects">
            {/* 2. İŞLEM TÜRÜ SÜZGEÇ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
              <FiFilter size={14} style={{ color: 'var(--text-muted)', shrink: 0 }} />
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)} 
                className="modern-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
              >
                <option value="all">Tüm İşlem Tipleri</option>
                <option value="income_only">🟢 Sadece Gelirler</option>
                <option value="expense_only">🔴 Sadece Giderler</option>
                <option value="sale">🛒 Nakit Satışlar</option>
                <option value="payment">👥 Müşteri Tahsilatları</option>
                <option value="income">➕ Ek Gelir Girişleri</option>
                <option value="expense">➖ Kasa Gider Çıktıları</option>
              </select>
            </div>

            {/* 3. TARİH ARALIĞI PRESET */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
              <FiCalendar size={14} style={{ color: 'var(--text-muted)', shrink: 0 }} />
              <select 
                value={datePreset} 
                onChange={e => setDatePreset(e.target.value)} 
                className="modern-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
              >
                <option value="all">Tüm Zamanlar</option>
                <option value="today">📅 Bugün</option>
                <option value="week">📅 Bu Hafta</option>
                <option value="month">📅 Bu Ay</option>
                <option value="custom">📆 Özel Tarih Aralığı</option>
              </select>
            </div>

            {/* ÖZEL TARİH SEÇİCİLER (EĞER ÖZEL SEÇİLDİYSE) */}
            {datePreset === "custom" && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="modern-input" 
                  style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="modern-input" 
                  style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }} 
                />
              </div>
            )}
          </div>

          {/* 4. MİN/MAKS TUTAR FİLTRESİ */}
          <input 
            type="number" 
            placeholder="Min ₺" 
            value={minAmount} 
            onChange={e => setMinAmount(e.target.value)} 
            className="modern-input" 
            style={{ width: '90px', padding: '6px 8px', fontSize: '0.8rem' }} 
          />
          <input 
            type="number" 
            placeholder="Max ₺" 
            value={maxAmount} 
            onChange={e => setMaxAmount(e.target.value)} 
            className="modern-input" 
            style={{ width: '90px', padding: '6px 8px', fontSize: '0.8rem' }} 
          />

          {/* SIFIRLA BUTONU */}
          {isFilterActive && (
            <button 
              onClick={resetFilters}
              className="modern-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Filtreleri Sıfırla"
            >
              <FiRefreshCw size={12} /> Sıfırla
            </button>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <span className="table-badge blue" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              {totals.count} İşlem Listeleniyor
            </span>
          </div>

        </div>
      </div>

      {/* KASA VE DEFTER HAREKETLERİ TABLOSU (GÜNLERE GÖRE BELİRGİN GRUPLANMIŞ) */}
      <div className="prd-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Hareketler yükleniyor...</div>
        ) : groupedLedger.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiSearch size={44} style={{ marginBottom: '10px' }} />
            <p>Seçilen filtrelere uygun finansal hareket bulunamadı.</p>
            {isFilterActive && (
              <button onClick={resetFilters} className="modern-btn secondary" style={{ marginTop: '12px' }}>
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MASAÜSTÜ TABLO GÖRÜNÜMÜ */}
            <div className="acc-desktop-table table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Tarih / Saat</th>
                    <th>Hareket Türü / Açıklama</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>Tür Rozeti</th>
                    <th style={{ textAlign: 'right', width: '160px' }}>Tutar</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>Fatura / Belge</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedLedger.map((group, gIdx) => (
                    <React.Fragment key={`group_${gIdx}`}>
                      {/* GÜN AYIRICI BELİRGİN BAŞLIK ŞERİDİ */}
                      <tr style={{ background: 'var(--bg-subtle)', borderTop: '2px solid var(--border-main)', borderBottom: '1.5px solid var(--border-main)' }}>
                        <td colSpan={5} style={{ padding: '8px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: 'var(--primary)', fontSize: '0.9rem' }}>
                              <FiCalendar size={15} /> {group.dayTitle} ({group.items.length} İşlem)
                            </span>
                            <div style={{ display: 'inline-flex', gap: '14px', fontSize: '0.82rem', fontWeight: 800 }}>
                              <span style={{ color: 'var(--success)' }}>Günlük Gelir: +{moneyFormat(group.totalIncome)}</span>
                              <span style={{ color: 'var(--danger)' }}>Günlük Gider: -{moneyFormat(group.totalExpense)}</span>
                              <span style={{ color: (group.totalIncome - group.totalExpense) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                Günlük Net: {moneyFormat(group.totalIncome - group.totalExpense)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* GÜN İÇİNDEKİ İŞLEMLER */}
                      {group.items.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {formatDateStr(item.date)}
                          </td>
                          <td>
                            <strong>{item.label}</strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`table-badge ${item.isIncome ? 'green' : 'red'}`}>
                              {item.isIncome ? '+ Gelir' : '- Gider'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: item.isIncome ? 'var(--success)' : 'var(--danger)' }}>
                            {item.isIncome ? '+' : '-'}{moneyFormat(item.amount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {(item.type === "sale" || item.rawSale) ? (
                              <button 
                                onClick={() => faturaGoster(item)} 
                                className="tbl-btn primary icon-only" 
                                title="Faturayı Görüntüle"
                              >
                                <FiFileText />
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBİL DEFTER HAREKETLERİ KART LİSTESİ (YANA KAYDIRMASIZ) */}
            <div className="acc-mobile-card-list">
              {groupedLedger.map((group, gIdx) => (
                <div key={`mob_group_${gIdx}`} className="acc-mobile-group">
                  <div className="acc-mobile-group-header">
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiCalendar size={14} /> {group.dayTitle} ({group.items.length})
                    </div>
                    <div className="acc-mobile-group-totals">
                      <span style={{ color: 'var(--success)' }}>+{moneyFormat(group.totalIncome)}</span>
                      <span style={{ color: 'var(--danger)' }}>-{moneyFormat(group.totalExpense)}</span>
                    </div>
                  </div>

                  <div className="acc-mobile-items">
                    {group.items.map((item) => (
                      <div key={`mob_${item.id}`} className="acc-mobile-item-card">
                        <div className="acc-mobile-item-header">
                          <strong className="acc-mobile-item-title">{item.label}</strong>
                          <span className={`table-badge ${item.isIncome ? 'green' : 'red'}`}>
                            {item.isIncome ? '+ Gelir' : '- Gider'}
                          </span>
                        </div>

                        <div className="acc-mobile-item-footer">
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {formatDateStr(item.date)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ fontSize: '0.95rem', fontWeight: 900, color: item.isIncome ? 'var(--success)' : 'var(--danger)' }}>
                              {item.isIncome ? '+' : '-'}{moneyFormat(item.amount)}
                            </strong>
                            {(item.type === "sale" || item.rawSale) && (
                              <button 
                                onClick={() => faturaGoster(item)} 
                                className="tbl-btn primary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                title="Fatura İncele"
                              >
                                <FiFileText size={12} /> Fatura
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
