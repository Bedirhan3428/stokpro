import React, { useEffect, useState } from "react";
import { 
  FiUserPlus, FiSearch, FiTrash2, FiPhone, FiDollarSign, 
  FiClock, FiX, FiArrowRight, FiTrendingUp, FiTrendingDown 
} from "react-icons/fi";
import { 
  listCustomers, 
  addCustomer, 
  deleteCustomer, 
  addCustomerPayment, 
  listCustomerSales, 
  listCustomerPayments 
} from "../utils/firebaseHelpers";
import "../styles/Customers.css";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modallar
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Detaylar için
  const [showPaymentInput, setShowPaymentInput] = useState(false); // Detay içindeki ödeme alanı

  // Yeni Müşteri Formu
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  
  // Ödeme Formu
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Detay Verileri
  const [customerHistory, setCustomerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await listCustomers();
      // Bakiyeye göre sırala (Borçlu en üstte)
      data.sort((a, b) => (b.balance || 0) - (a.balance || 0));
      setCustomers(data);
    } catch (error) {
      console.error("Müşteriler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Müşteri Ekleme
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return alert("İsim gerekli!");
    
    try {
      await addCustomer(newCustomer);
      setShowAddModal(false);
      setNewCustomer({ name: "", phone: "" });
      loadCustomers(); // Listeyi yenile
    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  // Müşteri Silme
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Kartın detayını açmayı engelle
    if (window.confirm("Bu müşteriyi ve tüm kayıtlarını silmek istediğine emin misin?")) {
      try {
        await deleteCustomer(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        alert("Silinemedi: " + error.message);
      }
    }
  };

  // Detayları Getirme (Satışlar + Ödemeler)
  const openCustomerDetail = async (customer) => {
    setSelectedCustomer(customer);
    setHistoryLoading(true);
    setShowPaymentInput(false);
    
    try {
      const sales = await listCustomerSales(customer.id);
      const payments = await listCustomerPayments(customer.id);

      // Verileri birleştir ve formatla
      const combined = [
        ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt })),
        ...payments.map(p => ({ ...p, type: 'payment', date: p.createdAt }))
      ];

      // Tarihe göre yeniden eskiye sırala
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCustomerHistory(combined);
    } catch (error) {
      console.error("Detay hatası:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Tahsilat Ekleme
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return alert("Geçerli tutar girin.");

    try {
      const { newBalance } = await addCustomerPayment(selectedCustomer.id, {
        amount: Number(paymentAmount),
        note: paymentNote
      });

      // UI Güncelleme (Sayfa yenilemeden)
      setSelectedCustomer(prev => ({ ...prev, balance: newBalance }));
      
      // Ana listeyi de güncelle
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, balance: newBalance } : c));

      // Geçmişe ekle (Fake ekleme yapıyoruz tekrar çekmemek için)
      setCustomerHistory(prev => [{
        type: 'payment',
        amount: Number(paymentAmount),
        note: paymentNote,
        date: new Date().toISOString(),
        id: 'temp_' + Date.now()
      }, ...prev]);

      setPaymentAmount("");
      setPaymentNote("");
      setShowPaymentInput(false);
      alert("Tahsilat başarıyla eklendi.");
    } catch (error) {
      alert("Ödeme hatası: " + error.message);
    }
  };

  // Filtreleme
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="customers-container">
      {/* ÜST BAR */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Müşteriler & Veresiye</h1>
          <p className="page-subtitle">Toplam {customers.length} kayıtlı müşteri</p>
        </div>
        <button className="primary-btn" onClick={() => setShowAddModal(true)}>
          <FiUserPlus /> Yeni Müşteri
        </button>
      </div>

      {/* ARAMA */}
      <div className="search-bar-wrapper">
        <FiSearch className="search-icon" />
        <input 
          type="text" 
          placeholder="Müşteri adı veya telefon ara..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LİSTE */}
      {loading ? (
        <div className="loading-state">Yükleniyor...</div>
      ) : (
        <div className="customers-grid">
          {filteredCustomers.length === 0 ? (
            <div className="empty-state">Kayıt bulunamadı.</div>
          ) : (
            filteredCustomers.map(customer => (
              <div 
                key={customer.id} 
                className="customer-card"
                onClick={() => openCustomerDetail(customer)}
              >
                <div className="card-header">
                  <div className="avatar">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="info">
                    <h3>{customer.name}</h3>
                    {customer.phone && <small><FiPhone /> {customer.phone}</small>}
                  </div>
                </div>
                
                <div className="card-balance">
                  <span>Bakiye:</span>
                  <span className={`amount ${customer.balance > 0 ? 'debt' : 'clean'}`}>
                    {customer.balance?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- MÜŞTERİ EKLEME MODALI --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Yeni Müşteri Ekle</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div className="form-group">
                <label>Ad Soyad</label>
                <input 
                  type="text" 
                  autoFocus
                  required 
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Telefon (İsteğe bağlı)</label>
                <input 
                  type="tel" 
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <button type="submit" className="save-btn">Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAY MODALI (SLIDE OVER GÖRÜNÜM) --- */}
      {selectedCustomer && (
        <div className="modal-overlay detail-overlay">
          <div className="detail-modal">
            <div className="detail-header">
              <button className="back-btn" onClick={() => setSelectedCustomer(null)}>
                <FiArrowRight /> Geri
              </button>
              <div className="customer-summ">
                <h2>{selectedCustomer.name}</h2>
                <span className={`status-badge ${selectedCustomer.balance > 0 ? 'red' : 'green'}`}>
                  {selectedCustomer.balance > 0 ? 'Borçlu' : 'Borcu Yok'}
                </span>
              </div>
              <button className="delete-icon-btn" onClick={(e) => handleDelete(selectedCustomer.id, e)}>
                <FiTrash2 />
              </button>
            </div>

            <div className="detail-balance-box">
              <p>Güncel Bakiye</p>
              <h1>{selectedCustomer.balance?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h1>
              <button 
                className="pay-btn"
                onClick={() => setShowPaymentInput(!showPaymentInput)}
              >
                <FiDollarSign /> Tahsilat Al
              </button>
            </div>

            {/* Tahsilat Formu (Açılır/Kapanır) */}
            {showPaymentInput && (
              <form className="payment-form" onSubmit={handlePaymentSubmit}>
                <input 
                  type="number" 
                  placeholder="Tutar (₺)" 
                  required
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Not (Opsiyonel)" 
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                />
                <button type="submit">Onayla</button>
              </form>
            )}

            <div className="history-list">
              <h3>İşlem Geçmişi</h3>
              {historyLoading ? <p>Yükleniyor...</p> : (
                customerHistory.length === 0 ? <p className="no-data">İşlem kaydı yok.</p> : (
                  <ul>
                    {customerHistory.map((item, index) => (
                      <li key={index} className={`history-item ${item.type}`}>
                        <div className="icon">
                          {item.type === 'sale' ? <FiTrendingUp /> : <FiTrendingDown />}
                        </div>
                        <div className="details">
                          <span className="title">
                            {item.type === 'sale' ? 'Veresiye Satış' : 'Tahsilat'}
                          </span>
                          <span className="date">
                            {new Date(item.date).toLocaleDateString('tr-TR')} {new Date(item.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {item.note && <small className="note">Not: {item.note}</small>}
                        </div>
                        <div className="amount">
                          {item.type === 'sale' ? '+' : '-'}
                          {(item.totals?.total || item.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
