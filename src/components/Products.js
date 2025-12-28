import "../styles/Products.css";
import React, { useEffect, useState, useMemo } from "react";
import {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct
} from "../utils/artifactUserProducts";
import useSubscription from "../hooks/useSubscription";
import { IoMdTrash } from "react-icons/io";
import { MdEdit } from "react-icons/md";

// Basit Bildirim Bileşeni
function Bildirim({ note }) {
  if (!note) return null;
  const tipClass = note.type === "error" ? "hata" : note.type === "success" ? "basari" : "bilgi";
  return (
    <div className={`prd-bildirim ${tipClass}`}>
      <div className="prd-bildirim-baslik">{note.title || "Bilgi"}</div>
      <div className="prd-bildirim-icerik">{note.message}</div>
    </div>
  );
}

const DEFAULT_CATEGORIES = ["Genel", "Gıda", "Elektronik", "Giyim", "Kırtasiye"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [note, setNote] = useState(null);

  const { loading: subLoading, active: subActive } = useSubscription();

  // Bildirim Yardımcısı
  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  // Veri Yükleme
  async function yukle() {
    setLoading(true);
    try {
      const list = await listProductsForCurrentUser();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: "Ürünler yüklenemedi." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    yukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kategori Listesi Hesaplama
  const categoryOptions = useMemo(() => {
    const existing = products.map(p => p.category).filter(c => c && c.trim() !== "");
    return [...new Set([...existing, ...DEFAULT_CATEGORIES])].sort();
  }, [products]);

  // Ürün Ekleme
  async function urunEkle() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik", message: "İşlem için abonelik gerekli." });
    
    const tName = name.trim();
    if (!tName) return bildir({ type: "error", title: "Eksik", message: "Ürün adı zorunludur." });

    // Mükerrer Kontrolü
    const isDuplicate = products.some(p => 
      p.name.toLowerCase() === tName.toLowerCase() || 
      (barcode && p.barcode === barcode)
    );
    if (isDuplicate) return bildir({ type: "error", title: "Mevcut", message: "Bu ürün veya barkod zaten var." });

    try {
      await addProduct({
        name: tName,
        barcode: barcode.trim() || null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        category: category.trim() || null
      });
      
      // Formu Temizle
      setName(""); setBarcode(""); setPrice(""); setStock(""); setCategory("");
      await yukle();
      bildir({ type: "success", title: "Başarılı", message: "Ürün eklendi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  // Düzenleme İşlemleri
  function duzenlemeAc(p) {
    setEditing({ ...p, price: p.price || 0, stock: p.stock || 0, category: p.category || "" });
  }

  async function duzenlemeKaydet() {
    if (!subActive) return;
    const { id, name: n, barcode: b, price: pr, stock: st, category: cat } = editing;
    
    if (!n.trim()) return bildir({ type: "error", title: "Eksik", message: "Ürün adı boş olamaz." });

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
      bildir({ type: "success", title: "Güncellendi", message: "Ürün bilgileri kaydedildi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  // Silme İşlemleri
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

  // Hızlı Stok Güncelleme
  async function hizliStok(id, val) {
    if (!subActive) return;
    const newVal = Number(val);
    const oldProducts = [...products]; // Yedek
    
    // Optimistik UI Güncellemesi
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newVal } : p));
    bildir({ type: "success", title: "Güncellendi", message: `Yeni stok: ${newVal}` });

    try {
      await updateProduct(id, { stock: newVal });
    } catch {
      setProducts(oldProducts); // Hata varsa geri al
      bildir({ type: "error", title: "Hata", message: "Stok güncellenemedi." });
    }
  }

  // Filtreleme
  const filtered = products.filter(p => {
    const t = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(t) ||
      (p.barcode || "").toLowerCase().includes(t) ||
      (p.category || "").toLowerCase().includes(t)
    );
  });

  return (
    <div className="prd-sayfa">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="prd-uyari-kutu">
          <div className="prd-uyari-baslik">Abonelik Gerekli</div>
          <a href="https://www.stokpro.shop/product-key" className="prd-link">Abonelik Satın Al</a>
        </div>
      )}

      {/* --- ÜRÜN EKLE --- */}
      <div className="prd-kart">
        <h3 className="prd-baslik">Hızlı Ürün Ekle</h3>
        <div className="prd-form-grid">
          <input placeholder="Ürün Adı" value={name} onChange={e => setName(e.target.value)} className="prd-input" />
          <input placeholder="Barkod" value={barcode} onChange={e => setBarcode(e.target.value)} className="prd-input" />
          
          <div className="prd-input-grup">
            <input type="number" placeholder="Fiyat" value={price} onChange={e => setPrice(e.target.value)} className="prd-input" />
            <span className="prd-birim">₺</span>
          </div>
          
          <input type="number" placeholder="Stok" value={stock} onChange={e => setStock(e.target.value)} className="prd-input" />

          {/* Kategori Combo */}
          <div className="prd-combo-grup">
            <input 
              placeholder="Kategori" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              className="prd-input combo-input"
            />
            <select 
              className="prd-select-trigger" 
              onChange={e => { if(e.target.value) setCategory(e.target.value); e.target.value=""; }}
            >
              <option value="">▼</option>
              {categoryOptions.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>

          <button className="prd-btn primary" onClick={urunEkle} disabled={!subActive}>Ekle</button>
        </div>
      </div>

      {/* --- ÜRÜN LİSTESİ --- */}
      <div className="prd-kart full-height">
        <div className="prd-liste-header">
          <h3 className="prd-baslik">Ürünler ({filtered.length})</h3>
          <input 
            placeholder="Ara..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="prd-input search"
          />
        </div>

        {loading ? (
          <div className="prd-loading"><div className="prd-spinner"></div>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="prd-empty">Ürün bulunamadı.</div>
        ) : (
          <div className="prd-liste-container">
            {filtered.map(p => (
              <div key={p.id} className="prd-item">
                <div className="prd-info">
                  <div className="prd-name">{p.name}</div>
                  <div className="prd-meta">
                    <span>{p.category || "Genel"}</span> • 
                    <span>{p.barcode || "Barkodsuz"}</span> • 
                    <span className="prd-price">{Number(p.price).toLocaleString("tr-TR", {style:"currency", currency:"TRY"})}</span>
                  </div>
                </div>

                <div className="prd-actions">
                  <div className="prd-stock-control">
                    <label>Stok</label>
                    <input 
                      type="number" 
                      defaultValue={p.stock} 
                      onBlur={e => hizliStok(p.id, e.target.value)}
                      disabled={!subActive}
                    />
                  </div>
                  
                  {/* Buton Grubu: Düzenle ve Sil */}
                  <div className="prd-action-btns">
                    <button onClick={() => duzenlemeAc(p)} className="prd-btn icon-btn edit" title="Düzenle">
                      <MdEdit />
                    </button>
                    <button onClick={() => setConfirmDelete({id:p.id, label:p.name})} className="prd-btn icon-btn delete" title="Sil">
                      <IoMdTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- DÜZENLEME MODALI --- */}
      {editing && (
        <div className="prd-modal-overlay">
          <div className="prd-modal">
            <div className="prd-modal-header">
              <h4>Ürün Düzenle</h4>
              <button onClick={() => setEditing(null)} className="prd-close">×</button>
            </div>
            <div className="prd-modal-body">
              <label>Ürün Adı</label>
              <input value={editing.name} onChange={e => setEditing(s => ({...s, name: e.target.value}))} className="prd-input" />
              
              <div className="prd-row-2">
                <div>
                  <label>Fiyat</label>
                  <input type="number" value={editing.price} onChange={e => setEditing(s => ({...s, price: e.target.value}))} className="prd-input" />
                </div>
                <div>
                  <label>Stok</label>
                  <input type="number" value={editing.stock} onChange={e => setEditing(s => ({...s, stock: e.target.value}))} className="prd-input" />
                </div>
              </div>

              <label>Kategori</label>
              <div className="prd-combo-grup">
                <input 
                  value={editing.category} 
                  onChange={e => setEditing(s => ({...s, category: e.target.value}))} 
                  className="prd-input combo-input"
                />
                <select 
                  className="prd-select-trigger" 
                  onChange={e => { if(e.target.value) setEditing(s => ({...s, category: e.target.value})); e.target.value=""; }}
                >
                  <option value="">▼</option>
                  {categoryOptions.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>

              <label>Barkod</label>
              <input value={editing.barcode} onChange={e => setEditing(s => ({...s, barcode: e.target.value}))} className="prd-input" />
            </div>
            <div className="prd-modal-footer">
              <button onClick={() => setEditing(null)} className="prd-btn ghost">İptal</button>
              <button onClick={duzenlemeKaydet} className="prd-btn primary">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SİLME ONAYI --- */}
      {confirmDelete && (
        <div className="prd-modal-overlay">
          <div className="prd-modal small">
            <div className="prd-modal-header">
              <h4>Siliniyor</h4>
            </div>
            <div className="prd-modal-body">
              <p><b>{confirmDelete.label}</b> ürününü silmek istediğine emin misin?</p>
            </div>
            <div className="prd-modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="prd-btn ghost">Vazgeç</button>
              <button onClick={silGercek} className="prd-btn danger">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


