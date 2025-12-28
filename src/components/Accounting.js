import "../styles/Accounting.css";
import React, { useEffect, useState, useMemo } from "react";
import {
  listLedger,
  listRecentSales, // listSales yerine hızlı olanı kullanıyoruz
  listLegacyExpenses,
  listLegacyIncomes,
  updateLedgerEntry,
  deleteLedgerEntry,
  updateSale,
  deleteSale,
  updateLegacyDocument,
  deleteLegacyDocument,
  listCustomers
} from "../utils/firebaseHelpers";
import "../utils/chartSetup";
import useSubscription from "../hooks/useSubscription";
import { MdEdit } from "react-icons/md";
import { IoMdTrash } from "react-icons/io";
import { IoMdTrendingDown } from "react-icons/io";
import { IoMdTrendingUp } from "react-icons/io";
import { IoReceipt } from "react-icons/io5";
import { FaMoneyBillWave } from "react-icons/fa";


function AccBildirim({ note }) {
  if (!note) return null;
  const tone =
    note?.type === "error" ? "uyari-kirmizi" : note?.type === "success" ? "uyari-yesil" : "uyari-norm";
  return (
    <div className={`acc-uyari ${tone}`}>
      <div className="acc-uyari-baslik">{note?.title || (note?.type === "error" ? "Hata" : "Bilgi")}</div>
      <div className="acc-uyari-icerik">{note?.message}</div>
    </div>
  );
}

