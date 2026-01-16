import "../styles/Accounting.css";
import React, { useEffect, useState, useMemo } from "react";
import {
  listLedger,
  listRecentSales,
  listLegacyExpenses,
  listLegacyIncomes,
  updateSale,
  deleteSale,
  updateLegacyDocument,
  deleteLegacyDocument,
  listCustomers
} from "../utils/firebaseHelpers";
import useSubscription from "../hooks/useSubscription";
import { 
  FiTrendingUp, FiTrendingDown, FiShoppingCart, FiEdit2, FiTrash2, FiAlertCircle, FiSearch, FiCalendar
} from "react-icons/fi";

// Bildirim Bileşeni
function Bildirim({ note }) {
  if (!note) return null;
  const tipClass = note.type === "error" ? "hata" : note.type === "success" ? "basari" : "bilgi";
  return (
    <div className={`acc-bildirim ${tipClass}`}>
      <div className="acc-bildirim-baslik">{note.title || "Bilgi"}</div>
      <div className="acc-bildirim-icerik">{note.message}</div>
    </div>
  );
}

// Tarih Formatlayıcı
function getDayLabel(date) {
  if (!date) return "Tarihsiz";
  const d = new Date(date);
  const now = new Date();
  const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = nowZero - dZero;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', weekday: 'long' });
}

