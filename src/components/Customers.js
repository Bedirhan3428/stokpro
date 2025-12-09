import "../styles/global.css";
import "../styles/Customers.css";

/* Customer management (updated)
 - UI-level subscription gating: disable create/edit/delete/payment actions when subscription inactive.
 - Inline styles moved to Customers.css and className usage applied.
*/
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

/* Basit uygulama içi bildirim bileşeni */
function Notification({ note }) {
  if (!note) return null;
  const cls = note.type === "error" ? "note-card note-error" : note.type === "success" ? "note-card note-success" : "note-card note-info";
  return (
    <div className={cls}>
      <div className="note-title">{note.title || (note.type === "error" ? "Hata" : "Bilgi")}</div>
      <div className="note-sub">{note.message}</div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  // detail modal
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [custSales, setCustSales] = useState([]);
  const [custPayments, setCustPayments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // payment & edit states
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBalance, setEditBalance] = useState("");

  // notification
  const [note, setNote] = useState(null);

  const { loading: subLoading, active: subActive } = useSubscription();

  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  async function refresh() {
    setLoading(true);
    try {
      const data = await listCustomers();
      setCustomers((data || []).map((c) => ({ ...c, balance: Number(c.balance || 0) })));
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Yükleme Hatası", message: String(err.message || err) });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, []);

  async function handleAddCustomer() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Müşteri eklemek için abonelik gereklidir." });
    const tName = (name || "").trim();
    const tPhone = (phone || "").trim();
    if (!tName) return showNote({ type: "error", title: "Eksik bilgi", message: "İsim gerekli." });
    if (!tPhone || tPhone.length < 6) return showNote({ type: "error", title: "Telefon hatası", message: "Geçerli bir telefon girin." });
    try {
      await addCustomer({ name: tName, phone: tPhone });
      setName("");
      setPhone("");
      await refresh();
      showNote({ type: "success", title: "Başarılı", message: "Müşteri eklendi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Kaydetme Hatası", message: String(err.message || err) });
    }
  }

  async function openDetails(customerId) {
    setDetailLoading(true);
    setEditMode(false);
    try {
      const cust = await getCustomer(customerId);
      const sales = await listCustomerSales(customerId);
      const payments = await listCustomerPayments(customerId);
      setDetailCustomer(cust);
      setCustSales(Array.isArray(sales) ? sales : []);
      setCustPayments(Array.isArray(payments) ? payments : []);
      setEditName(cust?.name || "");
      setEditPhone(cust?.phone || "");
      setEditBalance(cust?.balance != null ? String(Number(cust.balance || 0)) : "");
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Yükleme Hatası", message: "Detaylar yüklenemedi." });
      setDetailCustomer(null);
      setCustSales([]);
      setCustPayments([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAddPayment() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Ödeme eklemek için abonelik gereklidir." });
    const amt = Number(payAmount);
    if (!detailCustomer) return;
    if (!amt || amt <= 0) return showNote({ type: "error", title: "Geçersiz tutar", message: "Lütfen geçerli bir tutar girin." });
    const currentBalance = Number(detailCustomer.balance || 0);
    if (currentBalance <= 0) return showNote({ type: "error", title: "Borç yok", message: "Müşterinin borcu yok." });
    if (amt > currentBalance) return showNote({ type: "error", title: "Aşırı ödeme", message: `Maks: ${currentBalance}` });
    try {
      const res = await addCustomerPayment(detailCustomer.id, { amount: amt, note: payNote });
      await openDetails(detailCustomer.id);
      await refresh();
      setPayAmount("");
      setPayNote("");
      showNote({ type: "success", title: "Ödeme kaydedildi", message: `Yeni bakiye: ${res?.newBalance ?? ""}` });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Ödeme hatası", message: String(err.message || err) });
    }
  }

  async function handleSaveCustomer() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Güncelleme için abonelik gereklidir." });
    if (!detailCustomer) return;
    const tName = (editName || "").trim();
    const tPhone = (editPhone || "").trim();
    if (!tName) return showNote({ type: "error", title: "Eksik bilgi", message: "İsim gerekli." });
    try {
      await updateCustomer(detailCustomer.id, { name: tName, phone: tPhone || null });
      await openDetails(detailCustomer.id);
      await refresh();
      setEditMode(false);
      showNote({ type: "success", title: "Güncellendi", message: "Müşteri güncellendi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Güncelleme hatası", message: String(err.message || err) });
    }
  }

  async function handleSetBalance() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Bakiye düzenleme için abonelik gereklidir." });
    if (!detailCustomer) return;
    const nb = Number(editBalance);
    if (isNaN(nb)) return showNote({ type: "error", title: "Geçersiz bakiye", message: "Lütfen geçerli sayı girin." });
    try {
      const res = await setCustomerBalance(detailCustomer.id, nb, "Manual edit");
      await openDetails(detailCustomer.id);
      await refresh();
      showNote({ type: "success", title: "Bakiye güncellendi", message: `Yeni bakiye: ${res?.newBalance ?? ""}` });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Güncelleme hatası", message: String(err.message || err) });
    }
  }

  async function handleDeleteCustomer() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Silme için abonelik gereklidir." });
    if (!detailCustomer) return;
    if (!window.confirm("Müşteriyi silmek istediğinize emin misiniz? (Alt koleksiyonlar da silinir)")) return;
    try {
      await deleteCustomer(detailCustomer.id);
      setDetailCustomer(null);
      await refresh();
      showNote({ type: "success", title: "Silindi", message: "Müşteri silindi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Silme hatası", message: String(err.message || err) });
    }
  }

  return (
    <div className="page-customers">
      <Notification note={note} />

      {!subLoading && !subActive && (
        <div className="card subscription-warning">
          <div className="warning-title">Abonelik gerekli</div>
          <div className="warning-sub">Yazma işlemleri devre dışı — aboneliğinizi Ayarlar sayfasından yönetebilirsiniz.</div>
        </div>
      )}

      <div className="card add-customer-card">
        <h3 className="section-title">Müşteri Ekle</h3>
        <div className="form-row">
          <input placeholder="Müşteri adı" value={name} onChange={(e) => setName(e.target.value)} className="auth-input input-flex" />
          <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} className="auth-input input-phone" />
          <button className="btn btn-primary" onClick={handleAddCustomer} disabled={!subActive}>Ekle</button>
        </div>
      </div>

      <div className="card customers-card">
        <h3 className="section-title">Müşteri Listesi</h3>
        {loading ? (
          <div className="app-loading"><div className="spinner" /><p>Yükleniyor...</p></div>
        ) : customers.length === 0 ? (
          <div className="muted-sub">Kayıtlı müşteri yok.</div>
        ) : (
          <div className="customer-list">
            {customers.map((c) => (
              <div key={c.id} className="customer-row card">
                <div className="customer-meta">
                  <div className="customer-name">{c.name}</div>
                  <div className="customer-phone muted-sub">Telefon: {c.phone || "—"}</div>
                  <div className="customer-balance muted-sub">Bakiye: {Number(c.balance || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                </div>
                <div className="customer-actions">
                  <button className="btn btn-ghost" onClick={() => openDetails(c.id)}>Detay</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal unchanged except layout classes */}
      {detailCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="detail-header">
              <div>
                <h3 className="detail-title">{detailCustomer.name}</h3>
                <div className="muted-sub">Telefon: {detailCustomer.phone || "—"}</div>
                <div className="muted-sub">Bakiye: {Number(detailCustomer.balance || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
              </div>

              <div className="detail-actions">
                <button className="btn btn-ghost" onClick={() => { setEditMode((s) => !s); setEditName(detailCustomer.name); setEditPhone(detailCustomer.phone || ""); }} disabled={!subActive}>Düzenle</button>
                <button className="btn btn-danger" onClick={handleDeleteCustomer} disabled={!subActive}>Sil</button>
                <button className="btn btn-ghost" onClick={() => setDetailCustomer(null)}>Kapat</button>
              </div>
            </div>

            <div className="modal-grid">
              {/* Left: edit or payment */}
              <aside className="left-column">
                {editMode ? (
                  <div className="card card-padded">
                    <h5 className="section-subtitle">Müşteri Düzenle</h5>
                    <label className="input-label">İsim</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="auth-input" />
                    <label className="input-label">Telefon</label>
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="auth-input" />
                    <div className="form-row" style={{ marginTop: 10 }}>
                      <button className="btn btn-primary" onClick={handleSaveCustomer} disabled={!subActive}>Kaydet</button>
                      <button className="btn btn-ghost" onClick={() => setEditMode(false)}>İptal</button>
                    </div>
                  </div>
                ) : (
                  <div className="card card-padded">
                    <h5 className="section-subtitle">Tahsilat / Ödeme Ekle</h5>
                    <label className="input-label">Tutar</label>
                    <input placeholder="Tutar" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="auth-input" />
                    <label className="input-label">Açıklama</label>
                    <textarea placeholder="Açıklama" value={payNote} onChange={(e) => setPayNote(e.target.value)} className="textarea-note" />
                    <div className="form-row" style={{ marginTop: 8 }}>
                      <button className="btn btn-primary" onClick={handleAddPayment} disabled={!subActive}>Kaydet</button>
                      <button className="btn btn-ghost" onClick={() => { setPayAmount(""); setPayNote(""); }}>Temizle</button>
                    </div>

                    <hr className="divider" />

                    <h5 className="section-subtitle">Bakiye Düzenle</h5>
                    <label className="input-label">Yeni Bakiye</label>
                    <input value={editBalance} onChange={(e) => setEditBalance(e.target.value)} className="auth-input" />
                    <div className="form-row" style={{ marginTop: 8 }}>
                      <button className="btn btn-primary" onClick={handleSetBalance} disabled={!subActive}>Güncelle</button>
                    </div>
                  </div>
                )}
              </aside>

              {/* Right: sales and payments */}
              <main className="right-column">
                <h4 className="section-title">Müşterinin Satışları</h4>
                {detailLoading ? <div className="muted-sub">Yükleniyor...</div> : custSales.length === 0 ? <div className="muted-sub">Satış yok.</div> : (
                  <div className="list-grid">
                    {custSales.map((s) => (
                      <div key={s.id} className="card sale-row">
                        <div className="sale-left">
                          <div className="sale-date">{new Date(s.createdAt).toLocaleString()}</div>
                          <div className="muted-sub">{(s.items || []).map(it => `${it.name} x${it.qty}`).join(", ")}</div>
                        </div>
                        <div className="sale-right">
                          <div className="sale-amount">{Number(s.totals?.total || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                          <div className="muted-sub">{s.saleType === "cash" ? "Nakit" : "Veresiye"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="payments-section">
                  <h4 className="section-title">Ödemeler</h4>
                  {detailLoading ? <div className="muted-sub">Yükleniyor...</div> : custPayments.length === 0 ? <div className="muted-sub">Ödeme kaydı yok.</div> : (
                    <div className="list-grid">
                      {custPayments.map((p) => (
                        <div key={p.id} className="card payment-row">
                          <div className="payment-left">
                            <div className="payment-date">{new Date(p.createdAt).toLocaleString()}</div>
                            <div className="muted-sub note-text">{p.note || ""}</div>
                          </div>
                          <div className="payment-amount">{Number(p.amount || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                        </div>
                      ))}
                    </div>
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