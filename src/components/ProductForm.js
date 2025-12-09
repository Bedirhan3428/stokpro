import "../styles/global.css";
import "../styles/ProductForm.css";

import React, { useEffect, useState } from "react";

function sanitizeString(str) {
  if (!str) return "";
  return String(str).trim();
}

export default function ProductForm({ initial = null, onSubmit, submitLabel = "Kaydet", onCancel }) {
  const [form, setForm] = useState({
    id: initial?.id || null,
    name: initial?.name || "",
    category: initial?.category || "",
    stock: initial?.stock || 0,
    price: initial?.price || 0,
    barcode: initial?.barcode || ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) setForm({ id: initial.id, name: initial.name, category: initial.category, stock: initial.stock, price: initial.price, barcode: initial.barcode || "" });
  }, [initial]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "stock") {
      const v = parseInt(value || 0, 10);
      setForm((f) => ({ ...f, [name]: Number.isNaN(v) ? 0 : v }));
    } else if (name === "price") {
      const v = parseFloat(value || 0);
      setForm((f) => ({ ...f, [name]: Number.isNaN(v) ? 0 : v }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function validate() {
    const name = sanitizeString(form.name);
    if (!name) return "Ürün adı gerekli.";
    if (form.stock < 0) return "Stok negatif olamaz.";
    if (form.price < 0) return "Fiyat negatif olamaz.";
    return "";
  }

  function submit(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    const payload = {
      id: form.id,
      name: sanitizeString(form.name),
      category: sanitizeString(form.category),
      stock: Number(form.stock) || 0,
      price: Number(form.price) || 0,
      barcode: sanitizeString(form.barcode)
    };
    onSubmit(payload);
    if (!form.id) {
      setForm({ id: null, name: "", category: "", stock: 0, price: 0, barcode: "" });
    }
    setError("");
  }

  return (
    <form onSubmit={submit} aria-label="Ürün formu" className="page-product-form">
      <div className="form-grid">
        <div className="form-row">
          <label className="input-label">Ad</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Ürün adı" required className="auth-input" />
        </div>

        <div className="form-row">
          <label className="input-label">Kategori</label>
          <input name="category" value={form.category} onChange={handleChange} placeholder="Kategori" className="auth-input" />
        </div>

        <div className="form-row">
          <label className="input-label">Stok</label>
          <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0" className="auth-input" />
        </div>

        <div className="form-row">
          <label className="input-label">Fiyat (TL)</label>
          <input name="price" value={form.price} onChange={handleChange} type="number" min="0" step="0.01" className="auth-input" />
        </div>

        <div className="form-row">
          <label className="input-label">Barkod (isteğe bağlı)</label>
          <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="Barkod kodu" className="auth-input" />
        </div>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>İptal</button>}
      </div>
    </form>
  );
}