// Tarih formatlamak için yardımcılar
function getDayLabel(date) {
  if (!date) return "Tarihsiz";
  const d = new Date(date);
  const now = new Date();
  
  // Saatleri sıfırla karşılaştırma için
  const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowZero - dZero;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  
  return d.toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

export default function Accounting() {
  const [transactions, setTransactions] = useState([]); // Tüm işlemler tek listede
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);
  const { loading: subLoading, active: subActive } = useSubscription();

  const [editingRow, setEditingRow] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    yukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function yukle() {
    setLoading(true);
    try {
      // Hız için listRecentSales kullanıyoruz (Son 100 satış)
      const [sRaw, l, exp, inc, custs] = await Promise.all([
        listRecentSales(100), 
        listLedger(),
        listLegacyExpenses(),
        listLegacyIncomes(),
        listCustomers()
      ]);

      const allItems = [];

      // 1. SATIŞLARI İŞLE
      (Array.isArray(sRaw) ? sRaw : []).forEach((s) => {
        const totalVal = Number(s.totals?.total ?? s.total ?? 0);
        const custId = s.customerId || s.customer_id;
        const custName = custId ? custs.find(c => c.id === custId)?.name : null;
        
        allItems.push({
          type: "sale",
          id: s.id,
          date: new Date(s.createdAt || s.date || 0),
          amount: totalVal,
          title: s.saleType === "credit" ? `Veresiye Satış ${custName ? `(${custName})` : ""}` : "Nakit Satış",
          desc: `${(s.items || []).length} parça ürün`,
          isCredit: s.saleType === "credit",
          raw: s
        });
      });

      // 2. GELİRLERİ İŞLE (Legacy)
      (Array.isArray(inc) ? inc : []).forEach((i) => {
        allItems.push({
          type: "income",
          id: `income_${i.id}`,
          rawId: i.id,
          date: new Date(i.createdAt || i.date || 0),
          amount: Number(i.amount || 0),
          title: "Manuel Gelir",
          desc: i.description || "Açıklama yok",
          sourceArtifact: i.sourceArtifact,
          sourcePath: i.sourcePath,
          raw: i
        });
      });

      // 3. GİDERLERİ İŞLE (Legacy)
      (Array.isArray(exp) ? exp : []).forEach((e) => {
        allItems.push({
          type: "expense",
          id: `expense_${e.id}`,
          rawId: e.id,
          date: new Date(e.createdAt || e.date || 0),
          amount: Number(e.amount || 0),
          title: "Manuel Gider",
          desc: e.description || "Açıklama yok",
          sourceArtifact: e.sourceArtifact,
          sourcePath: e.sourcePath,
          raw: e
        });
      });

      // Tarihe göre yeniden eskiye sırala
      allItems.sort((a, b) => b.date - a.date);

      setTransactions(allItems);

    } catch (err) {
      bildirimGoster({ type: "error", title: "Yükleme Hatası", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  // --- GRUPLAMA MANTIĞI ---
  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach(t => {
      const label = getDayLabel(t.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });
    return groups;
  }, [transactions]);


  function bildirimGoster(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4000);
  }

  function para(v) {
    return Number(v || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
  }

  function duzenlemeAc(item) {
    const temel = {
      kind: item.type, // sale, income, expense
      id: item.rawId || item.id, // sale için id, income/expense için rawId
      description: item.desc || "",
      amount: item.amount,
      sourceArtifact: item.sourceArtifact,
      sourcePath: item.sourcePath,
      raw: item.raw
    };
    
    // Satış özel alanları
    if (item.type === "sale") {
      temel.saleType = item.raw.saleType || "cash";
      temel.existingTotals = item.raw.totals || {};
    }

    setEditingRow(temel);
  }

  async function duzenlemeKaydet() {
    if (!editingRow) return;
    const { kind, id, description, amount, sourceArtifact, sourcePath, saleType, existingTotals } = editingRow;
    setLoading(true);
    try {
      if (!subActive) throw new Error("Aboneliğiniz aktif değil.");

      if (kind === "sale") {
        // Satış güncelleme
        const newTotals = { ...(existingTotals || {}), total: Number(amount || 0) };
        await updateSale(id, { saleType: saleType || "cash", totals: newTotals });
      } else {
        // Gelir/Gider güncelleme (Legacy support)
        // ID'den prefix'i temizle (income_123 -> 123)
        const docId = String(id).replace(/^(income_|expense_)/, "");
        await updateLegacyDocument(sourceArtifact, sourcePath, docId, { description, amount: Number(amount || 0) });
      }

      setEditingRow(null);
      await yukle();
      bildirimGoster({ type: "success", title: "Güncellendi", message: "Kayıt güncellendi." });
    } catch (err) {
      bildirimGoster({ type: "error", title: "Hata", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  function silOnayHazirla(item) {
    setConfirmDelete(item);
  }

  async function silGercek() {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      if (!subActive) throw new Error("Aboneliğiniz aktif değil.");

      if (confirmDelete.type === "sale") {
        await deleteSale(confirmDelete.id);
      } else {
         const docId = String(confirmDelete.rawId || confirmDelete.id).replace(/^(income_|expense_)/, "");
         await deleteLegacyDocument(confirmDelete.sourceArtifact, confirmDelete.sourcePath, docId);
      }

      setConfirmDelete(null);
      await yukle();
      bildirimGoster({ type: "success", title: "Silindi", message: "Kayıt silindi." });
    } catch (err) {
      bildirimGoster({ type: "error", title: "Hata", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="acc-sayfa">
      <AccBildirim note={note} />

      {!subLoading && !subActive && (
        <div className="acc-kart acc-uyari-kutu">
          <div className="acc-uyari-baslik">Abonelik gerekli</div>
          <div className="acc-yazi-ince">
           <a href="https://www.stokpro.shop/product-key" style={{color:"#1f6feb",fontWeight:"bold"}}>Satın Almak için tıklayın</a>
          </div>
        </div>
      )}

      <div className="acc-baslik-satiri">
        <h3 className="acc-baslik">İşlem Geçmişi</h3>
      </div>

      {loading && (
        <div className="acc-yukleme">
          <div className="acc-spinner" />
          <p>Veriler yükleniyor...</p>
        </div>
      )}

      {!loading && Object.keys(groupedTransactions).length === 0 && (
        <div className="acc-bos-mesaj">Henüz bir işlem kaydı yok.</div>
      )}

      {/* --- TIMELINE (ZAMAN ÇİZELGESİ) YAPISI --- */}
      <div className="acc-timeline">
        {Object.keys(groupedTransactions).map((dayLabel) => (
          <div key={dayLabel} className="acc-gun-grubu">
            <div className="acc-gun-baslik">{dayLabel}</div>
            
            {groupedTransactions[dayLabel].map((item) => {
              // Renk ve İkon Belirleme
              let iconClass = "acc-ikon-gri";
              let amountClass = "";
              let iconChar = "❔"; // Varsayılan ikon

              if (item.type === "sale") {
                if (item.isCredit) {
                  iconClass = "acc-ikon-turuncu";
                  amountClass = "acc-renk-turuncu";
                  iconChar = <IoReceipt />; // Veresiye
                } else {
                  iconClass = "acc-ikon-mavi";
                  amountClass = "acc-renk-mavi";
                  iconChar = <FaMoneyBillWave />; // Nakit
                }
              } else if (item.type === "income") {
                iconClass = "acc-ikon-yesil";
                amountClass = "acc-renk-yesil";
                iconChar = <IoMdTrendingUp />; // Tahsilat/Gelir
              } else if (item.type === "expense") {
                iconClass = "acc-ikon-kirmizi";
                amountClass = "acc-renk-kirmizi";
                iconChar = <IoMdTrendingDown />; // Gider
              }

              return (
                <div key={item.id} className="acc-satir-kart">
                  <div className={`acc-ikon-kutusu ${iconClass}`}>
                    {iconChar}
                  </div>
                  
                  <div className="acc-satir-detay">
                    <div className="acc-satir-baslik">{item.title}</div>
                    <div className="acc-satir-aciklama">
                      {item.date.toLocaleTimeString("tr-TR", {hour: '2-digit', minute:'2-digit'})} • {item.desc}
                    </div>
                  </div>

                  <div className="acc-satir-sag">
                    <div className={`acc-tutar ${amountClass}`}>
                      {item.type === "expense" ? "- " : "+ "}
                      {para(item.amount)}
                    </div>
                    <div className="acc-aksiyonlar">
                      <button className="acc-btn-kucuk" onClick={() => duzenlemeAc(item)}><MdEdit /></button>
                      <button className="acc-btn-kucuk kirmizi" onClick={() => silOnayHazirla(item)}><IoMdTrash /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* --- MODALLAR --- */}
      {editingRow && (
        <div className="acc-modal-kaplama">
          <div className="acc-kart acc-modal">
            <div className="acc-modal-baslik">
              <h4>Düzenle</h4>
              <button className="acc-btn acc-btn-cizgi" onClick={() => setEditingRow(null)}>Kapat</button>
            </div>
            <div className="acc-modal-icerik">
              <label className="acc-etiket">Açıklama</label>
              <input
                value={editingRow.description}
                onChange={(e) => setEditingRow((s) => ({ ...s, description: e.target.value }))}
                className="acc-input"
                disabled={editingRow.kind === "sale"} // Satış açıklaması otomatiktir genelde
              />
              <label className="acc-etiket">Tutar</label>
              <input
                type="number"
                value={editingRow.amount}
                onChange={(e) => setEditingRow((s) => ({ ...s, amount: parseFloat(e.target.value || 0) }))}
                className="acc-input"
              />
              {editingRow.kind === "sale" && (
                <>
                  <label className="acc-etiket">Satış Türü</label>
                  <select
                    value={editingRow.saleType}
                    onChange={(e) => setEditingRow((s) => ({ ...s, saleType: e.target.value }))}
                    className="acc-input"
                  >
                    <option value="cash">Nakit</option>
                    <option value="credit">Veresiye</option>
                  </select>
                </>
              )}
              <div className="acc-modal-islem">
                <button className="acc-btn acc-btn-mavi" onClick={duzenlemeKaydet} disabled={!subActive}>Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="acc-modal-kaplama">
          <div className="acc-kart acc-modal">
            <h4 className="acc-modal-baslik-orta">Silme Onayı</h4>
            <div className="acc-yazi-ince">Bu kaydı silmek istediğinize emin misiniz?</div>
            <div className="acc-modal-islem">
              <button className="acc-btn acc-btn-kirmizi" onClick={silGercek} disabled={!subActive}>Evet, Sil</button>
              <button className="acc-btn acc-btn-cizgi" onClick={() => setConfirmDelete(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

