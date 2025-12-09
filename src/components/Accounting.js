import "../styles/global.css";
import "../styles/Accounting.css";

/* Accounting (updated)
 - Disable edit/delete buttons when user has no active subscription (UI gating).
 - When confirming deletions/edits the backend will still block writes if subscription inactive.
 - Use customer names where possible in labels for clarity.
 - Inline styles moved to Accounting.css and className usage applied.
*/
import React, { useEffect, useState } from "react";
import {
  listLedger,
  listSales,
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

function Notification({ note }) {
  if (!note) return null;
  const color = note?.type === "error" ? "var(--danger)" : (note?.type === "success" ? "var(--success)" : "var(--muted)");
  return (
    <div className={`notification ${note?.type === "error" ? "error" : note?.type === "success" ? "success" : ""}`}>
      <div className="notification-title" style={{ color }}>{note?.title || (note?.type === "error" ? "Hata" : "Bilgi")}</div>
      <div className="notification-sub">{note?.message}</div>
    </div>
  );
}

export default function Accounting() {
  const [sales, setSales] = useState([]);
  const [ledger, setLedger] = useState([]); // still fetched but not listed
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [note, setNote] = useState(null);
  const { loading: subLoading, active: subActive } = useSubscription();

  // single editing state for any row (income/expense/sale)
  const [editingRow, setEditingRow] = useState(null); // { kind, id, rawId, description, amount, sourceArtifact, sourcePath, existingTotals, saleType }
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind: 'sale'|'legacy', id?, rawId?, sourceArtifact?, sourcePath?, label }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function load() {
    setLoading(true);
    try {
      const [sRaw, l, exp, inc, custs] = await Promise.all([
        listSales(),
        listLedger(),
        listLegacyExpenses(),
        listLegacyIncomes(),
        listCustomers()
      ]);

      // Normalize sales (same logic as before)
      const normalizedSales = (Array.isArray(sRaw) ? sRaw : []).map((s) => {
        const itemsArr = Array.isArray(s.items) ? s.items : [];
        const items = itemsArr.map((it) => {
          const quantity = Number(it.qty ?? it.quantity ?? 1);
          const rawPrice = it.price ?? it.unitPrice ?? it.unit_price ?? null;
          let price = 0;
          if (rawPrice != null) {
            price = Number(rawPrice || 0);
          } else if (it.totalPrice != null || it.total_price != null) {
            const totalP = Number(it.totalPrice ?? it.total_price ?? 0);
            price = quantity > 0 ? totalP / quantity : totalP;
          } else {
            price = 0;
          }
          return {
            name: it.name ?? it.productName ?? it.product_name ?? it.productId ?? "Ürün",
            price,
            qty: quantity,
            productId: it.productId ?? it.product_id ?? null,
            raw: it
          };
        });

        const createdAt = s.createdAt ?? s.date ?? s.created_at ?? s.timestamp ?? s.time ?? null;
        const totalVal = Number(s.totals?.total ?? s.total ?? s.totalPrice ?? s.total_price ?? s.sum ?? 0);
        return {
          id: String(s.id ?? s._id ?? s.saleId ?? Math.random().toString(36).slice(2, 9)),
          createdAt,
          saleType: s.saleType ?? s.sale_type ?? s.type ?? "cash",
          items,
          totals: { total: totalVal },
          raw: s
        };
      });

      setSales(normalizedSales);
      setLedger(Array.isArray(l) ? l : []);
      setExpenses(Array.isArray(exp) ? exp : []);
      setIncomes(Array.isArray(inc) ? inc : []);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch (err) {
      showNote({ type: "error", title: "Yükleme Hatası", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  function showNote(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4000);
  }

  function formatDate(d) {
    if (!d) return "";
    try {
      const dt = (typeof d === "object" && d?.toDate) ? d.toDate() : new Date(d);
      return dt.toLocaleString();
    } catch {
      try { return new Date(d).toLocaleString(); } catch { return String(d); }
    }
  }
  function currency(v) { try { return Number(v || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" }); } catch { return v; } }

  function computeSaleTotal(sale) {
    if (!sale) return 0;
    const t = Number(sale.totals?.total ?? sale.total ?? NaN);
    if (!Number.isNaN(t) && t !== 0) return t;
    const items = Array.isArray(sale.items) ? sale.items : [];
    return items.reduce((sm, it) => sm + (Number(it.price || 0) * Number(it.qty || 0)), 0);
  }

  function saleTypeLabel(t) { if (t === "cash") return "Nakit"; if (t === "credit") return "Veresiye"; return t || ""; }

  /* open generic editor for any row */
  function openEditRow(row) {
    const base = {
      kind: row.kind,
      id: row.id,
      rawId: row.raw?.id || row.rawId || row.rawId,
      description: row.description || "",
      amount: typeof row.amount !== "undefined" ? Number(row.amount) : 0
    };
    if (row.kind === "income" || row.kind === "expense") {
      base.sourceArtifact = row.sourceArtifact || row.raw?.sourceArtifact || null;
      base.sourcePath = row.sourcePath || row.raw?.sourcePath || null;
    }
    if (row.kind === "sale" || row.raw?.saleId || row.raw?.totals) {
      base.saleType = row.raw?.saleType || row.saleType;
      base.existingTotals = row.raw?.totals || row.totals || {};
      base.amount = Number(base.existingTotals?.total ?? computeSaleTotal(row));
    }
    setEditingRow(base);
  }

  async function saveEditRow() {
    if (!editingRow) return;
    const { kind, id, rawId, description, amount, sourceArtifact, sourcePath, saleType, existingTotals } = editingRow;
    setLoading(true);
    try {
      if (kind === "sale") {
        const newTotals = { ...(existingTotals || {}), total: Number(amount || 0) };
        if (!subActive) throw new Error("Aboneliğiniz aktif değil. Güncelleme yapılamaz.");
        await updateSale(id, { saleType: saleType || "cash", totals: newTotals });
      } else if (kind === "income" || kind === "expense") {
        if (!subActive) throw new Error("Aboneliğiniz aktif değil. Güncelleme yapılamaz.");
        const docId = rawId || id.replace(/^(income_|expense_)/, "");
        await updateLegacyDocument(sourceArtifact, sourcePath, docId, { description, amount: Number(amount || 0) });
      }
      setEditingRow(null);
      await load();
      showNote({ type: "success", title: "Güncellendi", message: "Kayıt başarıyla güncellendi." });
    } catch (err) {
      showNote({ type: "error", title: "Güncelleme Başarısız", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  /* prepare confirm delete for any row */
  function confirmDeleteRow(row) {
    if (row.kind === "sale") {
      setConfirmDelete({ kind: "sale", id: row.id, label: `Satış ${formatDate(row.createdAt)}` });
    } else if (row.kind === "income" || row.kind === "expense") {
      setConfirmDelete({
        kind: "legacy",
        rawId: row.raw?.id || row.id.replace(/^(income_|expense_)/, ""),
        sourceArtifact: row.sourceArtifact || row.raw?.sourceArtifact,
        sourcePath: row.sourcePath || row.raw?.sourcePath,
        label: row.description || row.raw?.id || row.id
      });
    }
  }

  async function performDelete() {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      if (!subActive) throw new Error("Aboneliğiniz aktif değil. Silme yapılamaz.");
      if (confirmDelete.kind === "sale") {
        await deleteSale(confirmDelete.id);
      } else if (confirmDelete.kind === "legacy") {
        await deleteLegacyDocument(confirmDelete.sourceArtifact, confirmDelete.sourcePath, confirmDelete.rawId);
      }
      setConfirmDelete(null);
      await load();
      showNote({ type: "success", title: "Silindi", message: "Kayıt başarıyla silindi." });
    } catch (err) {
      showNote({ type: "error", title: "Silme Başarısız", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  /* Build normalized rows (manual incomes/expenses) */
  const normalizedLedgerRows = (() => {
    const inc = (incomes || []).map((i) => ({
      kind: "income",
      id: `income_${i.id}`,
      createdAt: i.createdAt || i.created_at || i.timestamp || null,
      description: i.description || i.note || "",
      amount: Number(i.amount ?? i.value ?? 0),
      sourceArtifact: i.sourceArtifact || null,
      sourcePath: i.sourcePath || null,
      raw: i
    }));
    const exp = (expenses || []).map((e) => ({
      kind: "expense",
      id: `expense_${e.id}`,
      createdAt: e.createdAt || e.created_at || e.timestamp || null,
      description: e.description || e.note || "",
      amount: Number(e.amount ?? e.value ?? 0),
      sourceArtifact: e.sourceArtifact || null,
      sourcePath: e.sourcePath || null,
      raw: e
    }));
    const merged = [...inc, ...exp];
    merged.sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    return merged;
  })();

  return (
    <div className="page-accounting">
      <Notification note={note} />

      {!subLoading && !subActive && (
        <div className="card card-subscription-warning">
          <div className="muted-strong">Abonelik gerekli</div>
          <div className="muted-sub">
            Aboneliğiniz aktif değil; ekleme/güncelleme/silme işlemleri devre dışı bırakıldı. Ayarlar &gt; Ürün Anahtarı bölümünden aboneliğinizi kontrol edebilirsiniz.
          </div>
        </div>
      )}

      <div className="header-row">
        <h3 className="page-title">Muhasebe</h3>
        
      </div>

      {/* Sales */}
      <section className="section-block">
        <h4>Satışlar</h4>
        {loading ? <div className="app-loading"><div className="spinner" /><p>Yükleniyor...</p></div> : null}
        {(!loading && sales.length === 0) ? (
          <div className="muted-sub">Henüz satış kaydı yok.</div>
        ) : (
          <div className="sales-grid">
            {sales.slice().sort((a,b)=> new Date(b.createdAt||b.raw?.createdAt||b.raw?.created_at||0) - new Date(a.createdAt||a.raw?.createdAt||a.raw?.created_at||0)).map((s) => {
              const items = Array.isArray(s.items) ? s.items : [];
              const total = computeSaleTotal(s);
              // try to resolve customer name if sale.raw.customerId present
              const custId = s.raw?.customerId ?? s.raw?.customer_id ?? null;
              const cust = custId ? (customers || []).find(c => String(c.id) === String(custId)) : null;
              const custLabel = cust ? ` • ${cust.name}` : "";
              return (
                <div key={s.id} className="card sale-card">
                  <div className="sale-card-top">
                    <div>
                      <div className="muted-strong">{saleTypeLabel(s.saleType)}{custLabel}</div>
                      <div className="muted-small">{formatDate(s.createdAt)}</div>
                    </div>
                    <div className="sale-amount">
                      <div className="muted-strong">{currency(total)}</div>
                      <div className="muted-small">{items.length} ürün</div>
                    </div>
                  </div>

                  <div className="sale-items">
                    {(items || []).map((it, idx) => (
                      <div key={idx} className="sale-item-row">
                        <div className="sale-item-name">{it.name || it.productId} x{it.qty}</div>
                        <div className="sale-item-price">{currency(it.price)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="card-actions">
                    <button className="btn btn-ghost" onClick={() => openEditRow({ kind: "sale", id: s.id, raw: s, saleType: s.saleType, totals: s.totals })} disabled={loading || !subActive}>Düzenle</button>
                    <button className="btn btn-danger" onClick={() => confirmDeleteRow({ kind: "sale", id: s.id, createdAt: s.createdAt })} disabled={loading || !subActive}>Sil</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Manual incomes/expenses table */}
      <section className="section-block">
        <h4>Manuel Gelir / Gider Kayıtları</h4>
        <div className="card table-card">
          <table className="table" role="table" aria-label="Manuel gelir gider">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th className="text-right">Tutar</th>
                <th>Tür</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(!loading && normalizedLedgerRows.length === 0) ? (
                <tr>
                  <td colSpan={5} className="table-empty">Henüz manuel gelir/gider kaydı yok.</td>
                </tr>
              ) : normalizedLedgerRows.map((row) => {
                const amt = row.amount ?? 0;
                return (
                  <tr key={row.id}>
                    <td className="td-date">{formatDate(row.createdAt)}</td>
                    <td className="td-desc">
                      <div className="muted-strong">{row.description || (row.kind === "income" ? "Manuel Gelir" : "Manuel Gider")}</div>
                    </td>
                    <td className="text-right">{currency(amt)}</td>
                    <td>{row.kind === "income" ? "Gelir" : "Gider"}</td>
                    <td className="td-actions">
                      <button className="btn btn-ghost" onClick={() => openEditRow(row)} disabled={loading || !subActive}>Düzenle</button>
                      <button className="btn btn-danger" onClick={() => confirmDeleteRow(row)} disabled={loading || !subActive}>Sil</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Row Modal (used for incomes/expenses/sale) */}
      {editingRow && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <div className="modal-header">
              <h4 className="modal-title">{editingRow.kind === "sale" ? "Satışı Düzenle" : "Kaydı Düzenle"}</h4>
              <button className="btn btn-ghost" onClick={() => setEditingRow(null)}>Kapat</button>
            </div>

            <div className="modal-body">
              <label className="modal-label">Açıklama</label>
              <input value={editingRow.description} onChange={(e) => setEditingRow((s) => ({ ...s, description: e.target.value }))} className="auth-input" />

              <label className="modal-label">Tutar</label>
              <input type="number" value={editingRow.amount ?? ""} onChange={(e) => setEditingRow((s) => ({ ...s, amount: parseFloat(e.target.value || 0) }))} className="auth-input" />

              {editingRow.kind === "sale" && (
                <>
                  <label className="modal-label">Satış Türü</label>
                  <select value={editingRow.saleType || "cash"} onChange={(e) => setEditingRow((s) => ({ ...s, saleType: e.target.value }))} className="auth-input">
                    <option value="cash">Nakit</option>
                    <option value="credit">Veresiye</option>
                  </select>
                </>
              )}

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={saveEditRow} disabled={loading || !subActive}>Kaydet</button>
                <button className="btn btn-ghost" onClick={() => setEditingRow(null)}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <h4 className="modal-title">Silme Onayı</h4>
            <div className="muted-sub"> "{confirmDelete.label}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={performDelete} disabled={loading || !subActive}>Evet, Sil</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}