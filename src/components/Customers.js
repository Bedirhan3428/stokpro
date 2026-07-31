"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FiUserPlus, FiSearch, FiTrash2, FiPhone, FiDollarSign, 
  FiX, FiArrowRight, FiTrendingUp, FiTrendingDown, FiUser, FiCheckCircle, FiEdit2
} from "react-icons/fi";
import { 
  addCustomer, 
  updateCustomer,
  deleteCustomer, 
  addCustomerPayment, 
  listCustomerSales, 
  listCustomerPayments 
} from "../utils/firebaseHelpers";
import { 
  syncFullMasterStore, 
  getMasterStoreSnapshot, 
  subscribeToMasterStore,
  updateMemoryStoreOptimistically,
  invalidateAndRefreshMasterCache
} from "../utils/masterDataCache";
import useSubscription from "../hooks/useSubscription";
import Toast from "./Toast";

// TELEFON NUMARALARINI DÜZENLİ VE OKUNAKLI FORMATLAMA (0 (5XX) XXX XX XX)
export function formatPhone(phoneStr) {
  if (!phoneStr) return "";
  const cleaned = String(phoneStr).replace(/\D/g, "");
  let num = cleaned;
  if (num.startsWith("90") && num.length === 12) {
    num = num.substring(2);
  }
  if (!num.startsWith("0") && num.length === 10) {
    num = "0" + num;
  }
  if (num.length === 11) {
    return `${num.substring(0, 1)} (${num.substring(1, 4)}) ${num.substring(4, 7)} ${num.substring(7, 9)} ${num.substring(9, 11)}`;
  }
  return phoneStr;
}

