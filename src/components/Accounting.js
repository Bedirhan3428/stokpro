import "../styles/Accounting.css";
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

export default function Accounting() {
  const [sales, setSales] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [customers, setCustomers] = useState([]);
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
      const [sRaw, l, exp, inc, custs] = await Promise.all([
        listSales(),
        listLedger(),
        listLegacyExpenses(),
        listLegacyIncomes(),
        listCustomers()
      ]);

      const normalizedSales = (Array.isArray(sRaw) ? sRaw : []).map((s) => {
        const itemsArr = Array.isArray(s.items) ? s.items : [];
        const items = itemsArr.map((it) => {
          const quantity = Number(it.qty ?? it.quantity ?? 1);
          const rawPrice = it.price ?? it.unitPrice ?? it.unit_price ?? null;
          let price = 0;
          if (rawPrice != null) price = Number(rawPrice || 0);
          else if (it.totalPrice != null || it.total_price != null) {
            const totalP = Number(it.totalPrice ?? it.total_price ?? 0);
            price = quantity > 0 ? totalP / quantity : totalP;
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
      bildirimGoster({ type: "error", title: "Yükleme Hatası", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  function bildirimGoster(n) {
    setNote(n);
    setTimeout(() => setNote(null), 4000);
  }

  function tarihYaz(d) {
    if (!d) return "";
    try {
      const dt = typeof d === "object" && d?.toDate ? d.toDate() : new Date(d);
      return dt.toLocaleString();
    } catch {
      return String(d);
    }
  }

  function para(v) {
    try {
      return Number(v || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
    } catch {
      return v;
    }
  }

  function satisToplam(sale) {
    if (!sale) return 0;
    const t = Number(sale.totals?.total ?? sale.total ?? NaN);
    if (!Number.isNaN(t) && t !== 0) return t;
    const items = Array.isArray(sale.items) ? sale.items : [];
    return items.reduce((sm, it) => sm + (Number(it.price || 0) * Number(it.qty || 0)), 0);
  }

  function satisTipi(t) {
    if (t === "cash") return "Nakit";
    if (t === "credit") return "Veresiye";
    return t || "";
  }

  function duzenlemeAc(row) {
    const temel = {
      kind: row.kind,
      id: row.id,
      rawId: row.raw?.id || row.rawId || row.rawId,
      description: row.description || "",
      amount: typeof row.amount !== "undefined" ? Number(row.amount) : 0
    };
    if (row.kind === "income" || row.kind === "expense") {
      temel.sourceArtifact = row.sourceArtifact || row.raw?.sourceArtifact || null;
      temel.sourcePath = row.sourcePath || row.raw?.sourcePath || null;
    }
    if (row.kind === "sale" || row.raw?.saleId || row.raw?.totals) {
      temel.saleType = row.raw?.saleType || row.saleType;
      temel.existingTotals = row.raw?.totals || row.totals || {};
      temel.amount = Number(temel.existingTotals?.total ?? satisToplam(row));
    }
    setEditingRow(temel);
  }

  async function duzenlemeKaydet() {
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
      await yukle();
      bildirimGoster({ type: "success", title: "Güncellendi", message: "Kayıt başarıyla güncellendi." });
    } catch (err) {
      bildirimGoster({ type: "error", title: "Güncelleme Başarısız", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

  function silOnayHazirla(row) {
    if (row.kind === "sale") {
      setConfirmDelete({ kind: "sale", id: row.id, label: `Satış ${tarihYaz(row.createdAt)}` });
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

  async function silGercek() {
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
      await yukle();
      bildirimGoster({ type: "success", title: "Silindi", message: "Kayıt başarıyla silindi." });
    } catch (err) {
      bildirimGoster({ type: "error", title: "Silme Başarısız", message: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  }

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
    merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return merged;
  })();

  return (
    <div className="acc-sayfa">
      <AccBildirim note={note} />

      {!subLoading && !subActive && (
        <div className="acc-kart acc-uyari-kutu">
          <div className="acc-uyari-baslik">Abonelik gerekli</div>
          <div className="acc-yazi-ince">
            Aboneliğiniz aktif değil; ekleme/güncelleme/silme işlemleri devre dışı. Ayarlar &gt; Ürün Anahtarı
            bölümünden kontrol edebilirsiniz.
          </div>
        </div>
      )}

      <div className="acc-baslik-satiri">
        <h3 className="acc-baslik">Muhasebe</h3>
      </div>

      <section className="acc-bolum">
        <div className="acc-bolum-baslik">Satışlar</div>
        {loading && (
          <div className="acc-yukleme">
            <div className="acc-spinner" />
            <p>Yükleniyor...</p>
          </div>
        )}
        {!loading && sales.length === 0 ? (
          <div className="acc-yazi-ince">Henüz satış kaydı yok.</div>
        ) : (
          <div className="acc-satis-grid">
            {sales
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt || b.raw?.createdAt || b.raw?.created_at || 0) -
                  new Date(a.createdAt || a.raw?.createdAt || a.raw?.created_at || 0)
              )
              .map((s) => {
                const items = Array.isArray(s.items) ? s.items : [];
                const total = satisToplam(s);
                const custId = s.raw?.customerId ?? s.raw?.customer_id ?? null;
                const cust = custId ? (customers || []).find((c) => String(c.id) === String(custId)) : null;
                const custLabel = cust ? ` • ${cust.name}` : "";
                return (
                  <div key={s.id} className="acc-kart acc-satis-karti">
                    <div className="acc-satis-ust">
                      <div>
                        <div className="acc-yazi-kalin">{satisTipi(s.saleType) + custLabel}</div>
                        <div className="acc-yazi-ince">{tarihYaz(s.createdAt)}</div>
                      </div>
                      <div className="acc-satis-toplam">
                        <div className="acc-yazi-kalin">{para(total)}</div>
                        <div className="acc-yazi-ince">{items.length} ürün</div>
                      </div>
                    </div>

                    <div className="acc-satis-urunler">
                      {(items || []).map((it, idx) => (
                        <div key={idx} className="acc-satis-satir">
                          <div className="acc-satis-isim">{it.name || it.productId} x{it.qty}</div>
                          <div className="acc-satis-fiyat">{para(it.price)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="acc-islem-dizisi">
                      <button
                        className="acc-btn acc-btn-cizgi"
                        onClick={() =>
                          duzenlemeAc({ kind: "sale", id: s.id, raw: s, saleType: s.saleType, totals: s.totals })
                        }
                        disabled={loading || !subActive}
                      >
                        Düzenle
                      </button>
                      <button
                        className="acc-btn acc-btn-kirmizi"
                        onClick={() => silOnayHazirla({ kind: "sale", id: s.id, createdAt: s.createdAt })}
                        disabled={loading || !subActive}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <section className="acc-bolum">
        <div className="acc-bolum-baslik">Manuel Gelir / Gider Kayıtları</div>
        <div className="acc-kart acc-tablo-kart">
          <table className="acc-tablo" role="table" aria-label="Manuel gelir gider">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th className="acc-hucre-sag">Tutar</th>
                <th>Tür</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!loading && normalizedLedgerRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="acc-tablo-bos">
                    Henüz manuel gelir/gider kaydı yok.
                  </td>
                </tr>
              ) : (
                normalizedLedgerRows.map((row) => {
                  const amt = row.amount ?? 0;
                  return (
                    <tr key={row.id}>
                      <td className="acc-td-tarih">{tarihYaz(row.createdAt)}</td>
                      <td className="acc-td-aciklama">
                        <div className="acc-yazi-kalin">
                          {row.description || (row.kind === "income" ? "Manuel Gelir" : "Manuel Gider")}
                        </div>
                      </td>
                      <td className="acc-hucre-sag">{para(amt)}</td>
                      <td>{row.kind === "income" ? "Gelir" : "Gider"}</td>
                      <td className="acc-td-islem">
                        <button
                          className="acc-btn acc-btn-cizgi"
                          onClick={() => duzenlemeAc(row)}
                          disabled={loading || !subActive}
                        >
                          Düzenle
                        </button>
                        <button
                          className="acc-btn acc-btn-kirmizi"
                          onClick={() => silOnayHazirla(row)}
                          disabled={loading || !subActive}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingRow && (
        <div className="acc-modal-kaplama">
          <div className="acc-kart acc-modal">
            <div className="acc-modal-baslik">
              <h4>{editingRow.kind === "sale" ? "Satışı Düzenle" : "Kaydı Düzenle"}</h4>
              <button className="acc-btn acc-btn-cizgi" onClick={() => setEditingRow(null)}>
                Kapat
              </button>
            </div>

            <div className="acc-modal-icerik">
              <label className="acc-etiket">Açıklama</label>
              <input
                value={editingRow.description}
                onChange={(e) => setEditingRow((s) => ({ ...s, description: e.target.value }))}
                className="acc-input"
              />

              <label className="acc-etiket">Tutar</label>
              <input
                type="number"
                value={editingRow.amount ?? ""}
                onChange={(e) => setEditingRow((s) => ({ ...s, amount: parseFloat(e.target.value || 0) }))}
                className="acc-input"
              />

              {editingRow.kind === "sale" && (
                <>
                  <label className="acc-etiket">Satış Türü</label>
                  <select
                    value={editingRow.saleType || "cash"}
                    onChange={(e) => setEditingRow((s) => ({ ...s, saleType: e.target.value }))}
                    className="acc-input"
                  >
                    <option value="cash">Nakit</option>
                    <option value="credit">Veresiye</option>
                  </select>
                </>
              )}

              <div className="acc-modal-islem">
                <button className="acc-btn acc-btn-mavi" onClick={duzenlemeKaydet} disabled={loading || !subActive}>
                  Kaydet
                </button>
                <button className="acc-btn acc-btn-cizgi" onClick={() => setEditingRow(null)}>
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="acc-modal-kaplama">
          <div className="acc-kart acc-modal">
            <h4 className="acc-modal-baslik-orta">Silme Onayı</h4>
            <div className="acc-yazi-ince">"{confirmDelete.label}" kaydını silmek istediğinize emin misiniz?</div>
            <div className="acc-modal-islem">
              <button className="acc-btn acc-btn-kirmizi" onClick={silGercek} disabled={loading || !subActive}>
                Evet, Sil
              </button>
              <button className="acc-btn acc-btn-cizgi" onClick={() => setConfirmDelete(null)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}