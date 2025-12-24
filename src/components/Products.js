import "../styles/Products.css"; 
import React, { useEffect, useState } from "react";
import {
  listProductsForCurrentUser,
  addProduct,
  updateProduct,
  deleteProduct
} from "../utils/artifactUserProducts";
import useSubscription from "../hooks/useSubscription";

function Bildirim({ note }) {
  if (!note) return null;
  const tip = note.type === "error" ? "prd-bildirim hata" : note.type === "success" ? "prd-bildirim basari" : "prd-bildirim info";
  return (
    <div className={tip} role={note.type === "error" ? "alert" : "status"}>
      <div className="prd-bildirim-baslik">{note.title || (note.type === "error" ? "Hata" : "Bilgi")}</div>
      <div className="prd-bildirim-icerik">{note.message}</div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  // Arama State
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
      bildir({ type: "error", title: "Yükleme Hatası", message: String(err.message || err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    yukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function urunEkle() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Ürün eklemek için abonelik gereklidir." });

    const tName = (name || "").trim();
    const tBarcode = (barcode || "").trim();

    if (!tName) return bildir({ type: "error", title: "Eksik bilgi", message: "Ürün ismi gerekli." });

    const isDuplicate = products.some(p => {
      const nameMatch = p.name.toLowerCase() === tName.toLowerCase();
      const barcodeMatch = tBarcode && p.barcode && (p.barcode === tBarcode);
      return nameMatch || barcodeMatch;
    });

    if (isDuplicate) {
      return bildir({ type: "error", title: "Mükerrer Kayıt", message: "Bu isimde veya barkodda bir ürün zaten mevcut." });
    }

    const payload = {
      name: tName,
      barcode: tBarcode || null,
      price: parseFloat(price || 0) || 0,
      stock: parseInt(stock || 0, 10) || 0,
      category: (category || "").trim() || null
    };

    try {
      await addProduct(payload);
      setName(""); setBarcode(""); setPrice(""); setStock(""); setCategory("");
      await yukle();
      bildir({ type: "success", title: "Eklendi", message: "Ürün başarıyla eklendi." });
    } catch (err) {
      bildir({ type: "error", title: "Ekleme Hatası", message: String(err.message || err) });
    }
  }

  function duzenlemeAc(p) {
    setEditing({
      id: p.id,
      name: p.name || "",
      barcode: p.barcode || "",
      price: p.price != null ? p.price : 0,
      stock: typeof p.stock !== "undefined" ? p.stock : 0,
      category: p.category || ""
    });
  }

  async function duzenlemeKaydet() {
    if (!editing) return;
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Ürün güncellemek için abonelik gereklidir." });
    const { id, name: n, barcode: b, price: pr, stock: st, category: cat } = editing;

    const tName = String(n).trim();
    if (!tName) return bildir({ type: "error", title: "Eksik bilgi", message: "Ürün ismi gerekli." });

    const isDuplicate = products.some(p => p.id !== id && p.name.toLowerCase() === tName.toLowerCase());
    if (isDuplicate) {
       return bildir({ type: "error", title: "Mükerrer İsim", message: "Bu isimde başka bir ürün zaten var." });
    }

    const updates = {
      name: tName,
      barcode: b ? String(b).trim() : null,
      price: Number(pr || 0),
      stock: Number(st || 0),
      category: cat ? String(cat).trim() : null
    };

    try {
      await updateProduct(id, updates);
      setEditing(null);
      await yukle();
      bildir({ type: "success", title: "Güncellendi", message: "Ürün bilgileri güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Güncelleme Hatası", message: String(err.message || err) });
    }
  }

  function silIste(p) {
    setConfirmDelete({ id: p.id, label: p.name || "Ürün" });
  }

  async function silGercek() {
    if (!confirmDelete) return;
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Ürün silmek için abonelik gereklidir." });
    try {
      await deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      await yukle();
      bildir({ type: "success", title: "Silindi", message: "Ürün silindi." });
    } catch (err) {
      bildir({ type: "error", title: "Silme Hatası", message: String(err.message || err) });
    }
  }

  // --- KRİTİK GÜNCELLEME: HIZLI STOK ---
  async function hizliStok(id, rawVal) {
    if (!subActive) {
      bildir({ type: "error", title: "Abonelik gerekli", message: "Stok güncellemek için abonelik gereklidir." });
      return; // Değer değişse bile abonelik yoksa işlem yapma
    }

    const newVal = Number(rawVal || 0);

    // 1. Mevcut ürünü bul
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return;
    
    // 2. Eğer değer değişmediyse sunucuyu yorma
    if (products[productIndex].stock === newVal) return;

    // 3. YEDEK AL (Hata olursa geri dönmek için)
    const oldProducts = [...products];

    // 4. ANINDA GÜNCELLE (Optimistic Update)
    // Bekleme yok, UI hemen değişir
    setProducts(prev => {
      const copy = [...prev];
      copy[productIndex] = { ...copy[productIndex], stock: newVal };
      return copy;
    });

    bildir({ type: "success", title: "Güncellendi", message: `Stok: ${newVal}` });

    try {
      // 5. Arka planda sunucuya gönder
      await updateProduct(id, { stock: newVal });
      // Not: Buraya 'await yukle()' KOYMUYORUZ. Zaten elimizdeki veri doğru.
    } catch (err) {
      // Hata olursa eski haline döndür
      setProducts(oldProducts);
      bildir({ type: "error", title: "Stok Hatası", message: String(err.message || err) });
    }
  }

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const pName = (p.name || "").toLowerCase();
    const pBarcode = (p.barcode || "").toLowerCase();
    const pCategory = (p.category || "").toLowerCase();

    return pName.includes(term) || pBarcode.includes(term) || pCategory.includes(term);
  });

  return (
    <div className="prd-sayfa">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="prd-kart prd-uyari">
          <div className="prd-uyari-baslik">Abonelik gerekli</div>
          <div className="prd-uyari-icerik"><a href="https://www.stokpro.shop/product-key" style={{color:"#1f6feb",fontWeight:"bold"}}>Satın Almak için tıklayın</a></div>
        </div>
      )}

      {/* ÜRÜN EKLEME ALANI */}
      <div className="prd-kart prd-ekle">
        <h3 className="prd-baslik">Yeni Ürün Ekle</h3>
        <div className="prd-ekle-grid">
          <input placeholder="Ürün adı" value={name} onChange={(e) => setName(e.target.value)} className="prd-input" />
          <input placeholder="Barkod" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="prd-input" />
          <input placeholder="Fiyat" value={price} onChange={(e) => setPrice(e.target.value)} className="prd-input" />
          <input placeholder="Stok" value={stock} onChange={(e) => setStock(e.target.value)} className="prd-input" />
          <input placeholder="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} className="prd-input" />
          <button className="prd-btn mavi" onClick={urunEkle} disabled={!subActive}>Ekle</button>
        </div>
        <div className="prd-mini">En azından ürün adı girilmelidir. Aynı isim veya barkodla 2. kayıt yapılamaz.</div>
      </div>

      {/* ÜRÜN LİSTESİ ALANI */}
      <div className="prd-kart">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 className="prd-baslik" style={{ margin: 0 }}>Ürün Listesi ({filteredProducts.length})</h3>

          {/* ARAMA INPUT */}
          <input 
            type="text" 
            placeholder="Ara: İsim, Barkod, Kategori..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="prd-input"
            style={{ width: '250px', padding: '8px 12px' }}
          />
        </div>

        {loading ? (
          <div className="prd-yukleme"><div className="prd-spinner" /><p>Yükleniyor...</p></div>
        ) : filteredProducts.length === 0 ? (
          <div className="prd-mini">
            {searchTerm ? "Arama kriterlerine uygun ürün bulunamadı." : "Kayıtlı ürün yok."}
          </div>
        ) : (
          <div className="prd-liste">
            {filteredProducts.map((p) => (
              <div key={p.id} className="prd-satir">
                <div className="prd-meta">
                  <div className="prd-isim" title={p.name}>{p.name}</div>
                  <div className="prd-alt">
                    Barkod: {p.barcode || "—"} • Kategori: {p.category || "—"} • Fiyat: {Number(p.price || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </div>
                </div>

                <div className="prd-sag">
                  <div className="prd-stok-blok">
                    <div className="prd-stok">{p.stock}</div>
                    <div className="prd-mini">Stok</div>
                  </div>

                  {/* HIZLI STOK INPUT - Değişiklik anında 'defaultValue' ile değil, onBlur ile yönetilir */}
                  <input
                    type="number"
                    // defaultValue={p.stock} // React uncontrolled input yerine value kullanmak daha güvenli olabilir ama onBlur için bu yeterli
                    // Ancak UI anında güncellensin diye key ekleyebiliriz veya en temizi:
                    key={p.stock} // Stok değişince input re-render olsun
                    defaultValue={p.stock}
                    onBlur={(e) => hizliStok(p.id, e.target.value)}
                    className="prd-hizli-input"
                    disabled={!subActive}
                    aria-label={`Hızlı stok ${p.name}`}
                  />

                  <div className="prd-aks">
                    <button className="prd-btn cizgi" onClick={() => duzenlemeAc(p)} disabled={!subActive}>Düzenle</button>
                    <button className="prd-btn kirmizi" onClick={() => silIste(p)} disabled={!subActive}>Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DÜZENLEME MODALI */}
      {editing && (
        <div className="prd-modal-kaplama" role="dialog" aria-modal="true" aria-label="Ürünü düzenle">
          <div className="prd-modal">
            <div className="prd-modal-baslik">
              <h4>Ürünü Düzenle</h4>
              <button className="prd-btn cizgi" onClick={() => setEditing(null)}>Kapat</button>
            </div>

            <div className="prd-modal-icerik">
              <label className="prd-etiket">Ürün adı</label>
              <input value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} className="prd-input" />

              <label className="prd-etiket">Barkod</label>
              <input value={editing.barcode} onChange={(e) => setEditing((s) => ({ ...s, barcode: e.target.value }))} className="prd-input" />

              <label className="prd-etiket">Fiyat</label>
              <input type="number" value={editing.price} onChange={(e) => setEditing((s) => ({ ...s, price: e.target.value }))} className="prd-input" />

              <label className="prd-etiket">Stok</label>
              <input type="number" value={editing.stock} onChange={(e) => setEditing((s) => ({ ...s, stock: e.target.value }))} className="prd-input" />

              <label className="prd-etiket">Kategori</label>
              <input value={editing.category} onChange={(e) => setEditing((s) => ({ ...s, category: e.target.value }))} className="prd-input" />
            </div>

            <div className="prd-modal-aks">
              <button className="prd-btn mavi" onClick={duzenlemeKaydet} disabled={!subActive}>Kaydet</button>
              <button className="prd-btn cizgi" onClick={() => setEditing(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      {confirmDelete && (
        <div className="prd-modal-kaplama" role="dialog" aria-modal="true" aria-label="Silme onayı">
          <div className="prd-modal kucuk">
            <h4>Silme Onayı</h4>
            <div className="prd-mini">"{confirmDelete.label}" ürününü silmek istediğinize emin misiniz?</div>
            <div className="prd-modal-aks">
              <button className="prd-btn kirmizi" onClick={silGercek} disabled={!subActive}>Evet, Sil</button>
              <button className="prd-btn cizgi" onClick={() => setConfirmDelete(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

