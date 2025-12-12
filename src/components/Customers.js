import "../styles/Customers.css";
import React, { useEffect, useState } from "react";
import {
  listCustomers,
  addCustomer,
  getCustomer,
  listCustomerSales,
  listCustomerPayments,
  addCustomerPayment,
  updateCustomer,
  setCustomerBalance,
  deleteCustomer
} from "../utils/firebaseHelpers";
import useSubscription from "../hooks/useSubscription";

function MusteriBildirim({ note }) {
  if (!note) return null;
  const tip =
    note.type === "error" ? "musteri-uyari kirmizi" : note.type === "success" ? "musteri-uyari yesil" : "musteri-uyari mavi";
  return (
    <div className={tip}>
      <div className="musteri-uyari-baslik">{note.title || (note.type === "error" ? "Hata" : "Bilgi")}</div>
      <div className="musteri-uyari-icerik">{note.message}</div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  const [detailCustomer, setDetailCustomer] = useState(null);
  const [custSales, setCustSales] = useState([]);
  const [custPayments, setCustPayments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBalance, setEditBalance] = useState("");

  const [note, setNote] = useState(null);
  const { loading: subLoading, active: subActive } = useSubscription();

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  async function yenile() {
    setLoading(true);
    try {
      const data = await listCustomers();
      setCustomers((data || []).map((c) => ({ ...c, balance: Number(c.balance || 0) })));
    } catch (err) {
      bildir({ type: "error", title: "Yükleme Hatası", message: String(err.message || err) });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    yenile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function musteriEkle() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Müşteri eklemek için abonelik gereklidir." });
    const tName = (name || "").trim();
    const tPhone = (phone || "").trim();
    if (!tName) return bildir({ type: "error", title: "Eksik bilgi", message: "İsim gerekli." });
    if (!tPhone || tPhone.length < 6) return bildir({ type: "error", title: "Telefon hatası", message: "Geçerli bir telefon girin." });
    try {
      await addCustomer({ name: tName, phone: tPhone });
      setName("");
      setPhone("");
      await yenile();
      bildir({ type: "success", title: "Başarılı", message: "Müşteri eklendi." });
    } catch (err) {
      bildir({ type: "error", title: "Kaydetme Hatası", message: String(err.message || err) });
    }
  }

  async function detayAc(customerId) {
    setDetailLoading(true);
    setEditMode(false);
    try {
      const cust = await getCustomer(customerId);
      const sales = await listCustomerSales(customerId);
      const payments = await listCustomerPayments(customerId);
      setDetailCustomer(cust);
      setCustSales(Array.isArray(sales) ? sales : []);
      setCustPayments(Array.isArray(payments) ? payments : []);
      setEditName(cust?.name || "");
      setEditPhone(cust?.phone || "");
      setEditBalance(cust?.balance != null ? String(Number(cust.balance || 0)) : "");
    } catch (err) {
      bildir({ type: "error", title: "Yükleme Hatası", message: "Detaylar yüklenemedi." });
      setDetailCustomer(null);
      setCustSales([]);
      setCustPayments([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function odemeEkle() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Ödeme eklemek için abonelik gereklidir." });
    const amt = Number(payAmount);
    if (!detailCustomer) return;
    if (!amt || amt <= 0) return bildir({ type: "error", title: "Geçersiz tutar", message: "Geçerli tutar girin." });
    const currentBalance = Number(detailCustomer.balance || 0);
    if (currentBalance <= 0) return bildir({ type: "error", title: "Borç yok", message: "Müşterinin borcu yok." });
    if (amt > currentBalance) return bildir({ type: "error", title: "Aşırı ödeme", message: `Maks: ${currentBalance}` });
    try {
      const res = await addCustomerPayment(detailCustomer.id, { amount: amt, note: payNote });
      await detayAc(detailCustomer.id);
      await yenile();
      setPayAmount("");
      setPayNote("");
      bildir({ type: "success", title: "Ödeme kaydedildi", message: `Yeni bakiye: ${res?.newBalance ?? ""}` });
    } catch (err) {
      bildir({ type: "error", title: "Ödeme hatası", message: String(err.message || err) });
    }
  }

  async function musteriKaydet() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Güncelleme için abonelik gereklidir." });
    if (!detailCustomer) return;
    const tName = (editName || "").trim();
    const tPhone = (editPhone || "").trim();
    if (!tName) return bildir({ type: "error", title: "Eksik bilgi", message: "İsim gerekli." });
    try {
      await updateCustomer(detailCustomer.id, { name: tName, phone: tPhone || null });
      await detayAc(detailCustomer.id);
      await yenile();
      setEditMode(false);
      bildir({ type: "success", title: "Güncellendi", message: "Müşteri güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Güncelleme hatası", message: String(err.message || err) });
    }
  }

  async function bakiyeGuncelle() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Bakiye düzenleme için abonelik gereklidir." });
    if (!detailCustomer) return;
    const nb = Number(editBalance);
    if (isNaN(nb)) return bildir({ type: "error", title: "Geçersiz bakiye", message: "Geçerli sayı girin." });
    try {
      const res = await setCustomerBalance(detailCustomer.id, nb, "Manual edit");
      await detayAc(detailCustomer.id);
      await yenile();
      bildir({ type: "success", title: "Bakiye güncellendi", message: `Yeni bakiye: ${res?.newBalance ?? ""}` });
    } catch (err) {
      bildir({ type: "error", title: "Güncelleme hatası", message: String(err.message || err) });
    }
  }

  async function musteriSil() {
    if (!subActive) return bildir({ type: "error", title: "Abonelik gerekli", message: "Silme için abonelik gereklidir." });
    if (!detailCustomer) return;
    if (!window.confirm("Müşteriyi silmek istediğinize emin misiniz? (Alt koleksiyonlar da silinir)")) return;
    try {
      await deleteCustomer(detailCustomer.id);
      setDetailCustomer(null);
      await yenile();
      bildir({ type: "success", title: "Silindi", message: "Müşteri silindi." });
    } catch (err) {
      bildir({ type: "error", title: "Silme hatası", message: String(err.message || err) });
    }
  }

  return (
    <div className="musteri-sayfa">
      <MusteriBildirim note={note} />

      {!subLoading && !subActive && (
        <div className="musteri-kart musteri-uyari-kutu">
          <div className="musteri-uyari-baslik">Abonelik gerekli</div>
          <div className="musteri-uyari-icerik"><a href="https://www.stokpro.shop/product-key" style={{color:"#1f6feb",fontWeight:"bold"}}>Satın Almak için tıklayın</a></div>
        </div>
      )}

      <div className="musteri-kart musteri-ekle">
        <h3 className="musteri-baslik">Müşteri Ekle</h3>
        <div className="musteri-form-satir">
          <input placeholder="Müşteri adı" value={name} onChange={(e) => setName(e.target.value)} className="musteri-input" />
          <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} className="musteri-input" />
          <button className="musteri-btn mavi" onClick={musteriEkle} disabled={!subActive}>
            Ekle
          </button>
        </div>
      </div>

      <div className="musteri-kart">
        <h3 className="musteri-baslik">Müşteri Listesi</h3>
        {loading ? (
          <div className="musteri-yukleme">
            <div className="musteri-spinner" />
            <p>Yükleniyor...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="musteri-uyari-icerik">Kayıtlı müşteri yok.</div>
        ) : (
          <div className="musteri-liste">
            {customers.map((c) => (
              <div key={c.id} className="musteri-satir">
                <div>
                  <div className="musteri-isim">{c.name}</div>
                  <div className="musteri-alt">Telefon: {c.phone || "—"}</div>
                  <div className="musteri-alt">
                    Bakiye: {Number(c.balance || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </div>
                </div>
                <button className="musteri-btn cizgi" onClick={() => detayAc(c.id)}>
                  Detay
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailCustomer && (
        <div className="musteri-modal-kaplama">
          <div className="musteri-modal">
            <div className="musteri-modal-baslik">
              <div>
                <h3 className="musteri-isim">{detailCustomer.name}</h3>
                <div className="musteri-alt">Telefon: {detailCustomer.phone || "—"}</div>
                <div className="musteri-alt">
                  Bakiye: {Number(detailCustomer.balance || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </div>
              </div>

              <div className="musteri-modal-aks">
                <button
                  className="musteri-btn cizgi"
                  onClick={() => {
                    setEditMode((s) => !s);
                    setEditName(detailCustomer.name);
                    setEditPhone(detailCustomer.phone || "");
                  }}
                  disabled={!subActive}
                >
                  Düzenle
                </button>
                <button className="musteri-btn kirmizi" onClick={musteriSil} disabled={!subActive}>
                  Sil
                </button>
                <button className="musteri-btn cizgi" onClick={() => setDetailCustomer(null)}>
                  Kapat
                </button>
              </div>
            </div>

            <div className="musteri-modal-icerik">
              <aside className="musteri-sol">
                {editMode ? (
                  <div className="musteri-altkart">
                    <h5 className="musteri-baslik">Müşteri Düzenle</h5>
                    <label className="musteri-etiket">İsim</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="musteri-input" />
                    <label className="musteri-etiket">Telefon</label>
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="musteri-input" />
                    <div className="musteri-form-satir">
                      <button className="musteri-btn mavi" onClick={musteriKaydet} disabled={!subActive}>
                        Kaydet
                      </button>
                      <button className="musteri-btn cizgi" onClick={() => setEditMode(false)}>
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="musteri-altkart">
                    <h5 className="musteri-baslik">Tahsilat / Ödeme Ekle</h5>
                    <label className="musteri-etiket">Tutar</label>
                    <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="musteri-input" />
                    <label className="musteri-etiket">Açıklama</label>
                    <textarea value={payNote} onChange={(e) => setPayNote(e.target.value)} className="musteri-textarea" />
                    <div className="musteri-form-satir">
                      <button className="musteri-btn mavi" onClick={odemeEkle} disabled={!subActive}>
                        Kaydet
                      </button>
                      <button className="musteri-btn cizgi" onClick={() => { setPayAmount(""); setPayNote(""); }}>
                        Temizle
                      </button>
                    </div>

                    <hr className="musteri-hr" />

                    <h5 className="musteri-baslik">Bakiye Düzenle</h5>
                    <label className="musteri-etiket">Yeni Bakiye</label>
                    <input value={editBalance} onChange={(e) => setEditBalance(e.target.value)} className="musteri-input" />
                    <div className="musteri-form-satir">
                      <button className="musteri-btn mavi" onClick={bakiyeGuncelle} disabled={!subActive}>
                        Güncelle
                      </button>
                    </div>
                  </div>
                )}
              </aside>

              <main className="musteri-sag">
                <h4 className="musteri-baslik">Müşterinin Satışları</h4>
                {detailLoading ? (
                  <div className="musteri-alt">Yükleniyor...</div>
                ) : custSales.length === 0 ? (
                  <div className="musteri-alt">Satış yok.</div>
                ) : (
                  <div className="musteri-grid">
                    {custSales.map((s) => (
                      <div key={s.id} className="musteri-satis-kart">
                        <div>
                          <div className="musteri-alt">{new Date(s.createdAt).toLocaleString()}</div>
                          <div className="musteri-alt">{(s.items || []).map((it) => `${it.name} x${it.qty}`).join(", ")}</div>
                        </div>
                        <div>
                          <div className="musteri-isim">
                            {Number(s.totals?.total || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </div>
                          <div className="musteri-alt">{s.saleType === "cash" ? "Nakit" : "Veresiye"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="musteri-odeme-blok">
                  <h4 className="musteri-baslik">Ödemeler</h4>
                  {detailLoading ? (
                    <div className="musteri-alt">Yükleniyor...</div>
                  ) : custPayments.length === 0 ? (
                    <div className="musteri-alt">Ödeme kaydı yok.</div>
                  ) : (
                    <div className="musteri-grid">
                      {custPayments.map((p) => (
                        <div key={p.id} className="musteri-odeme-kart">
                          <div>
                            <div className="musteri-alt">{new Date(p.createdAt).toLocaleString()}</div>
                            <div className="musteri-alt">{p.note || ""}</div>
                          </div>
                          <div className="musteri-isim">
                            {Number(p.amount || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}