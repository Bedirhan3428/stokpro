import "../styles/Products.css";
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct
} from "../utils/artifactUserProducts";
import useSubscription from "../hooks/useSubscription";
import { 
  FiTrash2, FiEdit2, FiSearch, FiPlus, FiAlertCircle, FiFilter 
} from "react-icons/fi";

// Bildirim Bileşeni
function Bildirim({ note }) {
  if (!note) return null;
  const tipClass = note.type === "error" ? "hata" : note.type === "success" ? "basari" : "bilgi";
  return (
    <div className={`prd-bildirim ${tipClass}`}>
      <div className="prd-bildirim-baslik">{note.title}</div>
      <div className="prd-bildirim-icerik">{note.message}</div>
    </div>
  );
}

const DEFAULT_CATEGORIES = ["Genel", "Gıda", "Elektronik", "Giyim", "Kırtasiye", "Temizlik", "Hırdavat"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  
  const [category, setCategory] = useState("");
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [note, setNote] = useState(null);

  const { loading: subLoading, active: subActive } = useSubscription();
  const catWrapperRef = useRef(null);

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  async function yukle() {
    setLoading(true);
    try {
      const list = await listProductsForCurrentUser();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: "Veri çekilemedi." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    yukle();
    function handleClickOutside(event) {
      if (catWrapperRef.current && !catWrapperRef.current.contains(event.target)) {
        setShowCatSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = useMemo(() => {
    const existing = products.map(p => p.category).filter(c => c && c.trim() !== "");
    const allCats = [...new Set([...DEFAULT_CATEGORIES, ...existing])];
    if (!category) return allCats.sort();
    return allCats.filter(c => c.toLowerCase().includes(category.toLowerCase())).sort();
  }, [products, category]);

  async function urunEkle() {
    if (!subActive) return bildir({ type: "error", title: "Kısıtlı", message: "Özellik kilitli." });

    const tName = name.trim();
    if (!tName) return bildir({ type: "error", title: "Eksik", message: "Ürün adı şart." });

    const isDuplicate = products.some(p => p.name.toLowerCase() === tName.toLowerCase() || (barcode && p.barcode === barcode));
    if (isDuplicate) return bildir({ type: "error", title: "Mevcut", message: "Bu ürün zaten var." });

    try {
      await addProduct({
        name: tName,
        barcode: barcode.trim() || null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        category: category.trim() || "Genel"
      });
      setName(""); setBarcode(""); setPrice(""); setStock(""); setCategory("");
      await yukle();
      bildir({ type: "success", title: "Eklendi", message: "Ürün kaydedildi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  function duzenlemeAc(p) {
    setEditing({ ...p, price: p.price || 0, stock: p.stock || 0, category: p.category || "" });
  }

  async function duzenlemeKaydet() {
    if (!subActive) return;
    const { id, name: n, barcode: b, price: pr, stock: st, category: cat } = editing;
    if (!n.trim()) return bildir({ type: "error", title: "Eksik", message: "Ad boş olamaz." });

    try {
      await updateProduct(id, {
        name: n.trim(),
        barcode: b ? String(b).trim() : null,
        price: Number(pr),
        stock: Number(st),
        category: cat ? String(cat).trim() : null
      });
      setEditing(null);
      await yukle();
      bildir({ type: "success", title: "Güncellendi", message: "Değişiklikler kaydedildi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  async function silGercek() {
    if (!subActive || !confirmDelete) return;
    try {
      await deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      await yukle();
      bildir({ type: "success", title: "Silindi", message: "Ürün silindi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  async function hizliStok(id, val) {
    if (!subActive) return;
    const newVal = Number(val);
    const oldProducts = [...products];
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newVal } : p));
    try {
      await updateProduct(id, { stock: newVal });
      bildir({ type: "success", title: "Güncellendi", message: `Stok: ${newVal}` });
    } catch {
      setProducts(oldProducts);
      bildir({ type: "error", title: "Hata", message: "Güncelleme başarısız." });
    }
  }

  const filtered = products.filter(p => {
    const t = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(t) ||
      (p.barcode || "").toLowerCase().includes(t) ||
      (p.category || "").toLowerCase().includes(t)
    );
  });

  return (
    <div className="prd-container">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="alert-banner">
          <FiAlertCircle size={20} />
          <span>Hesabınız kısıtlı. Tüm özellikleri açmak için:</span>
          <a href="https://www.stokpro.shop/product-key" className="alert-link">Ücretsiz Etkinleştir</a>
        </div>
      )}

      {/* --- EKLEME KARTI --- */}
      <div className="prd-card add-section">
        <div className="card-header">
           <h3>Yeni Ürün Ekle</h3>
        </div>
        
        <div className="form-grid">
          <div className="form-group full">
            <label>Ürün Adı</label>
            <input 
              placeholder="Ürün Adı" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="modern-input" 
            />
          </div>

          <div className="form-group full">
            <label>Barkod (İsteğe Bağlı)</label>
            <input 
              placeholder="Barkod girin" 
              value={barcode} 
              onChange={e => setBarcode(e.target.value)} 
              className="modern-input" 
            />
          </div>

          <div className="form-group half">
            <label>Fiyat (₺)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              className="modern-input" 
            />
          </div>

          <div className="form-group half">
            <label>Stok Adedi</label>
            <input 
              type="number" 
              placeholder="0" 
              value={stock} 
              onChange={e => setStock(e.target.value)} 
              className="modern-input" 
            />
          </div>

          <div className="form-group full" ref={catWrapperRef}>
            <label>Kategori</label>
            <div className="custom-select-wrapper">
              <div className="input-icon-wrapper">
                <FiFilter className="input-icon" />
                <input 
                  placeholder="Kategori yazın veya seçin..." 
                  value={category}
                  onChange={e => { setCategory(e.target.value); setShowCatSuggestions(true); }}
                  onFocus={() => setShowCatSuggestions(true)}
                  className="modern-input with-icon"
                />
              </div>
              
              {showCatSuggestions && (
                <ul className="suggestions-list">
                  {categoryOptions.length === 0 && <li className="no-suggestion">"{category}" eklenecek.</li>}
                  {categoryOptions.map((c, i) => (
                    <li key={i} onClick={() => { setCategory(c); setShowCatSuggestions(false); }}>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-actions">
             <button className="modern-btn primary full-width" onClick={urunEkle} disabled={!subActive}>
               <FiPlus /> Ürünü Kaydet
             </button>
          </div>
        </div>
      </div>

      {/* --- LİSTELEME KARTI --- */}
      <div className="prd-card list-section">
        <div className="list-header">
          <h3>Ürün Listesi <span className="count-badge">{filtered.length}</span></h3>
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input 
              placeholder="Ara..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="prd-loading"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="prd-empty">
             <FiSearch size={40} />
             <p>Ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="product-list">
            {filtered.map(p => (
              <div key={p.id} className="product-item">
                <div className="prod-main">
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-tags">
                     <span className="tag cat">{p.category || "Genel"}</span>
                     {p.barcode && <span className="tag bar">{p.barcode}</span>}
                  </div>
                </div>

                <div className="prod-values">
                  <div className="prod-price-box">
                    {Number(p.price).toLocaleString("tr-TR", {style:"currency", currency:"TRY"})}
                  </div>

                  <div className="prod-stock-box">
                    <input 
                      type="number" 
                      className="stock-input"
                      defaultValue={p.stock}
                      onBlur={e => hizliStok(p.id, e.target.value)}
                      disabled={!subActive}
                    />
                    <span className="stock-label">Adet</span>
                  </div>
                </div>

                <div className="prod-actions">
                  <button onClick={() => duzenlemeAc(p)} className="action-btn edit" title="Düzenle">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => setConfirmDelete({id:p.id, label:p.name})} className="action-btn delete" title="Sil">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- DÜZENLEME MODALI --- */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h4>Ürün Düzenle</h4>
              <button onClick={() => setEditing(null)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              {/* Grup kullanarak boşluğu ayarladık */}
              <div className="form-group">
                <label>Ürün Adı</label>
                <input value={editing.name} onChange={e => setEditing(s => ({...s, name: e.target.value}))} className="modern-input" />
              </div>
              
              <div className="row-2">
                 <div className="form-group">
                    <label>Fiyat</label>
                    <input type="number" value={editing.price} onChange={e => setEditing(s => ({...s, price: e.target.value}))} className="modern-input" />
                 </div>
                 <div className="form-group">
                    <label>Stok</label>
                    <input type="number" value={editing.stock} onChange={e => setEditing(s => ({...s, stock: e.target.value}))} className="modern-input" />
                 </div>
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <input value={editing.category} onChange={e => setEditing(s => ({...s, category: e.target.value}))} className="modern-input" />
              </div>

              <div className="form-group">
                <label>Barkod</label>
                <input value={editing.barcode} onChange={e => setEditing(s => ({...s, barcode: e.target.value}))} className="modern-input" />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditing(null)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={duzenlemeKaydet} className="modern-btn primary">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-card small">
             <div className="modal-icon danger"><FiTrash2 /></div>
             <h4>Siliniyor</h4>
             <p><b>{confirmDelete.label}</b> silinecek. Emin misin?</p>
             <div className="modal-footer center">
               <button onClick={() => setConfirmDelete(null)} className="modern-btn ghost">Hayır</button>
               <button onClick={silGercek} className="modern-btn danger">Evet, Sil</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}


