import "../styles/Sales.css";
import React, { useEffect, useMemo, useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner"; 
import { listProductsForCurrentUser } from "../utils/artifactUserProducts";
import {
  listCustomers,
  finalizeSaleTransaction,
  listRecentSales, // listSales yerine bunu kullanacağız
  updateSale,
  deleteSale,
  addLegacyIncome,
  addLegacyExpense
} from "../utils/firebaseHelpers";
import useSubscription from "../hooks/useSubscription";

function Bildirim({ note }) {
  if (!note) return null;
  const tip = note.type === "error" ? "sl-bildirim hata" : note.type === "success" ? "sl-bildirim basari" : "sl-bildirim info";
  return (
    <div className="sl-bildirim-bar">
      <div className={tip}>
        <div className="sl-bildirim-baslik">{note.title || (note.type === "error" ? "Hata" : "Bilgi")}</div>
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
    if (isNaN(dt.getTime())) return 0;
    return dt.getTime();
  } catch {
    return 0;
  }
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
    try {
      beepAudio.currentTime = 0;
      beepAudio.play().catch(() => {});
    } catch { /* sessizce yut */ }
  };

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  // isSilent: True ise kullanıcıya 'Yükleniyor' ekranı göstermez (Arka planda yeniler)
  async function yenile(isSilent = false) {
    if (!isSilent) setLoading(true);
    try {
      // DÜZELTME: listSales() yerine listRecentSales(50) kullanıyoruz.
      // Binlerce satış varsa hepsini çekmek sistemi kilitler.
      const [prods, custs, recentSales] = await Promise.all([
        listProductsForCurrentUser(), 
        listCustomers(), 
        listRecentSales(50) 
      ]);
      
      setProducts(Array.isArray(prods) ? prods : []);
      setCustomers(Array.isArray(custs) ? custs : []);

      const normalized = (Array.isArray(recentSales) ? recentSales : []).map((s) => {
        const itemsArr = Array.isArray(s.items) ? s.items : [];
        const items = itemsArr.map((it) => {
          const quantity = Number(it.qty ?? it.quantity ?? 1);
          const rawPrice = it.price ?? it.unitPrice ?? it.unit_price ?? null;
          let price = 0;
          if (rawPrice != null) price = Number(rawPrice || 0);
          else if (it.totalPrice != null || it.total_price != null) {
            const totalP = Number(it.totalPrice ?? it.total_price ?? 0);
            price = quantity > 0 ? totalP / quantity : totalP;
          } else if (it.unit_price_per ?? null) {
            price = Number(it.unit_price_per);
          }
          return {
            name: it.name ?? it.productName ?? it.product_name ?? it.productId ?? "Ürün",
            price,
            qty: quantity,
            productId: it.productId ?? it.product_id ?? null,
            raw: it
          };
        });

        const createdAt = s.createdAt ?? s.date ?? s.created_at ?? s.timestamp ?? s.time ?? s.createdAtString ?? null;
        const totalVal = Number(s.totals?.total ?? s.total ?? s.totalPrice ?? s.total_price ?? s.sum ?? s.amount ?? 0);

        return {
          id: String(s.id ?? s._id ?? s.saleId ?? s.id ?? Math.random().toString(36).slice(2, 9)),
          createdAt,
          saleType: s.saleType ?? s.sale_type ?? s.type ?? "cash",
          items,
          totals: { total: totalVal },
          raw: s
        };
      });

      // Zaten recentSales sıralı geliyor ama garanti olsun
      normalized.sort((a, b) => parseDateKey(b.createdAt) - parseDateKey(a.createdAt));
      setSalesList(normalized);
    } catch (err) {
      bildir({ type: "error", title: "Yükleme hatası", message: String(err?.message ?? err) });
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
    return { subtotal: sub, tax: 0, total: sub };
  }, [cart]);

  function sepeteEkle(p, qty = 1) {
    const stokHam = Number(p.stock);
    const stok = Number.isFinite(stokHam) ? stokHam : Infinity;
    if (stok <= 0) {
      return bildir({ type: "error", title: "Stok yok", message: `${p.name} ürünü stokta yok.` });
    }
    setCart((c) => {
      const idx = c.findIndex((it) => it.productId === p.id);
      const mevcut = idx >= 0 ? Number(c[idx].qty || 0) : 0;
      if (mevcut + qty > stok) {
        bildir({ type: "error", title: "Stok yetersiz", message: `${p.name} için mevcut stok: ${stok}` });
        return c;
      }
      if (idx >= 0) {
        const copy = [...c];
        copy[idx].qty = mevcut + qty;
        return copy;
      }
      return [{ productId: p.id, name: p.name, price: p.price || 0, qty }, ...c];
    });
  }

  function barkodlaEkle(rawCode) {
    const code = norm(rawCode);
    if (!code) return false;
    
    // Tarama anında kamerayı kapatmak isterseniz bu satırı açın:
    // setShowCamera(false);

    const match = products.find((x) => {
      const bc = norm(x.barcode);
      if (!bc) return false;
      if (bc === code) return true;
      if (normDigits(bc) === normDigits(code)) return true;
      if (bc.length > 6 && code.length > 6) {
        if (bc.includes(code) || code.includes(bc)) return true;
      }
      return false;
    });

    if (match) {
      sepeteEkle(match, 1);
      playBeep();
      const msg = `Eklendi: ${match.name}`;
      setScanResult(msg);
      bildir({ type: "success", title: "Sepete eklendi", message: msg });
      setTimeout(() => setScanResult(""), 3000);
      return true; 
    } else {
      setScanResult(`Bulunamadı: ${code}`);
      bildir({ type: "error", title: "Eşleşme yok", message: `Sistemde kayıtlı değil: ${code}` });
      setTimeout(() => setScanResult(""), 3000);
      return false; 
    }
  }

  function toggleCamera() {
    setShowCamera((prev) => !prev);
    setScanResult("");
  }

  // --- KRİTİK PERFORMANS GÜNCELLEMESİ ---
  async function satisTamamla() {
    if (cart.length === 0) return bildir({ type: "error", title: "Sepet boş", message: "Satış için önce ürün ekleyin." });
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Satışı tamamlamak için abonelik gereklidir." });

    // 1. Verileri hazırla
    const itemsForSale = cart.map((it) => ({ productId: it.productId, name: it.name, qty: it.qty, price: it.price }));
    const saleData = { items: itemsForSale, paymentType, customerId: selectedCustomer || null, totals };

    // 2. YEDEĞİ AL (Hata olursa geri dönebilmek için)
    const cartBackup = [...cart];

    // 3. ANINDA UI TEMİZLİĞİ (OPTIMISTIC UI)
    // Veritabanını beklemeden kullanıcıya "Bitti" hissi veriyoruz.
    setCart([]);
    bildir({ type: "success", title: "İşlem Alındı", message: "Satış tamamlandı." });

    try {
      // 4. ARKA PLAN İŞLEMİ
      await finalizeSaleTransaction(saleData);

      if (paymentType === "credit" && selectedCustomer) {
        const amt = Number(totals.total || 0);
        setCustomers((prev) =>
          prev.map((c) =>
            String(c.id) === String(selectedCustomer) ? { ...c, balance: Number(c.balance || 0) + amt } : c
          )
        );
      }

      // 5. SESSİZ GÜNCELLEME
      // Ekranı "Yükleniyor"a sokmadan, sadece verileri tazeler.
      // await koymuyoruz ki UI bloklanmasın, ama React state güncellemeleri sıraya girsin diye await de diyebiliriz, 
      // sessiz olduğu için kullanıcı hissetmez.
      await yenile(true); 

    } catch (err) {
      // HATA DURUMUNDA GERİ AL
      console.error("Satış hatası:", err);
      setCart(cartBackup); // Sepeti geri getir
      bildir({ type: "error", title: "Satış başarısız", message: "Bir hata oluştu, sepet geri yüklendi: " + err.message });
    }
  }

  function sepettenSil(pid) {
    setCart((c) => c.filter((it) => it.productId !== pid));
  }
  function miktarDegis(pid, qty) {
    setCart((c) => c.map((it) => (it.productId === pid ? { ...it, qty: Math.max(1, qty) } : it)));
  }

  function satisDuzenleAc(s) {
    if (!s) return;
    setEditingSale({ id: s.id, saleType: s.saleType || "cash", total: Number(s.totals?.total || 0) });
  }
  async function satisDuzenleKaydet() {
    if (!editingSale) return;
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Güncelleme için abonelik gereklidir." });
    try {
      await updateSale(editingSale.id, { saleType: editingSale.saleType, totals: { total: Number(editingSale.total || 0) } });
      setEditingSale(null);
      await yenile(true); // Sessiz güncelleme
      bildir({ type: "success", title: "Güncellendi", message: "Satış kaydı güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Güncelleme hatası", message: String(err?.message ?? err) });
    }
  }

  function satisSilIste(s) {
    if (!s) return;
    setConfirmDelete({ kind: "sale", id: s.id, label: s.createdAt ? new Date(s.createdAt).toLocaleString() : s.id });
  }
  async function satisSilGercek() {
    if (!confirmDelete) return;
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Silme için abonelik gereklidir." });
    try {
      await deleteSale(confirmDelete.id);
      setConfirmDelete(null);
      await yenile(true); // Sessiz güncelleme
      bildir({ type: "success", title: "Silindi", message: "Satış silindi." });
    } catch (err) {
      bildir({ type: "error", title: "Silme hatası", message: String(err?.message ?? err) });
    }
  }

  function gelirModalAc() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Gelir eklemek için abonelik gereklidir." });
    setIncomeAmount("");
    setIncomeDesc("");
    setShowIncomeModal(true);
  }
  async function gelirKaydet() {
    const amt = Number(incomeAmount);
    if (!amt || amt <= 0) return bildir({ type: "error", title: "Geçersiz tutar", message: "Geçerli tutar girin." });
    try {
      await addLegacyIncome({ amount: amt, description: incomeDesc || "Manuel gelir" });
      setShowIncomeModal(false);
      await yenile(true);
      bildir({ type: "success", title: "Gelir kaydedildi", message: `Gelir: ${amt} kaydedildi.` });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: String(err?.message ?? err) });
    }
  }

  function giderModalAc() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Gider eklemek için abonelik gereklidir." });
    setExpenseAmount("");
    setExpenseDesc("");
    setShowExpenseModal(true);
  }
  async function giderKaydet() {
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) return bildir({ type: "error", title: "Geçersiz tutar", message: "Geçerli tutar girin." });
    try {
      await addLegacyExpense({ amount: amt, description: expenseDesc || "Manuel gider" });
      setShowExpenseModal(false);
      await yenile(true);
      bildir({ type: "success", title: "Gider kaydedildi", message: `Gider: ${amt} kaydedildi.` });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: String(err?.message ?? err) });
    }
  }

  const filteredProducts = products.filter((p) => {
    const t = search.trim().toLowerCase();
    if (!t) return true;
    return (p.name || "").toLowerCase().includes(t) || (p.barcode || "").toLowerCase().includes(t);
  });

  return (
    <div className="sl-sayfa">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="sl-kart sl-uyari">
          <div className="sl-uyari-baslik">Abonelik gerekli</div>
          <div className="sl-uyari-icerik"><a href="https://www.stokpro.shop/product-key" style={{color:"#1f6feb",fontWeight:"bold"}}>Satın almak için tıklayın.</a></div>
        </div>
      )}

      {/* --- SOL TARA (Hızlı Satış Alanı) --- */}
      <section className="sl-kart sl-hizli">
        <h3 className="sl-baslik">Satış (Hızlı)</h3>

        <button 
          className={`sl-btn ${showCamera ? "kirmizi" : "mavi"}`} 
          onClick={toggleCamera} 
          style={{ width: '100%', marginBottom: '10px' }}
        >
          {showCamera ? "Kamerayı Kapat" : "Barkod Tara (Kamerayı Aç)"}
        </button>

        {showCamera && (
          <div className="sl-kamera-kapsayici">
            <BarcodeScanner onDetected={(code) => barkodlaEkle(code)} />
          </div>
        )}

        {scanResult && <div className="sl-info">{scanResult}</div>}

        <div className="sl-ara">
          <input
            placeholder="Ürün ismine veya barkoda göre ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sl-input"
          />
        </div>

        <h4 className="sl-altbaslik">Ürünler</h4>
        <div className="sl-urun-grid">
          {filteredProducts.map((p) => (
            <div key={p.id} className="sl-urun">
              <div>
                <div className="sl-urun-ad">{p.name}</div>
                <small className="sl-kat">{p.category || "Kategorisiz"}</small>
                <div className="sl-urun-alt">Stok: {p.stock} • {p.barcode || "—"}</div>
              </div>
              <div className="sl-urun-aks">
                <div className="sl-fiyat">{Number(p.price || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                <button className="sl-btn mavi" onClick={() => sepeteEkle(p, 1)} disabled={!subActive}>
                  Ekle
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && <div className="sl-mini">Aramaya uygun ürün bulunamadı.</div>}
        </div>
      </section>

      {/* --- SAĞ TARA (Sepet ve Geçmiş) --- */}
      <aside className="sl-kart sl-sepet">
        <h3 className="sl-baslik">Sepet</h3>

        <div className="sl-sepet-liste">
          {cart.length === 0 && <div className="sl-mini">Sepet boş</div>}
          {cart.map((it) => (
            <div key={it.productId} className="sl-sepet-satir">
              <div>
                <div className="sl-sepet-ad">{it.name}</div>
                <div className="sl-mini">
                  {Number(it.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })} x {it.qty}
                </div>
              </div>
              <div className="sl-sepet-aks">
                <input
                  type="number"
                  min="1"
                  value={it.qty}
                  onChange={(e) => miktarDegis(it.productId, parseInt(e.target.value || 1, 10))}
                  className="sl-input kucuk"
                  disabled={!subActive}
                />
                <button className="sl-btn cizgi" onClick={() => sepettenSil(it.productId)} disabled={!subActive}>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sl-toplam">
          <div>Toplam</div>
          <div className="sl-kalin">{totals.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
        </div>

        <div className="sl-odeme">
          <label className="sl-etiket">Ödeme tipi</label>
          <div className="sl-odeme-btn">
            <button className={`sl-btn ${paymentType === "cash" ? "mavi" : "cizgi"}`} onClick={() => setPaymentType("cash")}>
              Nakit
            </button>
            <button className={`sl-btn ${paymentType === "credit" ? "mavi" : "cizgi"}`} onClick={() => setPaymentType("credit")}>
              Veresiye
            </button>
          </div>

          {paymentType === "credit" && (
            <div className="sl-kredi">
              <label className="sl-etiket">Müşteri</label>
              <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="sl-input">
                <option value="">-- Müşteri seçin --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({Number(c.balance || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="sl-aks-dizi">
          <button className="sl-btn mavi" onClick={satisTamamla} disabled={!subActive}>Satışı Tamamla</button>
          <button className="sl-btn cizgi" onClick={gelirModalAc} disabled={!subActive}>Gelir Ekle</button>
          <button className="sl-btn cizgi" onClick={giderModalAc} disabled={!subActive}>Gider Ekle</button>
        </div>

        <hr className="sl-hr" />

        <h4 className="sl-altbaslik">Son İşlemler</h4>
        {loading && <div className="sl-yukleme"><div className="sl-spinner" /><p>Yükleniyor...</p></div>}

        <div className="sl-recent">
          {salesList.length === 0 ? (
            <div className="sl-mini">Satış kaydı yok.</div>
          ) : (
             salesList.map((s) => {
              const items = Array.isArray(s.items) ? s.items : [];
              const total = Number(s.totals?.total ?? 0);
              return (
                <div key={s.id} className="sl-recent-kart">
                  <div>
                    <div className="sl-kalin">{saleTypeLabel(s.saleType)}</div>
                    <div className="sl-mini">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}</div>
                    <div className="sl-mini">
                      {items.map((it) => `${it.name} x${it.qty}`).join(", ")}
                    </div>
                  </div>
                  <div className="sl-recent-aks">
                    <div className="sl-kalin">{total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
                    <button className="sl-btn cizgi" onClick={() => satisDuzenleAc(s)} disabled={!subActive}>Düzenle</button>
                    <button className="sl-btn kirmizi" onClick={() => satisSilIste(s)} disabled={!subActive}>Sil</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* MODALLAR */}
      {editingSale && (
        <div className="sl-modal-kaplama" role="dialog" aria-modal="true" aria-label="Satışı düzenle">
          <div className="sl-modal">
            <div className="sl-modal-baslik">
              <h4>Satışı Düzenle</h4>
              <button className="sl-btn cizgi" onClick={() => setEditingSale(null)}>Kapat</button>
            </div>
            <div className="sl-modal-icerik">
              <label className="sl-etiket">Satış Türü</label>
              <select value={editingSale.saleType} onChange={(e) => setEditingSale((s) => ({ ...s, saleType: e.target.value }))} className="sl-input">
                <option value="cash">Nakit</option>
                <option value="credit">Veresiye</option>
              </select>
              <label className="sl-etiket">Toplam (TL)</label>
              <input type="number" value={editingSale.total} onChange={(e) => setEditingSale((s) => ({ ...s, total: parseFloat(e.target.value || 0) }))} className="sl-input" />
              <div className="sl-modal-aks">
                <button className="sl-btn mavi" onClick={satisDuzenleKaydet} disabled={!subActive}>Kaydet</button>
                <button className="sl-btn cizgi" onClick={() => setEditingSale(null)}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="sl-modal-kaplama" role="dialog" aria-modal="true" aria-label="Silme onayı">
          <div className="sl-modal kucuk">
            <h4>Silme Onayı</h4>
            <div className="sl-mini">Kaydı silmek istediğinize emin misiniz?</div>
            <div className="sl-modal-aks">
              <button className="sl-btn kirmizi" onClick={satisSilGercek} disabled={!subActive}>Evet, Sil</button>
              <button className="sl-btn cizgi" onClick={() => setConfirmDelete(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {showIncomeModal && (
        <div className="sl-modal-kaplama" role="dialog" aria-modal="true" aria-label="Gelir ekle">
          <div className="sl-modal kucuk">
            <h4>Gelir Ekle</h4>
            <label className="sl-etiket">Tutar</label>
            <input value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className="sl-input" />
            <label className="sl-etiket">Açıklama</label>
            <input value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} className="sl-input" />
            <div className="sl-modal-aks">
              <button className="sl-btn mavi" onClick={gelirKaydet} disabled={!subActive}>Kaydet</button>
              <button className="sl-btn cizgi" onClick={() => setShowIncomeModal(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="sl-modal-kaplama" role="dialog" aria-modal="true" aria-label="Gider ekle">
          <div className="sl-modal kucuk">
            <h4>Gider Ekle</h4>
            <label className="sl-etiket">Tutar</label>
            <input value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="sl-input" />
            <label className="sl-etiket">Açıklama</label>
            <input value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="sl-input" />
            <div className="sl-modal-aks">
              <button className="sl-btn mavi" onClick={giderKaydet} disabled={!subActive}>Kaydet</button>
              <button className="sl-btn cizgi" onClick={() => setShowExpenseModal(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