export default function Accounting() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);
  const { loading: subLoading, active: subActive } = useSubscription();

  const [editingRow, setEditingRow] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    yukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function yukle() {
    setLoading(true);
    try {
      const [sRaw, , exp, inc, custs] = await Promise.all([
        listRecentSales(100), 
        listLedger(),
        listLegacyExpenses(),
        listLegacyIncomes(),
        listCustomers()
      ]);

      const allItems = [];

      // Satışlar
      (Array.isArray(sRaw) ? sRaw : []).forEach((s) => {
        const totalVal = Number(s.totals?.total ?? s.total ?? 0);
        const custId = s.customerId || s.customer_id;
        const custName = custId ? custs.find(c => c.id === custId)?.name : null;
        
        allItems.push({
          type: "sale",
          id: s.id,
          date: new Date(s.createdAt || s.date || 0),
          amount: totalVal,
          title: s.saleType === "credit" ? "Veresiye Satış" : "Nakit Satış",
          subTitle: custName || "Perakende Müşteri",
          desc: `${(s.items || []).length} parça ürün`,
          isCredit: s.saleType === "credit",
          raw: s
        });
      });

      // Gelirler
      (Array.isArray(inc) ? inc : []).forEach((i) => {
        allItems.push({
          type: "income",
          id: `income_${i.id}`,
          rawId: i.id,
          date: new Date(i.createdAt || i.date || 0),
          amount: Number(i.amount || 0),
          title: "Ek Gelir",
          subTitle: "Manuel Kayıt",
          desc: i.description || "-",
          sourceArtifact: i.sourceArtifact,
          sourcePath: i.sourcePath,
          raw: i
        });
      });

      // Giderler
      (Array.isArray(exp) ? exp : []).forEach((e) => {
        allItems.push({
          type: "expense",
          id: `expense_${e.id}`,
          rawId: e.id,
          date: new Date(e.createdAt || e.date || 0),
          amount: Number(e.amount || 0),
          title: "Gider",
          subTitle: "Manuel Kayıt",
          desc: e.description || "-",
          sourceArtifact: e.sourceArtifact,
          sourcePath: e.sourcePath,
          raw: e
        });
      });

      allItems.sort((a, b) => b.date - a.date);
      setTransactions(allItems);

    } catch (err) {
      bildir({ type: "error", title: "Hata", message: "Veriler alınamadı." });
    } finally {
      setLoading(false);
    }
  }

  // Filtreleme & Gruplama
  const processedTransactions = useMemo(() => {
    let filtered = transactions;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = transactions.filter(item => 
        item.title.toLowerCase().includes(t) || 
        item.desc.toLowerCase().includes(t) ||
        (item.subTitle && item.subTitle.toLowerCase().includes(t))
      );
    }

    const groups = {};
    filtered.forEach(t => {
      const label = getDayLabel(t.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });
    return groups;
  }, [transactions, searchTerm]);

  function bildir(n) {
    setNote(n);
    setTimeout(() => setNote(null), 3500);
  }

  function duzenlemeAc(item) {
    const temel = {
      kind: item.type,
      id: item.rawId || item.id,
      description: item.desc || "",
      amount: item.amount,
      sourceArtifact: item.sourceArtifact,
      sourcePath: item.sourcePath,
      raw: item.raw
    };
    if (item.type === "sale") {
      temel.saleType = item.raw.saleType || "cash";
      temel.existingTotals = item.raw.totals || {};
    }
    setEditingRow(temel);
  }

  async function duzenlemeKaydet() {
    if (!editingRow) return;
    const { kind, id, description, amount, sourceArtifact, sourcePath, saleType, existingTotals } = editingRow;
    
    if (!subActive) return bildir({type: "error", title: "Kısıtlı", message: "Abonelik gerekli."});

    setLoading(true);
    try {
      if (kind === "sale") {
        const newTotals = { ...(existingTotals || {}), total: Number(amount || 0) };
        await updateSale(id, { saleType: saleType || "cash", totals: newTotals });
      } else {
        const docId = String(id).replace(/^(income_|expense_)/, "");
        await updateLegacyDocument(sourceArtifact, sourcePath, docId, { description, amount: Number(amount || 0) });
      }
      setEditingRow(null);
      await yukle();
      bildir({ type: "success", title: "Başarılı", message: "Kayıt güncellendi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function silGercek() {
    if (!confirmDelete) return;
    if (!subActive) return bildir({type: "error", title: "Kısıtlı", message: "Abonelik gerekli."});

    setLoading(true);
    try {
      if (confirmDelete.type === "sale") {
        await deleteSale(confirmDelete.id);
      } else {
         const docId = String(confirmDelete.rawId || confirmDelete.id).replace(/^(income_|expense_)/, "");
         await deleteLegacyDocument(confirmDelete.sourceArtifact, confirmDelete.sourcePath, docId);
      }
      setConfirmDelete(null);
      await yukle();
      bildir({ type: "success", title: "Başarılı", message: "Kayıt silindi." });
    } catch (err) {
      bildir({ type: "error", title: "Hata", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="acc-container">
      <Bildirim note={note} />

      {!subLoading && !subActive && (
        <div className="alert-banner">
          <FiAlertCircle size={20} />
          <span>Hesabınız kısıtlı. Tüm özellikleri açmak için:</span>
          <a href="https://www.stokpro.shop/product-key" className="alert-link">Ücretsiz Etkinleştir</a>
        </div>
      )}

      {/* --- LİSTELEME ALANI --- */}
      <div className="acc-card list-section">
        <div className="list-header">
           <h3>İşlem Geçmişi</h3>
           <div className="search-wrapper">
             <FiSearch className="search-icon" />
             <input 
               placeholder="İşlem ara..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="search-input"
             />
           </div>
        </div>

        {loading ? (
          <div className="acc-loading"><div className="spinner"></div></div>
        ) : Object.keys(processedTransactions).length === 0 ? (
          <div className="acc-empty">
             <FiCalendar size={40} />
             <p>Kayıt bulunamadı.</p>
          </div>
        ) : (
          <div className="timeline-wrapper">
             {Object.keys(processedTransactions).map(day => (
               <div key={day} className="timeline-group">
                 <div className="timeline-date">
                   <span>{day}</span>
                   <div className="line"></div>
                 </div>
                 
                 <div className="transaction-list">
                   {processedTransactions[day].map(item => {
                      // İkon ve Renk Seçimi
                      let icon = <FiShoppingCart />;
                      let colorClass = "blue";
                      
                      if (item.type === "sale") {
                         colorClass = item.isCredit ? "orange" : "blue";
                      } else if (item.type === "income") {
                         icon = <FiTrendingUp />;
                         colorClass = "green";
                      } else if (item.type === "expense") {
                         icon = <FiTrendingDown />;
                         colorClass = "red";
                      }

                      return (
                        <div key={item.id} className="trans-item">
                           <div className={`trans-icon-box ${colorClass}`}>
                              {icon}
                           </div>
                           
                           <div className="trans-info">
                              <div className="trans-title">{item.title}</div>
                              <div className="trans-sub">{item.subTitle} • {item.desc}</div>
                           </div>

                           <div className="trans-meta">
                              <div className={`trans-amount ${item.type === "expense" ? "neg" : "pos"}`}>
                                 {item.type === "expense" ? "-" : "+"}{Number(item.amount).toLocaleString("tr-TR", {minimumFractionDigits: 2})} ₺
                              </div>
                              <div className="trans-time">
                                 {item.date.toLocaleTimeString("tr-TR", {hour: '2-digit', minute:'2-digit'})}
                              </div>
                           </div>

                           <div className="trans-actions">
                              <button onClick={() => duzenlemeAc(item)} className="action-btn edit"><FiEdit2 /></button>
                              <button onClick={() => setConfirmDelete(item)} className="action-btn delete"><FiTrash2 /></button>
                           </div>
                        </div>
                      )
                   })}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* --- DÜZENLEME MODALI --- */}
      {editingRow && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h4>Kaydı Düzenle</h4>
              <button onClick={() => setEditingRow(null)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <label>Açıklama</label>
              <input 
                value={editingRow.description} 
                onChange={e => setEditingRow(s => ({...s, description: e.target.value}))}
                className="modern-input"
                disabled={editingRow.kind === "sale"} // Satış detayları otomatik
              />

              <label>Tutar (₺)</label>
              <input 
                type="number"
                value={editingRow.amount}
                onChange={e => setEditingRow(s => ({...s, amount: e.target.value}))}
                className="modern-input"
              />

              {editingRow.kind === "sale" && (
                <>
                  <label>Satış Türü</label>
                  <select 
                     value={editingRow.saleType}
                     onChange={e => setEditingRow(s => ({...s, saleType: e.target.value}))}
                     className="modern-input"
                  >
                    <option value="cash">Nakit</option>
                    <option value="credit">Veresiye</option>
                  </select>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditingRow(null)} className="modern-btn ghost">İptal</button>
              <button onClick={duzenlemeKaydet} className="modern-btn primary">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SİLME ONAYI --- */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-card small">
             <div className="modal-icon danger"><FiTrash2 /></div>
             <h4>Siliniyor</h4>
             <p>Bu işlemi silmek bakiyeleri etkileyebilir. Emin misin?</p>
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

