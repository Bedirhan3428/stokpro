import React, { useEffect, useState } from "react";
import { 
  FiUserPlus, FiSearch, FiTrash2, FiPhone, FiDollarSign, 
  FiX, FiArrowRight, FiTrendingUp, FiTrendingDown, FiEdit3, FiActivity 
} from "react-icons/fi";
import { 
  listCustomers, 
  addCustomer, 
  deleteCustomer, 
  addCustomerPayment, 
  listCustomerSales, 
  listCustomerPayments 
} from "../utils/firebaseHelpers";
import "../styles/Customers.css"; // Senin gönderdiğin CSS dosyası varsayılıyor

const Customers = () => {
  // --- STATE ---
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Bildirim State'i
  const [notification, setNotification] = useState(null); // { message, type: 'basari' | 'hata' }

  // Modallar
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Detay Modalı Sekmeleri
  const [activeTab, setActiveTab] = useState("payment"); // 'payment' veya 'info'

  // Form Verileri
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Geçmiş Verileri
  const [customerHistory, setCustomerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- EFFECT ---
  useEffect(() => {
    loadCustomers();
  }, []);

  // Bildirim Gösterme Yardımcısı
  const showNotify = (msg, type = "basari") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- VERİ ÇEKME ---
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await listCustomers();
      // Borçlu olanlar (bakiye > 0) üstte olsun
      data.sort((a, b) => (b.balance || 0) - (a.balance || 0));
      setCustomers(data);
    } catch (error) {
      showNotify("Müşteriler yüklenemedi", "hata");
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD İŞLEMLERİ ---
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    
    try {
      await addCustomer(newCustomer);
      setShowAddModal(false);
      setNewCustomer({ name: "", phone: "" });
      loadCustomers();
      showNotify("Müşteri başarıyla eklendi.");
    } catch (error) {
      showNotify(error.message, "hata");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Bu müşteriyi silmek istediğine emin misin?")) {
      try {
        await deleteCustomer(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
        showNotify("Müşteri silindi.");
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
      } catch (error) {
        showNotify(error.message, "hata");
      }
    }
  };

  // --- DETAY & GEÇMİŞ ---
  const openCustomerDetail = async (customer) => {
    setSelectedCustomer(customer);
    setActiveTab("payment"); // Varsayılan sekme
    setHistoryLoading(true);
    
    try {
      // Paralel istek at
      const [sales, payments] = await Promise.all([
        listCustomerSales(customer.id),
        listCustomerPayments(customer.id)
      ]);

      // Verileri birleştir ve etiketle
      const combined = [
        ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt })),
        ...payments.map(p => ({ ...p, type: 'payment', date: p.createdAt }))
      ];

      // Tarihe göre sırala (Yeniden eskiye)
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCustomerHistory(combined);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;

    try {
      const { newBalance } = await addCustomerPayment(selectedCustomer.id, {
        amount: Number(paymentAmount),
        note: paymentNote
      });

      // UI Güncelleme (Local)
      setSelectedCustomer(prev => ({ ...prev, balance: newBalance }));
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, balance: newBalance } : c));
      
      // Geçmişe sahte ekleme (Tekrar fetch etmemek için)
      setCustomerHistory(prev => [{
        type: 'payment',
        amount: Number(paymentAmount),
        note: paymentNote,
        date: new Date().toISOString(),
        id: 'temp_' + Date.now()
      }, ...prev]);

      setPaymentAmount("");
      setPaymentNote("");
      showNotify(`Tahsilat alındı. Yeni Bakiye: ${newBalance} ₺`);
    } catch (error) {
      showNotify(error.message, "hata");
    }
  };

  // Filtreleme
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  // Para formatı
  const fmt = (num) => num?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

  return (
    <div className="cst-sayfa">
      
      {/* --- BİLDİRİM BAR --- */}
      {notification && (
        <div className="cst-bildirim-bar">
          <div className={`cst-bildirim ${notification.type}`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* --- ÜST KISIM --- */}
      <div className="cst-kart">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h2 className="cst-baslik">Müşteriler</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
              Toplam {customers.length} kayıt
            </div>
          </div>
          <button className="cst-btn primary" onClick={() => setShowAddModal(true)}>
            <FiUserPlus style={{ marginRight: 6 }} /> Yeni Müşteri
          </button>
        </div>

        <div className="cst-form-grid">
          <input 
            type="text" 
            className="cst-input" 
            placeholder="İsim veya telefon ile ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- LİSTE --- */}
      <div className="cst-liste">
        {loading ? (
          <div className="cst-loading">
            <div className="cst-spinner"></div>
            Veriler yükleniyor...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="cst-empty">Müşteri bulunamadı.</div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="cst-item" onClick={() => openCustomerDetail(customer)} style={{ cursor: 'pointer' }}>
              <div>
                <div className="cst-name">{customer.name}</div>
                {customer.phone && (
                  <div className="cst-meta"><FiPhone style={{ marginBottom: -2 }} /> {customer.phone}</div>
                )}
              </div>
              <div className="cst-actions">
                <div className="cst-balance">
                  <small>Bakiye</small>
                  <span className={customer.balance > 0 ? "borclu" : "temiz"}>
                    {fmt(customer.balance || 0)}
                  </span>
                </div>
                <button 
                  className="cst-btn ghost small" 
                  onClick={(e) => handleDelete(customer.id, e)}
                  title="Sil"
                >
                  <FiTrash2 />
                </button>
                <FiArrowRight style={{ color: 'var(--text-sub)' }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- EKLEME MODALI --- */}
      {showAddModal && (
        <div className="cst-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="cst-modal" onClick={e => e.stopPropagation()}>
            <div className="cst-modal-header">
              <h4>Yeni Müşteri</h4>
              <button className="cst-close" onClick={() => setShowAddModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="cst-form-stack">
              <div>
                <label>Ad Soyad</label>
                <input 
                  className="cst-input" 
                  autoFocus 
                  required 
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <label>Telefon</label>
                <input 
                  className="cst-input"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <button type="submit" className="cst-btn primary full">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAY MODALI (SPLIT VIEW) --- */}
      {selectedCustomer && (
        <div className="cst-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="cst-modal large" onClick={e => e.stopPropagation()}>
            
            <div className="cst-modal-header">
              <div>
                <h4>{selectedCustomer.name}</h4>
                <span className="cst-modal-subtitle">{selectedCustomer.phone || "Telefon Yok"}</span>
              </div>
              <button className="cst-close" onClick={() => setSelectedCustomer(null)}><FiX /></button>
            </div>

            <div className="cst-modal-body split-view">
              {/* SOL PANEL: İşlemler */}
              <div className="cst-left-panel">
                
                {/* Bakiye Göstergesi */}
                <div className="cst-balance-display">
                  <small>Güncel Bakiye</small>
                  <strong>{fmt(selectedCustomer.balance || 0)}</strong>
                </div>

                {/* Sekmeler */}
                <div className="cst-tabs">
                  <button 
                    className={`cst-tab ${activeTab === 'payment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payment')}
                  >
                    Hızlı Tahsilat
                  </button>
                  <button 
                    className={`cst-tab ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                  >
                    Bilgiler
                  </button>
                </div>

                {/* Sekme İçerikleri */}
                {activeTab === 'payment' && (
                  <form onSubmit={handlePaymentSubmit} className="cst-form-stack">
                    <div className="cst-info-box">
                      Buradan sadece nakit tahsilat girin. Satış yapmak için "Satış" sayfasını kullanın.
                    </div>
                    <div>
                      <label>Tutar (₺)</label>
                      <input 
                        type="number" 
                        className="cst-input"
                        placeholder="0.00"
                        min="0" step="0.01"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label>Not (Opsiyonel)</label>
                      <input 
                        type="text" 
                        className="cst-input"
                        placeholder="Elden alındı vb."
                        value={paymentNote}
                        onChange={e => setPaymentNote(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="cst-btn success full">
                      <FiDollarSign style={{ marginRight: 5 }} /> Tahsil Et
                    </button>
                  </form>
                )}

                {activeTab === 'info' && (
                  <div className="cst-form-stack">
                    <div className="cst-info-box">
                      Müşteri düzenleme özelliği yakında eklenecek.
                    </div>
                    <div>
                      <label>Kayıt Tarihi</label>
                      <input className="cst-input" disabled value={new Date(selectedCustomer.createdAt).toLocaleDateString()} />
                    </div>
                    <button className="cst-btn danger ghost full" onClick={(e) => handleDelete(selectedCustomer.id, e)}>
                      <FiTrash2 style={{ marginRight: 5 }} /> Müşteriyi Sil
                    </button>
                  </div>
                )}
              </div>

              {/* SAĞ PANEL: Geçmiş */}
              <div className="cst-right-panel">
                <h5 className="cst-section-title">Hesap Hareketleri</h5>
                
                {historyLoading ? (
                  <div className="cst-loading"><div className="cst-spinner"></div></div>
                ) : customerHistory.length === 0 ? (
                  <div className="cst-empty">Henüz işlem yok.</div>
                ) : (
                  <div className="cst-history-list">
                    {customerHistory.map((item, idx) => (
                      <div key={idx} className={`cst-history-item ${item.type}`}>
                        <div className="cst-icon">
                          {item.type === 'sale' ? <FiTrendingUp color="var(--danger)" /> : <FiTrendingDown color="var(--success)" />}
                        </div>
                        <div className="cst-hist-info">
                          <div className="cst-hist-top">
                            <strong>{item.type === 'sale' ? 'Veresiye Satış' : 'Tahsilat'}</strong>
                            <span className={`cst-amount ${item.type === 'sale' ? 'debt' : 'credit'}`}>
                              {item.type === 'sale' ? '+' : '-'}{fmt(item.totals?.total || item.amount || 0)}
                            </span>
                          </div>
                          <div className="cst-hist-date">
                            {new Date(item.date).toLocaleDateString('tr-TR')} • {new Date(item.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          {/* Detay/Not */}
                          {item.note && <div className="cst-hist-detail">{item.note}</div>}
                          {item.items && (
                             <div className="cst-hist-detail">
                               {item.items.map(i => i.name).join(", ").slice(0, 30)}{item.items.length > 1 ? "..." : ""}
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
