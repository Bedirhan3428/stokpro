import "../styles/global.css";
import "../styles/Products.css";

import React, { useEffect, useState } from "react";
import {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct
} from "../utils/artifactUserProducts";
import useSubscription from "../hooks/useSubscription";

/* Simple in-app notification */
function Notification({ note }) {
  if (!note) return null;
  const cls = note.type === "error" ? "note note-error" : note.type === "success" ? "note note-success" : "note note-info";
  return (
    <div className={cls} role={note.type === "error" ? "alert" : "status"}>
      <div className="note-title">{note.title || (note.type === "error" ? "Hata" : "Bilgi")}</div>
      <div className="note-body">{note.message}</div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // add form
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  // edit modal
  const [editing, setEditing] = useState(null); // {id, name, barcode, price, stock, category}
  const [confirmDelete, setConfirmDelete] = useState(null); // {id, label}

  // notification
  const [note, setNote] = useState(null);
  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  const { loading: subLoading, active: subActive } = useSubscription();

  async function load() {
    setLoading(true);
    try {
      const list = await listProductsForCurrentUser();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Yükleme Hatası", message: String(err.message || err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function handleAddProduct() {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Ürün eklemek için abonelik gereklidir." });
    const tName = (name || "").trim();
    if (!tName) return showNote({ type: "error", title: "Eksik bilgi", message: "Ürün ismi gerekli." });
    const payload = {
      name: tName,
      barcode: (barcode || "").trim() || null,
      price: parseFloat(price || 0) || 0,
      stock: parseInt(stock || 0, 10) || 0,
      category: (category || "").trim() || null
    };
    try {
      await addProduct(payload);
      setName(""); setBarcode(""); setPrice(""); setStock(""); setCategory("");
      await load();
      showNote({ type: "success", title: "Eklendi", message: "Ürün başarıyla eklendi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Ekleme Hatası", message: String(err.message || err) });
    }
  }

  function openEdit(p) {
    setEditing({
      id: p.id,
      name: p.name || "",
      barcode: p.barcode || "",
      price: p.price != null ? p.price : 0,
      stock: typeof p.stock !== "undefined" ? p.stock : 0,
      category: p.category || ""
    });
  }

  async function saveEdit() {
    if (!editing) return;
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Ürün güncellemek için abonelik gereklidir." });
    const { id, name: n, barcode: b, price: pr, stock: st, category: cat } = editing;
    if (!n || !String(n).trim()) return showNote({ type: "error", title: "Eksik bilgi", message: "Ürün ismi gerekli." });
    const updates = {
      name: String(n).trim(),
      barcode: b ? String(b).trim() : null,
      price: Number(pr || 0),
      stock: Number(st || 0),
      category: cat ? String(cat).trim() : null
    };
    try {
      await updateProduct(id, updates);
      setEditing(null);
      await load();
      showNote({ type: "success", title: "Güncellendi", message: "Ürün bilgileri güncellendi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Güncelleme Hatası", message: String(err.message || err) });
    }
  }

  function promptDelete(p) {
    setConfirmDelete({ id: p.id, label: p.name || "Ürün" });
  }

  async function performDelete() {
    if (!confirmDelete) return;
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Ürün silmek için abonelik gereklidir." });
    try {
      await deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      await load();
      showNote({ type: "success", title: "Silindi", message: "Ürün silindi." });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Silme Hatası", message: String(err.message || err) });
    }
  }

  async function setQuickStock(id, newStock) {
    if (!subActive) return showNote({ type: "error", title: "Abonelik gerekli", message: "Stok güncellemek için abonelik gereklidir." });
    try {
      await updateProduct(id, { stock: Number(newStock || 0) });
      await load();
      showNote({ type: "success", title: "Stok güncellendi", message: `Yeni stok: ${newStock}` });
    } catch (err) {
      console.error(err);
      showNote({ type: "error", title: "Stok Hatası", message: String(err.message || err) });
    }
  }

  return (
    <div className="page-products">
      <Notification note={note} />

      {!subLoading && !subActive && (
        <div className="card sub-warning">
          <div className="sub-warning-title">Abonelik gerekli</div>
          <div className="sub-warning-body">Ürün ekleme/güncelleme/silme işlemleri abonelik gerektirir.</div>
        </div>
      )}

      <div className="card add-product-card">
        <h3 className="section-title">Yeni Ürün Ekle</h3>
        <div className="add-product-grid">
          <input placeholder="Ürün adı" value={name} onChange={(e) => setName(e.target.value)} className="auth-input" />
          <input placeholder="Barkod" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="auth-input" />
          <input placeholder="Fiyat" value={price} onChange={(e) => setPrice(e.target.value)} className="auth-input" />
          <input placeholder="Stok" value={stock} onChange={(e) => setStock(e.target.value)} className="auth-input" />
          <input placeholder="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} className="auth-input" />
          <div className="add-product-actions">
            <button className="btn btn-primary" onClick={handleAddProduct} disabled={!subActive}>Ekle</button>
          </div>
        </div>
        <div className="muted-help">Alanlardan en azından ürün adı girilmelidir.</div>
      </div>

      <div className="card products-list-card">
        <h3 className="section-title">Ürün Listesi</h3>
        {loading ? (
          <div className="app-loading"><div className="spinner" /><p>Yükleniyor...</p></div>
        ) : products.length === 0 ? (
          <div className="muted-sub">Kayıtlı ürün yok.</div>
        ) : (
          <div className="products-list">
            {products.map((p) => (
              <div key={p.id} className="product-row card">
                <div className="product-meta">
                  <div className="product-name" title={p.name}>{p.name}</div>
                  <div className="product-sub muted-sub">
                    Barkod: {p.barcode || "—"} • Kategori: {p.category || "—"} • Fiyat: {Number(p.price||0).toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}
                  </div>
                </div>

                <div className="product-right">
                  <div className="product-stock">
                    <div className="stock-value">{p.stock}</div>
                    <div className="stock-label muted-sub">Stok</div>
                  </div>

                  <div className="quick-stock">
                    <input
                      type="number"
                      defaultValue={p.stock}
                      onBlur={(e) => setQuickStock(p.id, Number(e.target.value || 0))}
                      className="quick-stock-input"
                      disabled={!subActive}
                      aria-label={`Hızlı stok ${p.name}`}
                    />
                  </div>

                  <div className="product-actions">
                    <button className="btn btn-ghost" onClick={() => openEdit(p)} disabled={!subActive}>Düzenle</button>
                    <button className="btn btn-danger" onClick={() => promptDelete(p)} disabled={!subActive}>Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Ürünü düzenle">
          <div className="modal-card">
            <div className="modal-header">
              <h4 className="modal-title">Ürünü Düzenle</h4>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Kapat</button>
            </div>

            <div className="modal-body edit-grid">
              <div className="form-field">
                <label className="input-label">Ürün adı</label>
                <input value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} className="auth-input" />
              </div>
              <div className="form-field">
                <label className="input-label">Barkod</label>
                <input value={editing.barcode} onChange={(e) => setEditing((s) => ({ ...s, barcode: e.target.value }))} className="auth-input" />
              </div>
              <div className="form-field">
                <label className="input-label">Fiyat</label>
                <input type="number" value={editing.price} onChange={(e) => setEditing((s) => ({ ...s, price: e.target.value }))} className="auth-input" />
              </div>
              <div className="form-field">
                <label className="input-label">Stok</label>
                <input type="number" value={editing.stock} onChange={(e) => setEditing((s) => ({ ...s, stock: e.target.value }))} className="auth-input" />
              </div>
              <div className="form-field full-width">
                <label className="input-label">Kategori</label>
                <input value={editing.category} onChange={(e) => setEditing((s) => ({ ...s, category: e.target.value }))} className="auth-input" />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={saveEdit} disabled={!subActive}>Kaydet</button>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Silme onayı">
          <div className="modal-card small">
            <h4 className="modal-title">Silme Onayı</h4>
            <div className="modal-text"> "{confirmDelete.label}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={performDelete} disabled={!subActive}>Evet, Sil</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}