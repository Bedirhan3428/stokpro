"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { storage, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  addProduct,
  updateProduct,
  deleteProduct
} from "../utils/artifactUserProducts";
import { 
  syncFullMasterStore, 
  getMasterStoreSnapshot, 
  subscribeToMasterStore,
  updateMemoryStoreOptimistically,
  invalidateAndRefreshMasterCache
} from "../utils/masterDataCache";
import useSubscription from "../hooks/useSubscription";
import Toast from "./Toast";
import { 
  FiTrash2, FiEdit2, FiSearch, FiPlus, FiAlertCircle, FiFilter, FiImage, FiPackage, FiX, FiRefreshCw, FiUploadCloud, FiLayers, FiFileText
} from "react-icons/fi";

function QtyStepper({ value, onChange, min = 0, disabled = false }) {
  return (
    <div className="qty-stepper">
      <button 
        type="button"
        className="qty-stepper-btn" 
        onClick={() => onChange(Math.max(min, Number(value || 0) - 1))}
        disabled={disabled || value <= min}
      >
        -
      </button>
      <input
        type="number"
        className="qty-stepper-input"
        value={value}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value, 10) || min))}
        disabled={disabled}
      />
      <button 
        type="button"
        className="qty-stepper-btn" 
        onClick={() => onChange(Number(value || 0) + 1)}
        disabled={disabled}
      >
        +
      </button>
    </div>
  );
}

const DEFAULT_CATEGORIES = ["Genel", "Gıda", "Elektronik", "Giyim", "Kırtasiye", "Temizlik", "Hırdavat"];

const INITIAL_BULK_ROWS = [
  { name: "", category: "Genel", price: "", stock: "", barcode: "", imageUrl: "" },
  { name: "", category: "Genel", price: "", stock: "", barcode: "", imageUrl: "" },
  { name: "", category: "Genel", price: "", stock: "", barcode: "", imageUrl: "" },
  { name: "", category: "Genel", price: "", stock: "", barcode: "", imageUrl: "" },
  { name: "", category: "Genel", price: "", stock: "", barcode: "", imageUrl: "" },
];