export default function Customers() {
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Popup Modal Controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCust, setEditingCust] = useState(null);

  // New Customer Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [selectedCust, setSelectedCust] = useState(null);
  const [custSales, setCustSales] = useState([]);
  const [custPayments, setCustPayments] = useState([]);
  const [payAmount, setPayAmount] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [note, setNote] = useState(null);

  // Target Highlight State
  const [highlightedId, setHighlightedId] = useState(null);

  const { loading: subLoading, active: subActive } = useSubscription();

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4000);
  }

  useEffect(() => {
    const initialSnap = getMasterStoreSnapshot();
    if (initialSnap.customers && initialSnap.customers.length > 0) {
      setCustomers(initialSnap.customers);
      setLoading(false);
    }

    const unsubscribe = subscribeToMasterStore((store) => {
      if (store && store.customers) {
        setCustomers(store.customers);
        setLoading(false);
      }
    });

    syncFullMasterStore(false).then((store) => {
      if (store && store.customers) {
        setCustomers(store.customers);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => unsubscribe();
  }, []);

  // Deep Link Highlight Detection
  useEffect(() => {
    if (highlightParam && customers.length > 0) {
      const target = customers.find(c => c.id === highlightParam || c.name.toLowerCase() === highlightParam.toLowerCase());
      if (target) {
        setHighlightedId(target.id);
        setTimeout(() => {
          const el = document.getElementById(`cust-row-${target.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
        setTimeout(() => setHighlightedId(null), 5500);
      }
    }
  }, [highlightParam, customers]);

  async function musteriEkle() {
    if (!subActive) return bildir({ type: "error", title: "Kısıtlı Mod", message: "Müşteri eklemek için lisans anahtarınızı etkinleştirin." });
    if (!name.trim()) return bildir({ type: "error", title: "Eksik Alan", message: "Lütfen müşteri veya firma adını giriniz." });

    const cName = name.trim();
    const formattedP = formatPhone(phone);
    const cPhone = formattedP || phone.trim();
    const tempId = `cust_${Date.now()}`;

    setName(""); setPhone(""); setShowAddModal(false);

    // 0ms Anında yerel ekran güncellemesi (Optimistic UI)
    updateMemoryStoreOptimistically(store => {
      store.customers.unshift({ id: tempId, name: cName, phone: cPhone, balance: 0, createdAt: new Date().toISOString() });
      return store;
    });

    bildir({ type: "success", title: "Müşteri Kaydedildi", message: `"${cName}" müşteri rehberine eklendi.` });

    addCustomer({ name: cName, phone: cPhone }).catch(err => {
      console.error("Arka plan müşteri ekleme hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  async function musteriGuncelleKaydet() {
    if (!subActive || !editingCust) return;
    if (!editingCust.name.trim()) return bildir({ type: "error", title: "Eksik Alan", message: "Lütfen müşteri veya firma adını giriniz." });

    const targetId = editingCust.id;
    const updatedName = editingCust.name.trim();
    const formattedP = formatPhone(editingCust.phone);
    const updatedPhone = formattedP || editingCust.phone.trim();

    setEditingCust(null);

    // 0ms Anında yerel ekran güncellemesi (Optimistic UI)
    updateMemoryStoreOptimistically(store => {
      const target = store.customers.find(c => c.id === targetId);
      if (target) {
        target.name = updatedName;
        target.phone = updatedPhone;
      }
      return store;
    });

    bildir({ type: "success", title: "Müşteri Güncellendi", message: `"${updatedName}" bilgileri güncellendi.` });

    updateCustomer(targetId, { name: updatedName, phone: updatedPhone }).catch(err => {
      console.error("Arka plan müşteri güncelleme hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  async function detayAc(cust) {
    setSelectedCust(cust);
    setModalLoading(true);
    setPayAmount("");
    try {
      const [sales, pays] = await Promise.all([
        listCustomerSales(cust.id),
        listCustomerPayments(cust.id)
      ]);
      setCustSales(Array.isArray(sales) ? sales : []);
      setCustPayments(Array.isArray(pays) ? pays : []);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  }

  async function odemeAl() {
    if (!subActive || !selectedCust) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return bildir({ type: "warning", title: "Geçersiz Tutar", message: "Lütfen 0'dan büyük bir ödeme tutarı giriniz." });

    const targetId = selectedCust.id;
    const custName = selectedCust.name;
    setPayAmount("");
    const newBal = (selectedCust.balance || 0) - amount;
    detayAc({ ...selectedCust, balance: newBal });

    // 0ms Anında yerel ekran güncellemesi
    updateMemoryStoreOptimistically(store => {
      const target = store.customers.find(c => c.id === targetId);
      if (target) target.balance = newBal;
      store.custPayments.unshift({ id: `pay_${Date.now()}`, customerId: targetId, amount, createdAt: new Date().toISOString() });
      return store;
    });

    bildir({ type: "success", title: "Tahsilat İşlendi", message: `"${custName}" müşterisinden ${amount.toLocaleString("tr-TR")} ₺ ödeme alındı.` });

    addCustomerPayment(targetId, { amount }).catch(err => {
      console.error("Arka plan tahsilat hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  async function silGercek() {
    if (!subActive || !confirmDelete) return;
    const targetId = confirmDelete.id;
    const cName = confirmDelete.name;

    setConfirmDelete(null);

    // 0ms Anında yerel ekran güncellemesi (Optimistic UI)
    updateMemoryStoreOptimistically(store => {
      store.customers = store.customers.filter(c => c.id !== targetId);
      return store;
    });

    bildir({ type: "info", title: "Müşteri Silindi", message: `"${cName}" rehberden kalıcı olarak silindi.` });

    deleteCustomer(targetId).catch(err => {
      console.error("Arka plan müşteri silme hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  const filtered = customers.filter(c => 
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || "").includes(searchTerm)
  );

  return (
    <div className="page-container">
      <Toast note={note} onClose={() => setNote(null)} />

      {/* MÜŞTERİ LİSTESİ TABLOSU */}
      <div className="prd-card">
        <div className="page-header-bar" style={{ marginBottom: '16px' }}>
          <div className="input-icon-wrapper" style={{ width: '320px' }}>
            <FiSearch className="input-icon" />
            <input 
              placeholder="Müşteri adı veya telefon ile süzün..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input" 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="table-badge blue" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              Toplam {filtered.length} Müşteri
            </span>
            <button className="modern-btn primary" onClick={() => setShowAddModal(true)} disabled={!subActive}>
              <FiUserPlus size={18} /> Yeni Müşteri Ekle
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Müşteriler yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiSearch size={44} style={{ marginBottom: '10px' }} />
            <p>Müşteri kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '44px', textAlign: 'center' }}>İkon</th>
                  <th>Müşteri / Firma Adı</th>
                  <th>Telefon Numarası</th>
                  <th style={{ textAlign: 'right' }}>Güncel Bakiye</th>
                  <th style={{ textAlign: 'center' }}>Bakiye Durumu</th>
                  <th style={{ textAlign: 'center', width: '200px' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const bal = Number(c.balance || 0);
                  const isTarget = highlightedId === c.id;
                  const displayPhone = formatPhone(c.phone);

                  return (
                    <tr 
                      key={c.id}
                      id={`cust-row-${c.id}`}
                      className={isTarget ? "row-highlight-pulse" : ""}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <div className="tbl-avatar" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto' }}>
                          <FiUser size={16} />
                        </div>
                      </td>
                      <td>
                        <strong>{c.name}</strong>
                        {isTarget && (
                          <span className="table-badge purple" style={{ marginLeft: '8px' }}>AI VURGULANAN MÜŞTERİ</span>
                        )}
                      </td>
                      <td>
                        {displayPhone ? (
                          <a href={`tel:${c.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                            <FiPhone size={14} /> {displayPhone}
                          </a>
                        ) : <span style={{ color: 'var(--text-light)' }}>-</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: bal > 0 ? 'var(--danger)' : bal < 0 ? 'var(--success)' : 'var(--text-main)' }}>
                        {bal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`table-badge ${bal > 0 ? 'red' : bal < 0 ? 'green' : 'gray'}`}>
                          {bal > 0 ? 'Borçlu' : bal < 0 ? 'Alacaklı' : 'Dengede'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button 
                            onClick={() => detayAc(c)} 
                            className="tbl-btn primary" 
                            style={{ height: '30px', padding: '0 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                          >
                            <FiDollarSign size={14} /> Ekstre
                          </button>
                          <button 
                            onClick={() => setEditingCust({ id: c.id, name: c.name, phone: c.phone || "" })} 
                            className="tbl-btn secondary icon-only" 
                            style={{ width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
                            title="Müşteriyi Düzenle"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button 
                            onClick={() => setConfirmDelete(c)} 
                            className="tbl-btn danger icon-only" 
                            style={{ width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
                            title="Müşteriyi Sil"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* YENİ MÜŞTERİ POPUP MODALI */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h4><FiUserPlus style={{ color: 'var(--primary)' }} /> Yeni Müşteri Kaydı</h4>
              <button onClick={() => setShowAddModal(false)} className="close-btn"><FiX /></button>
            </div>
            <div className="modal-body">
              <label>Müşteri / Firma Adı *</label>
              <input 
                placeholder="Örn: Ahmet Yılmaz veya ABC İnşaat Ltd." 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="modern-input"
                autoFocus 
              />

              <label style={{ marginTop: '10px' }}>Telefon Numarası (Otomatik Formatlanır)</label>
              <input 
                placeholder="0 (5xx) xxx xx xx" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                onBlur={() => setPhone(prev => formatPhone(prev))}
                className="modern-input" 
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={musteriEkle} className="modern-btn primary" disabled={!subActive}>
                Müşteriyi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MÜŞTERİ BİLGİLERİ DÜZENLEME POPUP MODALI */}
      {editingCust && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h4><FiEdit2 style={{ color: 'var(--primary)' }} /> Müşteri Bilgilerini Düzenle</h4>
              <button onClick={() => setEditingCust(null)} className="close-btn"><FiX /></button>
            </div>
            <div className="modal-body">
              <label>Müşteri / Firma Adı *</label>
              <input 
                value={editingCust.name} 
                onChange={e => setEditingCust(prev => ({ ...prev, name: e.target.value }))} 
                className="modern-input"
                autoFocus 
              />

              <label style={{ marginTop: '10px' }}>Telefon Numarası (Otomatik Formatlanır)</label>
              <input 
                value={editingCust.phone} 
                onChange={e => setEditingCust(prev => ({ ...prev, phone: e.target.value }))}
                onBlur={() => setEditingCust(prev => ({ ...prev, phone: formatPhone(prev.phone) }))}
                className="modern-input" 
                placeholder="0 (5xx) xxx xx xx"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditingCust(null)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={musteriGuncelleKaydet} className="modern-btn primary" disabled={!subActive}>
                Güncelle ve Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HESAP / TAHSİLAT HAREKETLERİ POPUP MODALI */}
      {selectedCust && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h4>Cari Ekstre: {selectedCust.name}</h4>
              <button onClick={() => setSelectedCust(null)} className="close-btn"><FiX /></button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>İletişim:</span>
                  <strong style={{ marginLeft: '6px', fontSize: '0.9rem' }}>{formatPhone(selectedCust.phone) || "Telefon Belirtilmedi"}</strong>
                </div>
                <div>
                  <span>Bakiye: </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: (selectedCust.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {(selectedCust.balance || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label>Tahsilat Al (₺)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={payAmount} 
                    onChange={e => setPayAmount(e.target.value)} 
                    className="modern-input"
                  />
                </div>
                <button onClick={odemeAl} className="modern-btn success" disabled={!subActive}>
                  <FiCheckCircle size={18} /> Ödemeyi Al
                </button>
              </div>

              <h5 style={{ marginTop: '14px', borderBottom: '1px solid var(--border-main)', paddingBottom: '6px' }}>Son Veresiye Satışlar</h5>
              <div className="table-responsive-wrapper" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                {custSales.length === 0 ? (
                  <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Veresiye satış bulunmuyor.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th style={{ textAlign: 'right' }}>Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custSales.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontSize: '0.8rem' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                            {Number(s.totals?.total || s.total || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <h5 style={{ marginTop: '14px', borderBottom: '1px solid var(--border-main)', paddingBottom: '6px' }}>Yapılan Tahsilatlar</h5>
              <div className="table-responsive-wrapper" style={{ maxHeight: '140px', overflowY: 'auto' }}>
                {custPayments.length === 0 ? (
                  <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tahsilat kaydı bulunmuyor.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th style={{ textAlign: 'right' }}>Ödenen Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custPayments.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontSize: '0.8rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                            {Number(p.amount || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedCust(null)} className="modern-btn ghost">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAYI POPUP */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h4>Müşteri Silinsin mi?</h4>
              <button onClick={() => setConfirmDelete(null)} className="close-btn"><FiX /></button>
            </div>
            <div className="modal-body">
              <p><b>{confirmDelete.name}</b> isimli müşteri kalıcı olarak silinecektir.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={silGercek} className="modern-btn danger">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
