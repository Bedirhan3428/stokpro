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

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

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
    if (!tName) return bildir({ type: "error", title: "Eksik bilgi", message: "Ürün ismi gerekli." });
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
      await yukle();
      bildir({ type: "success", title: "Eklendi", message: "Ürün eklendi." });
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
    if (!n || !String(n).trim()) return bildir({ type: "error", title: "Eksik bilgi", message: "Ürün ismi gerekli." });
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

  async function hizliStok(id, newStock) {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Stok güncellemek için abonelik gereklidir." });
    try {
      await updateProduct(id, { stock: Number(newStock || 0) });
      await yukle();
      bildir({ type: "success", title: "Stok güncellendi", message: `Yeni stok: ${newStock}` });
    } catch (err) {
      bildir({ type: "error", title: "Stok Hatası", message: String(err.message || err) });
    }
  }

  return (
    <div className="prd-sayfa">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="prd-kart prd-uyari">
          <div className="prd-uyari-baslik">Abonelik gerekli</div>
          <div className="prd-uyari-icerik">Ürün ekleme/güncelleme/silme işlemleri abonelik gerektirir.</div>
        </div>
      )}

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
        <div className="prd-mini">En azından ürün adı girilmelidir.</div>
      </div>

      <div className="prd-kart">
        <h3 className="prd-baslik">Ürün Listesi</h3>
        {loading ? (
          <div className="prd-yukleme"><div className="prd-spinner" /><p>Yükleniyor...</p></div>
        ) : products.length === 0 ? (
          <div className="prd-mini">Kayıtlı ürün yok.</div>
        ) : (
          <div className="prd-liste">
            {products.map((p) => (
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

                  <input
                    type="number"
                    defaultValue={p.stock}
                    onBlur={(e) => hizliStok(p.id, Number(e.target.value || 0))}
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