export default function Products() {
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // FİLTRELEME & SIRALAMA STATE'LERİ
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  // Popup Modal Controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Form State for New Product
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);

  // Toplu Ürün Ekleme State'leri
  const [bulkRows, setBulkRows] = useState(INITIAL_BULK_ROWS);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Görsel Yükleme Durumu
  const [uploadingImage, setUploadingImage] = useState(false);

  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [note, setNote] = useState(null);

  // Target Highlight State
  const [highlightedId, setHighlightedId] = useState(null);

  const { loading: subLoading, active: subActive } = useSubscription();
  const catWrapperRef = useRef(null);

  // STOK GÜNCELLEME DEBOUNCE (HIZ KONTROLÜ) TIMER MAP
  const stockTimerMap = useRef({});

  // AKILLI BİLDİRİM GÜNCELLEME (MEVCUT BİLDİRİMİ YENİLER)
  function bildir(n) {
    const now = Date.now();
    setNote(prev => {
      return {
        ...n,
        renewedAt: now,
        id: prev?.title === n.title ? (prev.id || now) : now
      };
    });
  }

  useEffect(() => {
    const initialSnap = getMasterStoreSnapshot();
    if (initialSnap.products && initialSnap.products.length > 0) {
      setProducts(initialSnap.products);
      setLoading(false);
    }

    const unsubscribe = subscribeToMasterStore((store) => {
      if (store && store.products) {
        setProducts(store.products);
        setLoading(false);
      }
    });

    syncFullMasterStore(false).then((store) => {
      if (store && store.products) {
        setProducts(store.products);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    function handleClickOutside(event) {
      if (catWrapperRef.current && !catWrapperRef.current.contains(event.target)) {
        setShowCatSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Deep Link Highlight Detection
  useEffect(() => {
    if (highlightParam && products.length > 0) {
      const target = products.find(p => p.name.toLowerCase() === highlightParam.toLowerCase() || p.id === highlightParam);
      if (target) {
        setHighlightedId(target.id);
        setTimeout(() => {
          const el = document.getElementById(`prod-row-${target.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
        setTimeout(() => setHighlightedId(null), 5500);
      }
    }
  }, [highlightParam, products]);

  // FIREBASE STORAGE ÜZERİNDEN ÜRÜN GÖRSELİ YÜKLEME
  async function handleProductImageUpload(file, isEdit = false, bulkIndex = null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return bildir({ type: "warning", title: "Büyük Görsel", message: "Ürün fotoğrafı 5MB'dan küçük olmalıdır." });
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return bildir({ type: "error", title: "Oturum Yok", message: "Lütfen önce giriş yapın." });

    setUploadingImage(true);
    try {
      if (storage) {
        const fileRef = ref(storage, `product_images/${uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(fileRef);
        
        if (bulkIndex !== null) {
          setBulkRows(prev => prev.map((r, i) => i === bulkIndex ? { ...r, imageUrl: downloadUrl } : r));
        } else if (isEdit) {
          setEditing(prev => ({ ...prev, imageUrl: downloadUrl }));
        } else {
          setImageUrl(downloadUrl);
        }
        bildir({ type: "success", title: "Görsel Yüklendi", message: "Ürün fotoğrafı Firebase Storage bulutuna yüklendi." });
      } else {
        throw new Error("Storage yok");
      }
    } catch (err) {
      console.warn("Storage fallback:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result;
        if (base64) {
          if (bulkIndex !== null) {
            setBulkRows(prev => prev.map((r, i) => i === bulkIndex ? { ...r, imageUrl: String(base64) } : r));
          } else if (isEdit) {
            setEditing(prev => ({ ...prev, imageUrl: String(base64) }));
          } else {
            setImageUrl(String(base64));
          }
          bildir({ type: "success", title: "Görsel Hazırlandı", message: "Ürün fotoğrafı eklendi." });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  }

  // TOPLU ÜRÜN CSV / EXCEL DOSYASI OKUYUCU
  function handleCsvUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || "";
      const lines = String(text).split(/\r?\n/);
      const parsed = [];

      lines.forEach((line, index) => {
        if (!line.trim()) return;
        const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (index === 0 && (cols[0].toLowerCase().includes("ürün") || cols[0].toLowerCase().includes("name"))) {
          return;
        }
        if (cols[0]) {
          parsed.push({
            name: cols[0] || "",
            category: cols[1] || "Genel",
            price: cols[2] || "0",
            stock: cols[3] || "0",
            barcode: cols[4] || "",
            imageUrl: cols[5] || ""
          });
        }
      });

      if (parsed.length > 0) {
        setBulkRows(parsed);
        bildir({ type: "success", title: "Dosya Ayrıştırıldı", message: `${parsed.length} adet ürün satırı yüklendi.` });
      } else {
        bildir({ type: "warning", title: "Boş Dosya", message: "Uygun ürün satırı bulunamadı." });
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleBulkRowChange(index, field, value) {
    setBulkRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }

  function addBulkRow() {
    setBulkRows(prev => [...prev, { name: "", category: "Genel", price: "", stock: "", barcode: "", imageUrl: "" }]);
  }

  function removeBulkRow(index) {
    setBulkRows(prev => prev.filter((_, i) => i !== index));
  }

  async function topluUrunKaydet() {
    if (!subActive) return bildir({ type: "error", title: "Kısıtlı Mod", message: "Bu işlemi gerçekleştirmek için lisans anahtarınızı etkinleştirin." });

    const validRows = bulkRows.filter(r => r.name && r.name.trim() !== "");
    if (validRows.length === 0) {
      return bildir({ type: "warning", title: "Ürün Girilmedi", message: "Lütfen en az bir ürün adı yazınız." });
    }

    setBulkSaving(true);
    try {
      const promises = validRows.map(r => 
        addProduct({
          name: r.name.trim(),
          category: (r.category || "Genel").trim(),
          price: parseFloat(r.price) || 0,
          stock: parseInt(r.stock, 10) || 0,
          barcode: r.barcode ? String(r.barcode).trim() : null,
          imageUrl: r.imageUrl ? String(r.imageUrl).trim() : null
        })
      );
      await Promise.all(promises);

      setBulkRows(INITIAL_BULK_ROWS);
      setShowBulkModal(false);
      bildir({ type: "success", title: "Toplu Ekleme Başarılı", message: `Toplam ${validRows.length} ürün envanterinize toplu olarak eklendi.` });
    } catch (err) {
      bildir({ type: "error", title: "Toplu Ekleme Hatası", message: err.message });
    } finally {
      setBulkSaving(false);
    }
  }

  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || "Genel").filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const categoryOptions = useMemo(() => {
    const existing = products.map(p => p.category).filter(c => c && c.trim() !== "");
    const allCats = [...new Set([...DEFAULT_CATEGORIES, ...existing])];
    if (!category) return allCats.sort();
    return allCats.filter(c => c.toLowerCase().includes(category.toLowerCase())).sort();
  }, [products, category]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const t = searchTerm.toLowerCase();
      const matchesSearch = !t || (
        (p.name || "").toLowerCase().includes(t) ||
        (p.barcode || "").toLowerCase().includes(t) ||
        (p.category || "").toLowerCase().includes(t)
      );

      const matchesCategory = !selectedCategory || (p.category || "Genel") === selectedCategory;

      const stk = Number(p.stock || 0);
      let matchesStock = true;
      if (stockFilter === "in_stock") matchesStock = stk > 0;
      else if (stockFilter === "critical") matchesStock = stk > 0 && stk < 10;
      else if (stockFilter === "out_of_stock") matchesStock = stk <= 0;

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === "price_desc") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "price_asc") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "stock_asc") return Number(a.stock || 0) - Number(b.stock || 0);
      return (a.name || "").localeCompare(b.name || "", "tr");
    });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy]);

  async function urunEkle() {
    if (!subActive) return bildir({ type: "error", title: "Kısıtlı Mod", message: "Bu işlemi gerçekleştirmek için lisans anahtarı giriniz." });

    const tName = name.trim();
    if (!tName) return bildir({ type: "error", title: "Zorunlu Alan Eksik", message: "Lütfen ürün adını boş bırakmayınız." });

    const isDuplicate = products.some(p => p.name.toLowerCase() === tName.toLowerCase() || (barcode && p.barcode === barcode));
    if (isDuplicate) return bildir({ type: "warning", title: "Mevcut Kayıt", message: "Bu ürün veya barkod zaten sistemde kayıtlı." });

    const tempId = `prd_${Date.now()}`;
    const pData = {
      id: tempId,
      name: tName,
      barcode: barcode.trim() || null,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      category: category.trim() || "Genel",
      imageUrl: imageUrl.trim() || null,
      createdAt: new Date().toISOString()
    };

    setName(""); setBarcode(""); setPrice(""); setStock(""); setCategory(""); setImageUrl("");
    setShowAddModal(false);

    // 0ms Anında yerel önbellek güncellemesi (Optimistic UI)
    updateMemoryStoreOptimistically(store => {
      store.products.unshift(pData);
      return store;
    });

    bildir({ type: "success", title: "Ürün Eklendi", message: `"${tName}" ürünü eklendi.` });

    addProduct(pData).catch(err => {
      console.error("Arka plan ürün ekleme hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  function duzenlemeAc(p) {
    setEditing({ 
      ...p, 
      price: p.price || 0, 
      stock: p.stock || 0, 
      category: p.category || "",
      imageUrl: p.imageUrl || ""
    });
  }

  async function duzenlemeKaydet() {
    if (!subActive) return;
    const { id, name: n, barcode: b, price: pr, stock: st, category: cat, imageUrl: img } = editing;
    if (!n.trim()) return bildir({ type: "error", title: "Eksik Bilgi", message: "Ürün adı boş olamaz." });

    setEditing(null);

    // 0ms Anında yerel önbellek güncellemesi (Optimistic UI)
    updateMemoryStoreOptimistically(store => {
      const target = store.products.find(p => p.id === id);
      if (target) {
        target.name = n.trim();
        target.barcode = b ? String(b).trim() : null;
        target.price = Number(pr);
        target.stock = Number(st);
        target.category = cat ? String(cat).trim() : null;
        target.imageUrl = img ? String(img).trim() : null;
      }
      return store;
    });

    bildir({ type: "success", title: "Ürün Güncellendi", message: `"${n}" ürün bilgileri güncellendi.` });

    updateProduct(id, {
      name: n.trim(),
      barcode: b ? String(b).trim() : null,
      price: Number(pr),
      stock: Number(st),
      category: cat ? String(cat).trim() : null,
      imageUrl: img ? String(img).trim() : null
    }).catch(err => {
      console.error("Arka plan ürün güncelleme hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  async function silGercek() {
    if (!subActive || !confirmDelete) return;
    const targetId = confirmDelete.id;
    const sName = confirmDelete.label;

    setConfirmDelete(null);

    // 0ms Anında yerel önbellek güncellemesi (Optimistic UI)
    updateMemoryStoreOptimistically(store => {
      store.products = store.products.filter(p => p.id !== targetId);
      return store;
    });

    bildir({ type: "info", title: "Ürün Silindi", message: `"${sName}" kaldırıldı.` });

    deleteProduct(targetId).catch(err => {
      console.error("Arka plan ürün silme hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  // HIZ KONTROLLÜ VE DEBOUNCED STOK GÜNCELLEME (0MS OPTIMISTIC)
  function hizliStok(id, val) {
    if (!subActive) return;
    const newVal = Math.max(0, Number(val || 0));
    
    // 0ms Anında yerel önbellek güncellemesi (Optimistic UI - En az 0 Adet)
    updateMemoryStoreOptimistically(store => {
      const target = store.products.find(p => p.id === id);
      if (target) target.stock = newVal;
      return store;
    });

    if (stockTimerMap.current[id]) {
      clearTimeout(stockTimerMap.current[id]);
    }

    stockTimerMap.current[id] = setTimeout(async () => {
      try {
        await updateProduct(id, { stock: newVal });
        bildir({ 
          type: "success", 
          title: "Stok Güncellendi", 
          message: `Stok adedi ${newVal} Adet olarak kaydedildi.` 
        });
      } catch (err) {
        bildir({ type: "error", title: "Stok Güncellenemedi", message: err.message });
      }
      delete stockTimerMap.current[id];
    }, 450);
  }

  const isFilterActive = searchTerm || selectedCategory || stockFilter !== "all" || sortBy !== "name_asc";

  return (
    <div className="page-container">
      <Toast note={note} onClose={() => setNote(null)} />

      {!subLoading && !subActive && (
        <div className="alert-banner">
          <FiAlertCircle size={20} />
          <span>Hesabınız kısıtlı. Tüm özellikleri açmak için:</span>
          <Link href="/product-key" className="alert-link">Ücretsiz Etkinleştir</Link>
        </div>
      )}

      {/* HIZLI FİLTRELEME VE KATEGORİ ARAMA RIBBON BAR */}
      <div className="prd-card" style={{ marginBottom: '16px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div className="input-icon-wrapper" style={{ flex: '1 1 220px', minWidth: '200px' }}>
            <FiSearch className="input-icon" />
            <input 
              placeholder="Ürün adı veya barkod ile hızlı arama..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input" 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiFilter size={14} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)} 
              className="modern-input"
              style={{ width: '160px', padding: '6px 10px', fontSize: '0.85rem' }}
            >
              <option value="">Tüm Kategoriler ({availableCategories.length})</option>
              {availableCategories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <select 
            value={stockFilter} 
            onChange={e => setStockFilter(e.target.value)} 
            className="modern-input"
            style={{ width: '160px', padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="all">Tüm Stok Durumları</option>
            <option value="in_stock">✅ Stokta Var</option>
            <option value="critical">⚠️ Kritik Stok (&lt;10)</option>
            <option value="out_of_stock">❌ Tükenenler (0)</option>
          </select>

          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)} 
            className="modern-input"
            style={{ width: '140px', padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="name_asc">Sırala: A-Z</option>
            <option value="price_desc">Fiyat: Azalan</option>
            <option value="price_asc">Fiyat: Artan</option>
            <option value="stock_asc">Stok: En Az</option>
          </select>

          {isFilterActive && (
            <button 
              onClick={() => { setSearchTerm(""); setSelectedCategory(""); setStockFilter("all"); setSortBy("name_asc"); }}
              className="modern-btn ghost"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Filtreleri Sıfırla"
            >
              <FiRefreshCw size={12} /> Sıfırla
            </button>
          )}

          {/* SAĞ TARAF: TOPLU EKLENME VE TEKİL EKLENME BUTONLARI */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="modern-btn secondary" onClick={() => setShowBulkModal(true)} disabled={!subActive}>
              <FiLayers size={18} /> Toplu Ürün Ekle
            </button>
            <button className="modern-btn primary" onClick={() => setShowAddModal(true)} disabled={!subActive}>
              <FiPlus size={18} /> Yeni Ürün Ekle
            </button>
          </div>

        </div>
      </div>

      {/* ENVANTER TABLOSU */}
      <div className="prd-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Ürünler yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiSearch size={44} style={{ marginBottom: '10px' }} />
            <p>Seçilen filtrelere uygun ürün bulunamadı.</p>
            {isFilterActive && (
              <button 
                onClick={() => { setSearchTerm(""); setSelectedCategory(""); setStockFilter("all"); setSortBy("name_asc"); }}
                className="modern-btn secondary"
                style={{ marginTop: '12px' }}
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Görsel</th>
                  <th>Ürün Adı</th>
                  <th>Kategori</th>
                  <th>Barkod</th>
                  <th style={{ textAlign: 'right' }}>Birim Fiyat</th>
                  <th style={{ textAlign: 'center', width: '230px' }}>Stok Adedi</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isTarget = highlightedId === p.id;

                  return (
                    <tr 
                      key={p.id} 
                      id={`prod-row-${p.id}`}
                      className={isTarget ? "row-highlight-pulse" : ""}
                    >
                      <td>
                        {p.imageUrl ? (
                          <img 
                            src={p.imageUrl} 
                            alt={p.name} 
                            className="tbl-img"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="tbl-avatar" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                            <FiPackage />
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                        {isTarget && (
                          <span className="table-badge purple" style={{ marginLeft: '8px' }}>AI ÖNERİSİ HEDEFİ</span>
                        )}
                      </td>
                      <td>
                        <span className="table-badge gray">{p.category || "Genel"}</span>
                      </td>
                      <td>
                        {p.barcode ? <code>{p.barcode}</code> : <span style={{ color: 'var(--text-light)' }}>-</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                        {Number(p.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <QtyStepper 
                            value={p.stock}
                            onChange={(val) => hizliStok(p.id, val)}
                            disabled={!subActive}
                          />
                          <span className={`table-badge ${Number(p.stock) <= 0 ? 'red' : Number(p.stock) < 10 ? 'orange' : 'green'}`}>
                            {Number(p.stock) <= 0 ? 'Tükendi' : Number(p.stock) < 10 ? 'Kritik' : 'Stokta'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button onClick={() => duzenlemeAc(p)} className="tbl-btn secondary icon-only" title="Düzenle">
                            <FiEdit2 />
                          </button>
                          <button onClick={() => setConfirmDelete({id: p.id, label: p.name})} className="tbl-btn danger icon-only" title="Sil">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOPLU ÜRÜN EKLENMESİ VE EXCEL/CSV IMPORT POPUP MODALI */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '900px', width: '95vw' }}>
            <div className="modal-header">
              <h4><FiLayers style={{ color: 'var(--primary)' }} /> Toplu Ürün Ekleme & Excel/CSV İçe Aktarma</h4>
              <button onClick={() => setShowBulkModal(false)} className="close-btn"><FiX /></button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Excel / CSV Dosyasından Aktar</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sütunlar: ÜrünAdı, Kategori, Fiyat, Stok, Barkod, GörselURL</span>
                </div>

                <label className="modern-btn secondary" style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem' }}>
                  <FiFileText size={16} /> Excel / CSV Dosyası Yükle
                  <input type="file" accept=".csv,.txt,.xlsx" onChange={handleCsvUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* DİNAMİK TOPLU ÜRÜN EDİTÖR TABLOSU */}
              <div className="table-responsive-wrapper" style={{ maxHeight: '320px', overflowY: 'auto', marginTop: '12px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Ürün Adı *</th>
                      <th style={{ width: '130px' }}>Kategori</th>
                      <th style={{ width: '110px' }}>Fiyat (₺)</th>
                      <th style={{ width: '90px' }}>Stok</th>
                      <th style={{ width: '130px' }}>Barkod</th>
                      <th style={{ width: '140px' }}>Görsel</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <input 
                            placeholder="Ürün Adı" 
                            value={row.name} 
                            onChange={e => handleBulkRowChange(idx, "name", e.target.value)} 
                            className="modern-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            placeholder="Genel" 
                            value={row.category} 
                            onChange={e => handleBulkRowChange(idx, "category", e.target.value)} 
                            className="modern-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            value={row.price} 
                            onChange={e => handleBulkRowChange(idx, "price", e.target.value)} 
                            className="modern-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={row.stock} 
                            onChange={e => handleBulkRowChange(idx, "stock", e.target.value)} 
                            className="modern-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td>
                          <input 
                            placeholder="Barkod" 
                            value={row.barcode} 
                            onChange={e => handleBulkRowChange(idx, "barcode", e.target.value)} 
                            className="modern-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                              placeholder="URL veya seçin" 
                              value={row.imageUrl} 
                              onChange={e => handleBulkRowChange(idx, "imageUrl", e.target.value)} 
                              className="modern-input"
                              style={{ padding: '4px 6px', fontSize: '0.8rem', flex: 1 }}
                            />
                            <label className="tbl-btn secondary icon-only" style={{ width: '28px', height: '28px', cursor: 'pointer' }} title="Fotoğraf Yükle">
                              <FiUploadCloud size={14} />
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => handleProductImageUpload(e.target.files?.[0], false, idx)} 
                                style={{ display: 'none' }} 
                              />
                            </label>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => removeBulkRow(idx)} className="tbl-btn danger icon-only" style={{ width: '24px', height: '24px' }}>
                            <FiTrash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={addBulkRow} className="modern-btn secondary" style={{ marginTop: '10px', fontSize: '0.8rem', padding: '6px 12px' }}>
                <FiPlus size={14} /> + Satır Ekle
              </button>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowBulkModal(false)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={topluUrunKaydet} className="modern-btn primary" disabled={!subActive || bulkSaving}>
                {bulkSaving ? "Kaydediliyor..." : `Tüm Ürünleri Toplu Kaydet (${bulkRows.filter(r => r.name.trim()).length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ ÜRÜN EKLENMESİ POPUP MODALI */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h4><FiPlus style={{ color: 'var(--primary)' }} /> Yeni Ürün Ekle</h4>
              <button onClick={() => setShowAddModal(false)} className="close-btn"><FiX /></button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Ürün Adı *</label>
                <input 
                  placeholder="Örn: Matkap Ucu 10mm" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="modern-input"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Ürün Görseli (Fotoğraf Yükleyin veya Bağlantı Girin)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="input-icon-wrapper" style={{ flex: 1 }}>
                    <FiImage className="input-icon" />
                    <input 
                      placeholder="https://ornek.com/resim.jpg veya dosya yükleyin" 
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)} 
                      className="modern-input with-icon" 
                    />
                  </div>

                  <label className="modern-btn secondary" style={{ cursor: 'pointer', shrink: 0, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800 }}>
                    <FiUploadCloud size={16} /> {uploadingImage ? "Yükleniyor..." : "Fotoğraf Seç"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleProductImageUpload(e.target.files?.[0], false)} 
                      disabled={uploadingImage} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                {imageUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <img src={imageUrl} alt="Önizleme" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-main)' }} />
                    <button onClick={() => setImageUrl("")} className="tbl-btn danger icon-only" style={{ width: '24px', height: '24px' }} title="Görseli Kaldır">
                      <FiX size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Birim Satış Fiyatı (₺)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    className="modern-input" 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Başlangıç Stok Adedi</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={stock} 
                    onChange={e => setStock(e.target.value)} 
                    className="modern-input" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label>Barkod Numarası</label>
                <input 
                  placeholder="Barkod okutun veya yazın..." 
                  value={barcode} 
                  onChange={e => setBarcode(e.target.value)} 
                  className="modern-input" 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} ref={catWrapperRef}>
                <label>Kategori</label>
                <div className="input-icon-wrapper">
                  <FiFilter className="input-icon" />
                  <input 
                    placeholder="Kategori yazın veya seçin..." 
                    value={category}
                    onChange={e => { setCategory(e.target.value); setShowCatSuggestions(true); }}
                    onFocus={() => setShowCatSuggestions(true)}
                    className="modern-input with-icon"
                  />
                </div>
                {showCatSuggestions && (
                  <ul style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-main)', 
                    listStyle: 'none', 
                    maxHeight: '120px', 
                    overflowY: 'auto',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {categoryOptions.map((c, i) => (
                      <li 
                        key={i} 
                        style={{ padding: '6px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                        onClick={() => { setCategory(c); setShowCatSuggestions(false); }}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={urunEkle} className="modern-btn primary" disabled={!subActive || uploadingImage}>
                Kaydet ve Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÜRÜN DÜZENLEME POPUP MODALI */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h4>Ürün Düzenle</h4>
              <button onClick={() => setEditing(null)} className="close-btn"><FiX /></button>
            </div>
            <div className="modal-body">
              <label>Ürün Adı</label>
              <input value={editing.name ?? ""} onChange={e => setEditing(s => ({...s, name: e.target.value}))} className="modern-input" />

              <label style={{ marginTop: '8px' }}>Ürün Görseli (Fotoğraf Yükleyin veya Bağlantı Girin)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  value={editing.imageUrl ?? ""} 
                  onChange={e => setEditing(s => ({...s, imageUrl: e.target.value}))} 
                  className="modern-input" 
                  placeholder="https://ornek.com/resim.jpg"
                  style={{ flex: 1 }}
                />
                <label className="modern-btn secondary" style={{ cursor: 'pointer', shrink: 0, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800 }}>
                  <FiUploadCloud size={16} /> {uploadingImage ? "Yükleniyor..." : "Fotoğraf Seç"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleProductImageUpload(e.target.files?.[0], true)} 
                    disabled={uploadingImage} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>

              {editing.imageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <img src={editing.imageUrl} alt="Önizleme" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-main)' }} />
                  <button onClick={() => setEditing(s => ({...s, imageUrl: ""}))} className="tbl-btn danger icon-only" style={{ width: '24px', height: '24px' }} title="Görseli Kaldır">
                    <FiX size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div>
                  <label>Fiyat (₺)</label>
                  <input type="number" value={editing.price ?? ""} onChange={e => setEditing(s => ({...s, price: e.target.value}))} className="modern-input" />
                </div>
                <div>
                  <label>Stok</label>
                  <input type="number" value={editing.stock ?? ""} onChange={e => setEditing(s => ({...s, stock: e.target.value}))} className="modern-input" />
                </div>
              </div>

              <label style={{ marginTop: '8px' }}>Kategori</label>
              <input value={editing.category ?? ""} onChange={e => setEditing(s => ({...s, category: e.target.value}))} className="modern-input" />

              <label style={{ marginTop: '8px' }}>Barkod</label>
              <input value={editing.barcode ?? ""} onChange={e => setEditing(s => ({...s, barcode: e.target.value}))} className="modern-input" />
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditing(null)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={duzenlemeKaydet} className="modern-btn primary" disabled={uploadingImage}>
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SİLME ONAYI POPUP */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h4>Ürün Silinsin mi?</h4>
              <button onClick={() => setConfirmDelete(null)} className="close-btn"><FiX /></button>
            </div>
            <div className="modal-body">
              <p><b>{confirmDelete.label}</b> isimli ürün kalıcı olarak silinecektir.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={silGercek} className="modern-btn danger">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
