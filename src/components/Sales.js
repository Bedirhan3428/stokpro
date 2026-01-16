import "../styles/Sales.css";
import React, { useEffect, useMemo, useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner"; 
import { listProductsForCurrentUser } from "../utils/artifactUserProducts";
import {
  listCustomers,
  finalizeSaleTransaction,
  listRecentSales,
  updateSale,
  deleteSale,
  addLegacyIncome,
  addLegacyExpense
} from "../utils/firebaseHelpers";
import useSubscription from "../hooks/useSubscription";
import { MdEdit } from "react-icons/md";
import { IoMdTrash } from "react-icons/io";

// Basit Bildirim
function Bildirim({ note }) {
  if (!note) return null;
  const tip = note.type === "error" ? "hata" : note.type === "success" ? "basari" : "bilgi";
  return (
    <div className="sl-bildirim-bar">
      <div className={`sl-bildirim ${tip}`}>
        <div className="sl-bildirim-baslik">{note.title || "Bilgi"}</div>
        <div className="sl-bildirim-icerik">{note.message}</div>
      </div>
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
    return isNaN(dt.getTime()) ? 0 : dt.getTime();
  } catch { return 0; }
}

const norm = (c) => String(c ?? "").trim();
const normDigits = (c) => norm(c).replace(/^0+/, "");

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState("cash");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [search, setSearch] = useState("");

  const [salesList, setSalesList] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);

  const [showCamera, setShowCamera] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDesc, setIncomeDesc] = useState("");
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");

  const { loading: subLoading, active: subActive } = useSubscription();

  const beepAudio = useMemo(() => {
    if (typeof Audio === "undefined") return null;
    return new Audio(`${process.env.PUBLIC_URL || ""}/beep.wav`);
  }, []);

  const playBeep = () => {
    if (!beepAudio) return;
    try { beepAudio.currentTime = 0; beepAudio.play().catch(() => {}); } catch {}
  };

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  // Veri Yükleme
  async function yenile(isSilent = false) {
    if (!isSilent) setLoading(true);
    try {
      const [prods, custs, recentSales] = await Promise.all([
        listProductsForCurrentUser(), 
        listCustomers(), 
        listRecentSales(50) 
      ]);

      setProducts(Array.isArray(prods) ? prods : []);
      setCustomers(Array.isArray(custs) ? custs : []);

      // Satış verisini normalize et
      const normalized = (Array.isArray(recentSales) ? recentSales : []).map((s) => {
        const itemsArr = Array.isArray(s.items) ? s.items : [];
        const items = itemsArr.map((it) => {
          const qty = Number(it.qty ?? 1);
          let price = Number(it.price ?? 0);
          return {
            name: it.name ?? "Ürün",
            price,
            qty,
            productId: it.productId ?? null,
          };
        });

        const totalVal = Number(s.totals?.total ?? s.total ?? 0);

        return {
          id: String(s.id),
          createdAt: s.createdAt ?? s.date,
          saleType: s.saleType ?? "cash",
          items,
          totals: { total: totalVal },
        };
      });

      normalized.sort((a, b) => parseDateKey(b.createdAt) - parseDateKey(a.createdAt));
      setSalesList(normalized);
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: "Veriler yüklenemedi." });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }

  useEffect(() => {
    yenile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const sub = cart.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
    return { subtotal: sub, total: sub };
  }, [cart]);

  // Sepet İşlemleri
  function sepeteEkle(p, qty = 1) {
    const stok = Number(p.stock || 0);
    if (stok <= 0) return bildir({ type: "error", title: "Stok Yok", message: `${p.name} stokta kalmadı.` });

    setCart((c) => {
      const idx = c.findIndex((it) => it.productId === p.id);
      const mevcut = idx >= 0 ? Number(c[idx].qty) : 0;
      
      if (mevcut + qty > stok) {
        bildir({ type: "error", title: "Yetersiz Stok", message: `Mevcut stok: ${stok}` });
        return c;
      }

      if (idx >= 0) {
        const copy = [...c];
        copy[idx].qty = mevcut + qty;
        return copy;
      }
      return [{ productId: p.id, name: p.name, price: Number(p.price), qty }, ...c];
    });
  }

  function barkodlaEkle(rawCode) {
    const code = norm(rawCode);
    if (!code) return false;

    const match = products.find((x) => {
      const bc = norm(x.barcode);
      if (!bc) return false;
      if (bc === code) return true;
      if (normDigits(bc) === normDigits(code)) return true;
      return false;
    });

    if (match) {
      sepeteEkle(match, 1);
      playBeep();
      setScanResult(`Eklendi: ${match.name}`);
      setTimeout(() => setScanResult(""), 2000);
      return true; 
    } else {
      setScanResult(`Bulunamadı: ${code}`);
      bildir({ type: "error", title: "Bulunamadı", message: "Ürün kayıtlı değil." });
      setTimeout(() => setScanResult(""), 2000);
      return false; 
    }
  }

  // Satış Tamamlama
  async function satisTamamla() {
    if (cart.length === 0) return bildir({ type: "error", title: "Boş", message: "Sepet boş." });
    if (!subActive) return bildir({ type: "error", title: "Abonelik", message: "İşlem için abonelik gerekli." });

    const itemsForSale = cart.map((it) => ({ productId: it.productId, name: it.name, qty: it.qty, price: it.price }));
    const saleData = { items: itemsForSale, paymentType, customerId: selectedCustomer || null, totals };
    const cartBackup = [...cart];

    setCart([]); // Optimistik temizlik
    bildir({ type: "success", title: "Başarılı", message: "Satış tamamlandı." });

    try {
      await finalizeSaleTransaction(saleData);
      
      // Veresiye ise yerel state güncelle
      if (paymentType === "credit" && selectedCustomer) {
        setCustomers(prev => prev.map(c => 
          c.id === selectedCustomer ? { ...c, balance: (c.balance || 0) + totals.total } : c
        ));
      }
      
      await yenile(true);
    } catch (err) {
      setCart(cartBackup);
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  // Diğer İşlemler
  function sepettenSil(pid) { setCart(c => c.filter(it => it.productId !== pid)); }
  function miktarDegis(pid, qty) { setCart(c => c.map(it => it.productId === pid ? { ...it, qty: Math.max(1, qty) } : it)); }

  async function satisDuzenleKaydet() {
    if (!subActive) return;
    try {
      await updateSale(editingSale.id, { saleType: editingSale.saleType, totals: { total: Number(editingSale.total) } });
      setEditingSale(null);
      await yenile(true);
      bildir({ type: "success", title: "Güncellendi", message: "Kayıt güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  async function satisSilGercek() {
    if (!subActive) return;
    try {
      await deleteSale(confirmDelete.id);
      setConfirmDelete(null);
      await yenile(true);
      bildir({ type: "success", title: "Silindi", message: "Kayıt silindi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    }
  }

  // --- EKLENEN KISIM: Modal Açma Fonksiyonları ---
  function gelirModalAc() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik", message: "İşlem için abonelik gerekli." });
    setIncomeAmount("");
    setIncomeDesc("");
    setShowIncomeModal(true);
  }

  function giderModalAc() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik", message: "İşlem için abonelik gerekli." });
    setExpenseAmount("");
    setExpenseDesc("");
    setShowExpenseModal(true);
  }

  // Gelir / Gider Kayıt
  async function gelirKaydet() {
    const amt = Number(incomeAmount);
    if (!amt || amt <= 0) return;
    try {
      await addLegacyIncome({ amount: amt, description: incomeDesc || "Manuel gelir" });
      setShowIncomeModal(false);
      await yenile(true);
      bildir({ type: "success", title: "Kaydedildi", message: `Gelir: ${amt} TL` });
    } catch (err) { bildir({ type: "error", title: "Hata", message: err.message }); }
  }

  async function giderKaydet() {
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) return;
    try {
      await addLegacyExpense({ amount: amt, description: expenseDesc || "Manuel gider" });
      setShowExpenseModal(false);
      await yenile(true);
      bildir({ type: "success", title: "Kaydedildi", message: `Gider: ${amt} TL` });
    } catch (err) { bildir({ type: "error", title: "Hata", message: err.message }); }
  }

  // Ürün Filtreleme
  const filteredProducts = products.filter((p) => {
    const t = search.trim().toLowerCase();
    if (!t) return true;
    return (p.name || "").toLowerCase().includes(t) || (p.barcode || "").toLowerCase().includes(t);
  });

  return (
    <div className="sl-sayfa">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="sl-uyari-bar">
          <span>Abonelik Gerekli.</span> <a href="https://www.stokpro.shop/product-key">Satın Al</a>
        </div>
      )}

      {/* --- SOL PANEL: Ürün Seçimi --- */}
      <section className="sl-sol-panel">
        <div className="sl-kart">
          <h3 className="sl-baslik">Hızlı Satış</h3>
          
          <div className="sl-araclar">
            <button 
              className={`sl-btn ${showCamera ? "kirmizi" : "mavi"}`} 
              onClick={() => { setShowCamera(!showCamera); setScanResult(""); }}
            >
              {showCamera ? "Kamerayı Kapat" : "Barkod Tara"}
            </button>
            <input
              placeholder="Ürün ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sl-input"
            />
          </div>

          {showCamera && (
            <div className="sl-kamera-kutu">
              <BarcodeScanner onDetected={barkodlaEkle} />
            </div>
          )}
          {scanResult && <div className="sl-info">{scanResult}</div>}

          <div className="sl-urun-grid">
            {filteredProducts.map((p) => (
              <div key={p.id} className="sl-urun-kart" onClick={() => sepeteEkle(p, 1)}>
                <div className="sl-urun-baslik">{p.name}</div>
                <div className="sl-urun-detay">
                  <span className="sl-stok-etiket">Stok: {p.stock}</span>
                  <span className="sl-fiyat">{Number(p.price).toLocaleString("tr-TR", {style:"currency", currency:"TRY"})}</span>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && <div className="sl-bos-mesaj">Ürün bulunamadı.</div>}
          </div>
        </div>
      </section>

      {/* --- SAĞ PANEL: Sepet ve Geçmiş --- */}
      <aside className="sl-sag-panel">
        
        {/* SEPET */}
        <div className="sl-kart full-h">
          <h3 className="sl-baslik">Sepet</h3>
          
          <div className="sl-sepet-liste">
            {cart.length === 0 ? (
              <div className="sl-bos-sepet">Sepet boş</div>
            ) : (
              cart.map((it) => (
                <div key={it.productId} className="sl-sepet-item">
                  <div className="sl-item-info">
                    <div className="sl-item-name">{it.name}</div>
                    <div className="sl-item-price">
                      {Number(it.price).toLocaleString("tr-TR", {style:"currency",currency:"TRY"})} x {it.qty}
                    </div>
                  </div>
                  <div className="sl-item-actions">
                    <input 
                      type="number" min="1" value={it.qty} 
                      onChange={(e) => miktarDegis(it.productId, parseInt(e.target.value))}
                      className="sl-input mini"
                    />
                    <button onClick={() => sepettenSil(it.productId)} className="sl-btn icon delete"><IoMdTrash /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sl-sepet-footer">
            <div className="sl-toplam-satir">
              <span>Toplam</span>
              <span className="sl-toplam-tutar">{totals.total.toLocaleString("tr-TR", {style:"currency", currency:"TRY"})}</span>
            </div>

            <div className="sl-odeme-secim">
              <div className="sl-toggle-group">
                <button className={`sl-toggle ${paymentType === "cash" ? "active" : ""}`} onClick={() => setPaymentType("cash")}>Nakit</button>
                <button className={`sl-toggle ${paymentType === "credit" ? "active" : ""}`} onClick={() => setPaymentType("credit")}>Veresiye</button>
              </div>
              
              {paymentType === "credit" && (
                <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="sl-input">
                  <option value="">Müşteri Seçin</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            <button className="sl-btn mavi buyuk" onClick={satisTamamla} disabled={!subActive}>Satışı Tamamla</button>
            
            <div className="sl-hizli-btnlar">
              <button className="sl-btn hayalet" onClick={gelirModalAc} disabled={!subActive}>+ Gelir</button>
              <button className="sl-btn hayalet" onClick={giderModalAc} disabled={!subActive}>- Gider</button>
            </div>
          </div>
        </div>

        {/* SON İŞLEMLER */}
        <div className="sl-kart">
          <h4 className="sl-baslik-kucuk">Son İşlemler</h4>
          <div className="sl-gecmis-liste">
            {salesList.slice(0, 10).map((s) => (
              <div key={s.id} className="sl-gecmis-item">
                <div className="sl-gecmis-info">
                  <span className="sl-gecmis-tutar">{Number(s.totals.total).toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}</span>
                  <small>{saleTypeLabel(s.saleType)} • {new Date(s.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small>
                </div>
                <div className="sl-gecmis-aks">
                  <button onClick={() => { setEditingSale({id:s.id, saleType:s.saleType, total:s.totals.total})}} className="sl-btn icon edit"><MdEdit /></button>
                  <button onClick={() => setConfirmDelete({id:s.id})} className="sl-btn icon delete"><IoMdTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </aside>

      {/* --- MODALLAR --- */}
      
      {/* Gelir Modalı (TEXTAREA EKLENDİ) */}
      {showIncomeModal && (
        <div className="sl-modal-overlay">
          <div className="sl-modal small">
            <h4>Gelir Ekle</h4>
            <input placeholder="Tutar (TL)" type="number" value={incomeAmount} onChange={(e)=>setIncomeAmount(e.target.value)} className="sl-input" />
            
            {/* Genişleyen Açıklama Alanı */}
            <textarea 
              placeholder="Açıklama (Opsiyonel)" 
              value={incomeDesc} 
              onChange={(e)=>setIncomeDesc(e.target.value)} 
              className="sl-input sl-textarea-expand"
            />
            
            <div className="sl-modal-footer">
              <button onClick={()=>setShowIncomeModal(false)} className="sl-btn hayalet">İptal</button>
              <button onClick={gelirKaydet} className="sl-btn mavi">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Gider Modalı (TEXTAREA EKLENDİ) */}
      {showExpenseModal && (
        <div className="sl-modal-overlay">
          <div className="sl-modal small">
            <h4>Gider Ekle</h4>
            <input placeholder="Tutar (TL)" type="number" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} className="sl-input" />
            
            {/* Genişleyen Açıklama Alanı */}
            <textarea 
              placeholder="Açıklama (Opsiyonel)" 
              value={expenseDesc} 
              onChange={(e)=>setExpenseDesc(e.target.value)} 
              className="sl-input sl-textarea-expand"
            />
            
            <div className="sl-modal-footer">
              <button onClick={()=>setShowExpenseModal(false)} className="sl-btn hayalet">İptal</button>
              <button onClick={giderKaydet} className="sl-btn mavi">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Diğer Modallar (Silme/Düzenleme) */}
      {editingSale && (
        <div className="sl-modal-overlay">
          <div className="sl-modal small">
            <h4>Satış Düzenle</h4>
            <select value={editingSale.saleType} onChange={(e)=>setEditingSale(s=>({...s, saleType:e.target.value}))} className="sl-input">
              <option value="cash">Nakit</option>
              <option value="credit">Veresiye</option>
            </select>
            <input type="number" value={editingSale.total} onChange={(e)=>setEditingSale(s=>({...s, total:e.target.value}))} className="sl-input" />
            <div className="sl-modal-footer">
              <button onClick={()=>setEditingSale(null)} className="sl-btn hayalet">İptal</button>
              <button onClick={satisDuzenleKaydet} className="sl-btn mavi">Güncelle</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="sl-modal-overlay">
          <div className="sl-modal small">
            <h4>Silinsin mi?</h4>
            <p>Bu satış kaydı kalıcı olarak silinecek.</p>
            <div className="sl-modal-footer">
              <button onClick={()=>setConfirmDelete(null)} className="sl-btn hayalet">Vazgeç</button>
              <button onClick={satisSilGercek} className="sl-btn kirmizi">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}