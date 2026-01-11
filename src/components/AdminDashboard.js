import React, { useEffect, useState, useMemo } from "react";
import {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct
} from "../utils/artifactUserProducts";
import useSubscription from "../hooks/useSubscription";
import { IoMdTrash } from "react-icons/io";
import { MdEdit, MdSecurity, MdLockOutline } from "react-icons/md";
import { auth, db } from "../firebase"; // Firebase importlarının doğru olduğundan emin ol
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../styles/Products.css"; // CSS dosyanı buraya dahil ediyoruz

// --- SABİTLER ---
const ALLOWED_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";
const ARTIFACT_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "default_artifact";

// --- BİLDİRİM BİLEŞENİ (Orijinal) ---
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

// --- GÜVENLİK EKRANI BİLEŞENİ (Hacker Temalı) ---
function SecurityScreen({ mode, onUnlock, onCreate }) {
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (inputVal.length < 4) {
      setError("Şifre en az 4 karakter olmalıdır.");
      return;
    }
    if (mode === "create") {
      onCreate(inputVal);
    } else {
      onUnlock(inputVal);
    }
  };

  return (
    <div className="sec-overlay">
      <div className="sec-terminal">
        <div className="sec-header">
          <MdSecurity className="sec-icon" />
          <h3>{mode === "create" ? "SİSTEM KURULUMU" : "GÜVENLİK PROTOKOLÜ"}</h3>
        </div>
        <div className="sec-body">
          <p className="sec-msg">
            {mode === "create" 
              ? "> İLK GİRİŞ TESPİT EDİLDİ. YÖNETİCİ ŞİFRESİ OLUŞTURUN:" 
              : "> SİSTEM KİLİTLİ. ERİŞİM ŞİFRESİNİ GİRİN:"}
          </p>
          <input 
            type="password" 
            className="sec-input" 
            placeholder="_ _ _ _" 
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {error && <div className="sec-error">{"> HATA: " + error}</div>}
          <button className="sec-btn" onClick={handleSubmit}>
            {mode === "create" ? "ŞİFREYİ KAYDET" : "GİRİŞ YAP"}
          </button>
        </div>
        <div className="sec-footer">UID: {auth.currentUser?.uid.slice(0, 8)}...</div>
      </div>
    </div>
  );
}

// --- ANA ÜRÜNLER BİLEŞENİ (Orijinal Kod) ---
function ProductManager() {
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
      bildir({ type: "error", title: "Hata", message: "Ürünler yüklenemedi." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    yukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = useMemo(() => {
    const existing = products.map(p => p.category).filter(c => c && c.trim() !== "");
    return [...new Set([...existing, ...DEFAULT_CATEGORIES])].sort();
  }, [products]);

  async function urunEkle() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik", message: "İşlem için abonelik gerekli." });

    const tName = name.trim();
    if (!tName) return bildir({ type: "error", title: "Eksik", message: "Ürün adı zorunludur." });

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

      setName(""); setBarcode(""); setPrice(""); setStock(""); setCategory("");
      await yukle();
      bildir({ type: "success", title: "Başarılı", message: "Ürün eklendi." });
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
    bildir({ type: "success", title: "Güncellendi", message: `Yeni stok: ${newVal}` });
    try {
      await updateProduct(id, { stock: newVal });
    } catch {
      setProducts(oldProducts);
      bildir({ type: "error", title: "Hata", message: "Stok güncellenemedi." });
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

// --- ANA EXPORT (WRAPPER) ---
export default function ProductsWrapper() {
  const [authState, setAuthState] = useState("loading"); // loading, unauthorized, locked, create_pin, unlocked
  const [storedPin, setStoredPin] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      
      // 1. Kullanıcı ve UID Kontrolü
      if (!user || user.uid !== ALLOWED_ADMIN_UID) {
        setAuthState("unauthorized");
        return;
      }

      // 2. Firebase'den Şifre Kontrolü
      // Veriyi private bir alana kaydediyoruz: artifacts/{id}/users/{uid}/settings/admin_security
      try {
        const pinRef = doc(db, "artifacts", ARTIFACT_ID, "users", user.uid, "settings", "admin_security");
        const pinSnap = await getDoc(pinRef);

        if (pinSnap.exists() && pinSnap.data().pin) {
          setStoredPin(pinSnap.data().pin);
          setAuthState("locked");
        } else {
          setAuthState("create_pin");
        }
      } catch (e) {
        console.error("Auth Error:", e);
        setAuthState("unauthorized"); // Hata durumunda güvenli tarafı seç
      }
    };

    checkAuth();
  }, []);

  // Şifre Oluşturma
  const handleCreatePin = async (newPin) => {
    const user = auth.currentUser;
    try {
      const pinRef = doc(db, "artifacts", ARTIFACT_ID, "users", user.uid, "settings", "admin_security");
      await setDoc(pinRef, { 
        pin: newPin,
        createdAt: new Date().toISOString()
      });
      setStoredPin(newPin);
      setAuthState("unlocked"); // Şifre oluşturunca direkt aç
    } catch (e) {
      alert("Şifre kaydedilemedi: " + e.message);
    }
  };

  // Şifre Doğrulama
  const handleUnlock = (inputPin) => {
    if (inputPin === storedPin) {
      setAuthState("unlocked");
    } else {
      alert("Hatalı Şifre!");
    }
  };

  if (authState === "loading") {
    return <div className="sec-overlay"><div className="prd-spinner"></div></div>;
  }

  if (authState === "unauthorized") {
    return (
      <div className="sec-overlay unauthorized">
        <MdLockOutline size={64} color="#ff3333" />
        <h1 style={{color: '#ff3333', fontFamily: 'monospace'}}>ERİŞİM REDDEDİLDİ</h1>
        <p style={{color: '#fff', fontFamily: 'monospace'}}>Bu sayfaya yetkiniz yok.</p>
        <div style={{marginTop: 20, fontSize: '0.8rem', color: '#666'}}>ID: {auth.currentUser?.uid}</div>
      </div>
    );
  }

  if (authState === "create_pin") {
    return <SecurityScreen mode="create" onCreate={handleCreatePin} />;
  }

  if (authState === "locked") {
    return <SecurityScreen mode="unlock" onUnlock={handleUnlock} />;
  }

  // Her şey tamamsa Ürünler Sayfasını göster
  return <ProductManager />;
}

