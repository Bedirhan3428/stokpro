import '../styles/global.css';
import '../styles/Sales.css';

import React, { useEffect, useMemo, useState } from "react";
import BarcodeScanner from "./BarcodeScanner";
import { listProductsForCurrentUser } from "../utils/artifactUserProducts";
import {
  listCustomers,
  finalizeSaleTransaction,
  listSales,
  updateSale,
  deleteSale,
  addLegacyIncome,
  addLegacyExpense
} from "../utils/firebaseHelpers";
import useSubscription from "../hooks/useSubscription";

/* Notification */
function Notification({ note }) {
  if (!note) return null;
  return (
    <div className={`note ${note.type === "error" ? "note-error" : note.type === "success" ? "note-success" : "note-info"}`}>
      <div className="note-title">{note.title || (note.type === "error" ? "Hata" : "Bilgi")}</div>
      <div className="note-body">{note.message}</div>
    </div>
  );
}

function saleTypeLabel(t) {
  if (t === "cash") return "Nakit";
  if (t === "credit") return "Veresiye";
  return t || "";
}

function parseDateKey(d) {
  try {
    const dt = typeof d === "object" && d?.toDate ? d.toDate() : new Date(d);
    if (isNaN(dt.getTime())) return 0;
    return dt.getTime();
  } catch {
    return 0;
  }
}

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState("cash");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [search, setSearch] = useState("");
 

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);

  const [editingSale, setEditingSale] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDesc, setIncomeDesc] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");

  const { loading: subLoading, active: subActive } = useSubscription();

  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  async function refreshAll() {
    setLoading(true);
    try {
      const [prods, custs, allSales] = await Promise.all([listProductsForCurrentUser(), listCustomers(), listSales()]);
      setProducts(Array.isArray(prods) ? prods : []);
      setCustomers(Array.isArray(custs) ? custs : []);

      const normalized = (Array.isArray(allSales) ? allSales : []).map((s) => {
        const itemsArr = Array.isArray(s.items) ? s.items : [];
        const items = itemsArr.map((it) => {
          const quantity = Number(it.qty ?? it.quantity ?? 1);

          const rawPrice = it.price ?? it.unitPrice ?? it.unit_price ?? null;
          let price = 0;
          if (rawPrice != null) {
            price = Number(rawPrice || 0);
          } else if (it.totalPrice != null || it.total_price != null) {
            const totalP = Number(it.totalPrice ?? it.total_price ?? 0);
            price = quantity > 0 ? totalP / quantity : totalP;
          } else if (it.unit_price_per ?? null) {
            price = Number(it.unit_price_per);
          } else {
            price = 0;
          }

          return {
            name: it.name ?? it.productName ?? it.product_name ?? it.productId ?? "Ürün",
            price,
            qty: quantity,
            productId: it.productId ?? it.product_id ?? null,
            raw: it
          };
        });

        const createdAt =
          s.createdAt ?? s.date ?? s.created_at ?? s.timestamp ?? s.time ?? s.createdAtString ?? null;

        const totalVal = Number(
          s.totals?.total ?? s.total ?? s.totalPrice ?? s.total_price ?? s.sum ?? s.amount ?? 0
        );

        return {
          id: String(s.id ?? s._id ?? s.saleId ?? s.id ?? Math.random().toString(36).slice(2, 9)),
          createdAt,
          saleType: s.saleType ?? s.sale_type ?? s.type ?? "cash",
          items,
          totals: { total: totalVal },
          raw: s
        };
      });

      normalized.sort((a, b) => parseDateKey(b.createdAt) - parseDateKey(a.createdAt));
      setSalesList(normalized.slice(0, 100));
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Yükleme hatası", message: String(err?.message ?? err) });
      setSalesList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line
  }, []);

  const totals = useMemo(() => {
    const sub = cart.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
    return { subtotal: sub, tax: 0, total: sub };
  }, [cart]);

  function addToCartByProduct(p, qty = 1) {
    setCart((c) => {
      const idx = c.findIndex((it) => it.productId === p.id);
      if (idx >= 0) {
        const copy = [...c];
        copy[idx].qty = Math.min((copy[idx].qty || 0) + qty, p.stock || 999999);
        return copy;
      }
      return [{ productId: p.id, name: p.name, price: p.price || 0, qty }, ...c];
    });
  }

  function addByBarcode(code) {
    if (!code) return;
    const p = products.find((x) => x.barcode && x.barcode === code);
    if (p) {
      addToCartByProduct(p, 1);
      setScanResult(`Sepete eklendi: ${p.name}`);
    } else {
      setScanResult("Barkodlu ürün bulunamadı.");
    }
    setTimeout(() => setScanResult(""), 2500);
  }

  

  async function finalizeSale() {
    if (cart.length === 0) return showNote({ type: "error", title: "Sepet boş", message: "Satış için önce ürün ekleyin." });
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Satışı tamamlamak için abonelik gereklidir." });
    try {
      const itemsForSale = cart.map((it) => ({ productId: it.productId, name: it.name, qty: it.qty, price: it.price }));
      await finalizeSaleTransaction({
        items: itemsForSale,
        paymentType,
        customerId: selectedCustomer || null,
        totals
      });

      // optimistic UI update for customer balance when veresiye
      if (paymentType === "credit" && selectedCustomer) {
        const amt = Number(totals.total || 0);
        setCustomers((prev) =>
          prev.map((c) =>
            String(c.id) === String(selectedCustomer) ? { ...c, balance: Number(c.balance || 0) + amt } : c
          )
        );
      }
      setCart([]);
      await refreshAll();
      showNote({ type: "success", title: "Satış kaydedildi", message: "Satış başarıyla kaydedildi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Satış başarısız", message: String(err?.message ?? err) });
    }
  }

  function removeCartItem(pid) {
    setCart((c) => c.filter((it) => it.productId !== pid));
  }
  function changeQty(pid, qty) {
    setCart((c) => c.map((it) => (it.productId === pid ? { ...it, qty: Math.max(1, qty) } : it)));
  }

  function openEditSale(s) {
    if (!s) return;
    setEditingSale({ id: s.id, saleType: s.saleType || "cash", total: Number(s.totals?.total || 0) });
  }
  async function saveEditSale() {
    if (!editingSale) return;
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Güncelleme için abonelik gereklidir." });
    try {
      await updateSale(editingSale.id, { saleType: editingSale.saleType, totals: { total: Number(editingSale.total || 0) } });
      setEditingSale(null);
      await refreshAll();
      showNote({ type: "success", title: "Güncellendi", message: "Satış kaydı güncellendi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Güncelleme hatası", message: String(err?.message ?? err) });
    }
  }

  function confirmDeleteSale(s) {
    if (!s) return;
    setConfirmDelete({ kind: "sale", id: s.id, label: s.createdAt ? new Date(s.createdAt).toLocaleString() : s.id });
  }
  async function performDeleteSale() {
    if (!confirmDelete) return;
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Silme için abonelik gereklidir." });
    try {
      await deleteSale(confirmDelete.id);
      setConfirmDelete(null);
      await refreshAll();
      showNote({ type: "success", title: "Silindi", message: "Satış silindi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Silme hatası", message: String(err?.message ?? err) });
    }
  }

  function openIncomeModal() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Gelir eklemek için abonelik gereklidir." });
    setIncomeAmount("");
    setIncomeDesc("");
    setShowIncomeModal(true);
  }
  async function submitIncome() {
    const amt = Number(incomeAmount);
    if (!amt || amt <= 0) return showNote({ type: "error", title: "Geçersiz tutar", message: "Lütfen geçerli bir tutar girin." });
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Gelir eklemek için abonelik gereklidir." });
    try {
      await addLegacyIncome({ amount: amt, description: incomeDesc || "Manuel gelir" });
      setShowIncomeModal(false);
      await refreshAll();
      showNote({ type: "success", title: "Gelir kaydedildi", message: `Gelir: ${amt} kaydedildi.` });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Hata", message: String(err?.message ?? err) });
    }
  }

  function openExpenseModal() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Gider eklemek için abonelik gereklidir." });
    setExpenseAmount("");
    setExpenseDesc("");
    setShowExpenseModal(true);
  }
  async function submitExpense() {
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) return showNote({ type: "error", title: "Geçersiz tutar", message: "Lütfen geçerli bir tutar girin." });
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Gider eklemek için abonelik gereklidir." });
    try {
      await addLegacyExpense({ amount: amt, description: expenseDesc || "Manuel gider" });
      setShowExpenseModal(false);
      await refreshAll();
      showNote({ type: "success", title: "Gider kaydedildi", message: `Gider: ${amt} kaydedildi.` });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Hata", message: String(err?.message ?? err) });
    }
  }

  const filteredProducts = products.filter((p) => {
    const t = search.trim().toLowerCase();
    if (!t) return true;
    return (p.name || "").toLowerCase().includes(t) || (p.barcode || "").toLowerCase().includes(t);
  });

  return (
    <div className="page-sales grid-2">
      <Notification note={note} />
      {!subLoading && !subActive && (
        <div className="card sub-warning">
          <div className="sub-warning-title">Abonelik gerekli</div>
          <div className="sub-warning-body">Yazma işlemleri devre dışı — aboneliğinizi Ayarlar sayfasından yönetebilirsiniz.</div>
        </div>
      )}

      <section className="card sales-quick">
        <h3 className="section-title">Satış (Hızlı)</h3>
        <BarcodeScanner onDetected={(code) => addByBarcode(code)} />
        {scanResult && <div className="scan-result">{scanResult}</div>}

        <div className="search-row">
          <input
            placeholder="Ürün ismine veya barkoda göre ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="auth-input search-input"
          />
         
          
        </div>

        <h4 className="section-subtitle">Ürünler</h4>
        <div className="products-grid">
          {filteredProducts.map((p) => (
            <div key={p.id} className="product-card card">
              <div className="product-meta">
                <div className="product-name">{p.name} <small className="product-cat">{p.category}</small></div>
                <div className="product-stock-info">Stok: {p.stock} • Barkod: {p.barcode || "—"}</div>
              </div>
              <div className="product-actions">
                <div className="product-price">{Number(p.price || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                <button className="btn btn-primary" onClick={() => addToCartByProduct(p, 1)} disabled={!subActive}>Sepete Ekle</button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && <div className="muted-sub">Aramaya uygun ürün bulunamadı.</div>}
        </div>
      </section>

      <aside className="card cart-section">
        <h3 className="section-title">Sepet</h3>
        {cart.length === 0 && <div className="muted-sub">Sepet boş</div>}
        {cart.map((it) => (
          <div key={it.productId} className="cart-item">
            <div className="cart-meta">
              <div className="cart-name">{it.name}</div>
              <div className="cart-sub">{Number(it.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} x {it.qty}</div>
            </div>
            <div className="cart-actions">
              <input
                type="number"
                min="1"
                value={it.qty}
                onChange={(e) => changeQty(it.productId, parseInt(e.target.value || 1, 10))}
                className="qty-input"
                disabled={!subActive}
              />
              <button className="btn btn-ghost" onClick={() => removeCartItem(it.productId)} disabled={!subActive}>Kaldır</button>
            </div>
          </div>
        ))}

        <div className="totals-row">
          <div>Toplam</div>
          <div className="totals-value">{totals.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="payment-row">
          <label className="input-label">Ödeme tipi</label>
          <div className="payment-buttons">
            <button className={`btn ${paymentType === "cash" ? "btn-primary" : "btn-ghost"}`} onClick={() => setPaymentType("cash")}>Nakit</button>
            <button className={`btn ${paymentType === "credit" ? "btn-primary" : "btn-ghost"}`} onClick={() => setPaymentType("credit")}>Veresiye</button>
         
         </div>
          

          

          {paymentType === "credit" && (
            <div className="credit-select">
              <label className="input-label">Müşteri</label>
              <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="auth-input">
                <option value="">-- Müşteri seçin --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({Number(c.balance || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })})
                  </option>
                ))}
              </select>
              <div className="muted-help">Yeni müşteri eklemek için Müşteriler bölümüne gidin.</div>
            </div>
          )}
        </div>

        <div className="cart-actions-row">
          <button className="btn btn-primary" onClick={finalizeSale} disabled={!subActive}>Satışı Tamamla</button>
          <button className="btn btn-ghost" onClick={openIncomeModal} disabled={!subActive}>Gelir Ekle</button>
          <button className="btn btn-ghost" onClick={openExpenseModal} disabled={!subActive}>Gider Ekle</button>
        </div>

        <hr className="divider" />

        <h4 className="section-title">Son 100 Satış</h4>
        {loading ? <div className="app-loading"><div className="spinner" /><p>Yükleniyor...</p></div> : null}
        {salesList.length === 0 ? (
          <div className="muted-sub">Satış kaydı yok.</div>
        ) : (
          <div className="recent-list">
            {salesList.map((s) => {
              const items = Array.isArray(s.items) ? s.items : [];
              const total = Number(s.totals?.total ?? 0);
              return (
                <div key={s.id} className="recent-item card">
                  <div>
                    <div className="recent-type">{saleTypeLabel(s.saleType)}</div>
                    <div className="muted-sub">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}</div>
                    <div className="muted-sub recent-items">{items.map((it) => `${it.name} (${Number(it.price || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}) x${it.qty}`).join(", ")}</div>
                  </div>
                  <div className="recent-actions">
                    <div className="recent-amount">{total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                    <button className="btn btn-ghost" onClick={() => openEditSale(s)} disabled={!subActive}>Düzenle</button>
                    <button className="btn btn-danger" onClick={() => confirmDeleteSale(s)} disabled={!subActive}>Sil</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* Edit modal */}
      {editingSale && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Satışı düzenle">
          <div className="modal-card">
            <div className="modal-header">
              <h4 className="modal-title">Satışı Düzenle</h4>
              <button className="btn btn-ghost" onClick={() => setEditingSale(null)}>Kapat</button>
            </div>

            <div className="modal-body">
              <label className="input-label">Satış Türü</label>
              <select value={editingSale.saleType} onChange={(e) => setEditingSale((s) => ({ ...s, saleType: e.target.value }))} className="auth-input">
                <option value="cash">Nakit</option>
                <option value="credit">Veresiye</option>
              </select>

              <label className="input-label">Toplam (TL)</label>
              <input type="number" value={editingSale.total} onChange={(e) => setEditingSale((s) => ({ ...s, total: parseFloat(e.target.value || 0) }))} className="auth-input" />

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={saveEditSale} disabled={!subActive}>Kaydet</button>
                <button className="btn btn-ghost" onClick={() => setEditingSale(null)}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Silme onayı">
          <div className="modal-card small">
            <h4 className="modal-title">Silme Onayı</h4>
            <div className="modal-text">Kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={performDeleteSale} disabled={!subActive}>Evet, Sil</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Income modal */}
      {showIncomeModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Gelir ekle">
          <div className="modal-card small">
            <h4 className="modal-title">Gelir Ekle</h4>
            <label className="input-label">Tutar</label>
            <input value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className="auth-input" />
            <label className="input-label">Açıklama</label>
            <input value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} className="auth-input" />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={submitIncome} disabled={!subActive}>Kaydet</button>
              <button className="btn btn-ghost" onClick={() => setShowIncomeModal(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense modal */}
      {showExpenseModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Gider ekle">
          <div className="modal-card small">
            <h4 className="modal-title">Gider Ekle</h4>
            <label className="input-label">Tutar</label>
            <input value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="auth-input" />
            <label className="input-label">Açıklama</label>
            <input value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="auth-input" />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={submitExpense} disabled={!subActive}>Kaydet</button>
              <button className="btn btn-ghost" onClick={() => setShowExpenseModal(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}