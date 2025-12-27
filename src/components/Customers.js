import "../styles/Customers.css";
import React, { useEffect, useState } from "react";
import {
  listCustomers,
  addCustomer,
  getCustomer,
  listCustomerSales,
  listCustomerPayments,
  addCustomerPayment,
  updateCustomer,
  setCustomerBalance,
  deleteCustomer
} from "../utils/firebaseHelpers";
import useSubscription from "../hooks/useSubscription";

// Bildirim Bileşeni
function Bildirim({ note }) {
  if (!note) return null;
  const tip = note.type === "error" ? "hata" : note.type === "success" ? "basari" : "bilgi";
  return (
    <div className="cst-bildirim-bar">
      <div className={`cst-bildirim ${tip}`}>
        <div className="cst-bildirim-baslik">{note.title || "Bilgi"}</div>
        <div className="cst-bildirim-icerik">{note.message}</div>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);

  // Detay & Düzenleme State
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [custSales, setCustSales] = useState([]);
  const [custPayments, setCustPayments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState("payment"); // payment, edit, balance

  // Formlar
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBalance, setEditBalance] = useState("");

  const { loading: subLoading, active: subActive } = useSubscription();

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  // Veri Yükleme
  async function yenile() {
    setLoading(true);
    try {
      const data = await listCustomers();
      setCustomers((data || []).map((c) => ({ ...c, balance: Number(c.balance || 0) })));
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: "Müşteri listesi alınamadı." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    yenile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Müşteri Ekleme
  async function musteriEkle() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik", message: "İşlem için abonelik gerekli." });
    
    const tName = name.trim();
    if (!tName) return bildir({ type: "error", title: "Eksik", message: "Müşteri adı zorunludur." });

    try {
      await addCustomer({ name: tName, phone: phone.trim() });
      setName(""); setPhone("");
      await yenile();
      bildir({ type: "success", title: "Başarılı", message: "Müşteri eklendi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  // Detay Açma
  async function detayAc(cId) {
    setDetailLoading(true);
    setTab("payment"); // Varsayılan tab
    try {
      const [cust, sales, payments] = await Promise.all([
        getCustomer(cId),
        listCustomerSales(cId),
        listCustomerPayments(cId)
      ]);
      
      setDetailCustomer(cust);
      setCustSales(sales || []);
      setCustPayments(payments || []);
      
      // Formları doldur
      setEditName(cust?.name || "");
      setEditPhone(cust?.phone || "");
      setEditBalance(cust?.balance || 0);

    } catch (err) {
      bildir({ type: "error", title: "Hata", message: "Detaylar yüklenemedi." });
    } finally {
      setDetailLoading(false);
    }
  }

  // İşlemler
  async function odemeEkle() {
    if (!subActive) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return bildir({ type: "error", title: "Hata", message: "Geçerli tutar girin." });
    
    try {
      await addCustomerPayment(detailCustomer.id, { amount: amt, note: payNote });
      setPayAmount(""); setPayNote("");
      await detayAc(detailCustomer.id);
      await yenile(); // Ana listeyi de güncelle (bakiye değişti)
      bildir({ type: "success", title: "Başarılı", message: "Ödeme alındı." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  async function musteriGuncelle() {
    if (!subActive) return;
    try {
      await updateCustomer(detailCustomer.id, { name: editName, phone: editPhone });
      await detayAc(detailCustomer.id);
      await yenile();
      bildir({ type: "success", title: "Güncellendi", message: "Bilgiler kaydedildi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  async function bakiyeDuzelt() {
    if (!subActive) return;
    try {
      await setCustomerBalance(detailCustomer.id, Number(editBalance), "Manuel düzeltme");
      await detayAc(detailCustomer.id);
      await yenile();
      bildir({ type: "success", title: "Güncellendi", message: "Bakiye düzeltildi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  async function sil() {
    if (!subActive) return;
    if (!window.confirm("Bu müşteriyi ve tüm geçmişini silmek istediğinize emin misiniz?")) return;
    
    try {
      await deleteCustomer(detailCustomer.id);
      setDetailCustomer(null);
      await yenile();
      bildir({ type: "success", title: "Silindi", message: "Müşteri silindi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  return (
    <div className="cst-sayfa">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="cst-uyari-bar">
          <span>Abonelik Gerekli.</span> <a href="https://www.stokpro.shop/product-key">Satın Al</a>
        </div>
      )}

      {/* --- MÜŞTERİ EKLE --- */}
      <div className="cst-kart">
        <h3 className="cst-baslik">Hızlı Müşteri Ekle</h3>
        <div className="cst-form-grid">
          <input placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} className="cst-input" />
          <input placeholder="Telefon (5XX...)" value={phone} onChange={e => setPhone(e.target.value)} className="cst-input" />
          <button className="cst-btn primary" onClick={musteriEkle} disabled={!subActive}>Ekle</button>
        </div>
      </div>

      {/* --- MÜŞTERİ LİSTESİ --- */}
      <div className="cst-kart full-h">
        <h3 className="cst-baslik">Müşteriler ({customers.length})</h3>
        
        {loading ? (
          <div className="cst-loading"><div className="cst-spinner"></div>Yükleniyor...</div>
        ) : customers.length === 0 ? (
          <div className="cst-empty">Kayıtlı müşteri yok.</div>
        ) : (
          <div className="cst-liste">
            {customers.map(c => (
              <div key={c.id} className="cst-item">
                <div className="cst-info">
                  <div className="cst-name">{c.name}</div>
                  <div className="cst-meta">
                    <span>{c.phone || "Telefon yok"}</span>
                  </div>
                </div>
                
                <div className="cst-actions">
                  <div className="cst-balance">
                    <small>Bakiye</small>
                    <span className={c.balance > 0 ? "borclu" : "temiz"}>
                      {c.balance.toLocaleString("tr-TR", {style:"currency", currency:"TRY"})}
                    </span>
                  </div>
                  <button className="cst-btn ghost small" onClick={() => detayAc(c.id)}>Detay</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- DETAY MODALI --- */}
      {detailCustomer && (
        <div className="cst-modal-overlay">
          <div className="cst-modal large">
            <div className="cst-modal-header">
              <div>
                <h4>{detailCustomer.name}</h4>
                <span className="cst-modal-subtitle">{detailCustomer.phone || "Telefon Yok"}</span>
              </div>
              <button onClick={() => setDetailCustomer(null)} className="cst-close">×</button>
            </div>

            <div className="cst-modal-body split-view">
              
              {/* SOL KOLON: İŞLEMLER */}
              <aside className="cst-left-panel">
                <div className="cst-tabs">
                  <button className={`cst-tab ${tab==='payment'?'active':''}`} onClick={()=>setTab('payment')}>Ödeme Al</button>
                  <button className={`cst-tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Düzenle</button>
                  <button className={`cst-tab ${tab==='balance'?'active':''}`} onClick={()=>setTab('balance')}>Bakiye</button>
                </div>

                <div className="cst-panel-content">
                  {tab === 'payment' && (
                    <div className="cst-form-stack">
                      <div className="cst-balance-display">
                        <small>Güncel Borç</small>
                        <strong>{Number(detailCustomer.balance).toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}</strong>
                      </div>
                      <label>Tahsilat Tutarı</label>
                      <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="cst-input" placeholder="0.00" />
                      
                      <label>Not / Açıklama</label>
                      <textarea 
                        className="cst-input cst-textarea-expand" 
                        placeholder="Ödeme notu..." 
                        value={payNote}
                        onChange={e => setPayNote(e.target.value)}
                      />
                      <button className="cst-btn primary full" onClick={odemeEkle} disabled={!subActive}>Ödemeyi Kaydet</button>
                    </div>
                  )}

                  {tab === 'edit' && (
                    <div className="cst-form-stack">
                      <label>Ad Soyad</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} className="cst-input" />
                      <label>Telefon</label>
                      <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="cst-input" />
                      
                      <div className="cst-btn-group">
                        <button className="cst-btn primary" onClick={musteriGuncelle} disabled={!subActive}>Kaydet</button>
                        <button className="cst-btn danger" onClick={sil} disabled={!subActive}>Müşteriyi Sil</button>
                      </div>
                    </div>
                  )}

                  {tab === 'balance' && (
                    <div className="cst-form-stack">
                      <div className="cst-info-box">
                        Dikkat: Bakiyeyi manuel değiştirmek muhasebe kaydı oluşturmaz. Sadece düzeltme için kullanın.
                      </div>
                      <label>Yeni Bakiye</label>
                      <input type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} className="cst-input" />
                      <button className="cst-btn primary full" onClick={bakiyeDuzelt} disabled={!subActive}>Bakiyeyi Güncelle</button>
                    </div>
                  )}
                </div>
              </aside>

              {/* SAĞ KOLON: GEÇMİŞ */}
              <main className="cst-right-panel">
                <h5 className="cst-section-title">Hesap Hareketleri</h5>
                
                <div className="cst-history-list">
                  {/* Satışlar */}
                  {custSales.map(s => (
                    <div key={s.id} className="cst-history-item sale">
                      <div className="cst-icon sale">🛒</div>
                      <div className="cst-hist-info">
                        <div className="cst-hist-top">
                          <strong>Satış (Veresiye)</strong>
                          <span className="cst-amount debt">
                            +{Number(s.totals?.total||0).toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}
                          </span>
                        </div>
                        <div className="cst-hist-date">{new Date(s.createdAt).toLocaleString()}</div>
                        <div className="cst-hist-detail">
                          {(s.items||[]).map(i=>`${i.name} (${i.qty})`).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Ödemeler */}
                  {custPayments.map(p => (
                    <div key={p.id} className="cst-history-item payment">
                      <div className="cst-icon pay">💳</div>
                      <div className="cst-hist-info">
                        <div className="cst-hist-top">
                          <strong>Tahsilat</strong>
                          <span className="cst-amount credit">
                            -{Number(p.amount||0).toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}
                          </span>
                        </div>
                        <div className="cst-hist-date">{new Date(p.createdAt).toLocaleString()}</div>
                        {p.note && <div className="cst-hist-detail">"{p.note}"</div>}
                      </div>
                    </div>
                  ))}

                  {custSales.length === 0 && custPayments.length === 0 && (
                    <div className="cst-empty small">Henüz işlem yok.</div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

