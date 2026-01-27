import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct
} from "../utils/artifactUserProducts";
import useSubscription from "../hooks/useSubscription";
import { 
  FiTrash2, FiEdit2, FiSearch, FiPlus, FiAlertCircle, FiFilter, FiImage 
} from "react-icons/fi";
import "../styles/Products.css";

// Basit Hata Bildirimi
function Bildirim({ note }) {
  if (!note) return null;
  return <div className={`prd-bildirim ${note.type}`}>{note.message}</div>;
}

// Görsel Bileşeni - gorselUrl kullanıyor
function UrunGorseli({ src }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);

  if (!src || err) return <div className="img-placeholder"><FiImage /></div>;
  return <img src={src} className="prod-img" onError={() => setErr(true)} alt="Ürün" />;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Verileri - İsim ve gorselUrl aynı mantıkta
  const [name, setName] = useState("");
  const [gorselUrl, setGorselUrl] = useState(""); // gorselUrl değişkeni
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState(null);
  const [note, setNote] = useState(null);
  const { active: subActive } = useSubscription();

  // Veri Çekme
  async function yukle() {
    setLoading(true);
    try {
      const list = await listProductsForCurrentUser();
      setProducts(list || []);
    } catch {
      setNote({ type: "error", message: "Hata oluştu" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { yukle(); }, []);

  // Ürün Ekleme
  async function urunEkle() {
    if (!subActive) return;
    if (!name.trim()) return;

    try {
      await addProduct({
        name: name,
        gorselUrl: gorselUrl, // Direkt gönderiyoruz
        price: price,
        stock: stock,
        barcode: barcode,
        category: category
      });
      // Temizle
      setName(""); setGorselUrl(""); setPrice(""); setStock(""); setBarcode(""); setCategory("");
      await yukle();
      setNote({ type: "success", message: "Eklendi" });
      setTimeout(() => setNote(null), 3000);
    } catch (e) {
      console.log(e);
    }
  }

  // Düzenleme Kaydet
  async function duzenlemeKaydet() {
    if (!editing || !editing.name) return;
    try {
      await updateProduct(editing.id, {
        name: editing.name,
        gorselUrl: editing.gorselUrl, // Düzenlenen veri
        price: editing.price,
        stock: editing.stock,
        barcode: editing.barcode,
        category: editing.category
      });
      setEditing(null);
      await yukle();
    } catch (e) {
      console.log(e);
    }
  }

  // Silme
  async function sil(id) {
    if(!window.confirm("Silinsin mi?")) return;
    await deleteProduct(id);
    await yukle();
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="prd-container">
      <Bildirim note={note} />

      {/* --- EKLEME KISMI --- */}
      <div className="prd-card add-section">
        <h3>Yeni Ürün</h3>
        <div className="form-grid">
          {/* İsim */}
          <input placeholder="Ürün Adı" value={name} onChange={e => setName(e.target.value)} className="modern-input" />
          
          {/* Görsel URL - İsim gibi davranıyor */}
          <input 
            placeholder="Görsel URL (gorselUrl)" 
            value={gorselUrl} 
            onChange={e => setGorselUrl(e.target.value)} 
            className="modern-input" 
          />

          <input placeholder="Fiyat" type="number" value={price} onChange={e => setPrice(e.target.value)} className="modern-input" />
          <input placeholder="Stok" type="number" value={stock} onChange={e => setStock(e.target.value)} className="modern-input" />
          <input placeholder="Barkod" value={barcode} onChange={e => setBarcode(e.target.value)} className="modern-input" />
          <input placeholder="Kategori" value={category} onChange={e => setCategory(e.target.value)} className="modern-input" />
          
          <button onClick={urunEkle} className="modern-btn primary">Kaydet</button>
        </div>
      </div>

      {/* --- LİSTE --- */}
      <div className="prd-card list-section">
        <input placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
        
        <div className="product-list">
          {filtered.map(p => (
            <div key={p.id} className="product-item">
              {/* Görseli Göster - p.gorselUrl kullanıyor */}
              <div className="prod-img-box">
                <UrunGorseli src={p.gorselUrl} />
              </div>

              <div className="prod-main">
                <div className="prod-name">{p.name}</div>
                <div className="prod-price">{p.price} TL</div>
              </div>

              <div className="prod-actions">
                <button onClick={() => setEditing({...p})} className="action-btn"><FiEdit2 /></button>
                <button onClick={() => sil(p.id)} className="action-btn delete"><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- DÜZENLEME MODAL --- */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>Düzenle</h4>
            <input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="modern-input" />
            
            <input 
              placeholder="Görsel Linki"
              value={editing.gorselUrl || ""} 
              onChange={e => setEditing({...editing, gorselUrl: e.target.value})} 
              className="modern-input" 
            />

            <input type="number" value={editing.price} onChange={e => setEditing({...editing, price: e.target.value})} className="modern-input" />
            <input type="number" value={editing.stock} onChange={e => setEditing({...editing, stock: e.target.value})} className="modern-input" />
            
            <button onClick={duzenlemeKaydet} className="modern-btn primary">Güncelle</button>
            <button onClick={() => setEditing(null)} className="modern-btn ghost">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}


