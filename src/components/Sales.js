"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  FiShoppingCart, FiSearch, FiPlus, FiMinus, FiTrash2, 
  FiCreditCard, FiDollarSign, FiUser, FiCheckCircle, FiX, 
  FiTrendingUp, FiTrendingDown, FiArchive, FiTag, FiPrinter, FiFileText, FiZap, FiPackage
} from "react-icons/fi";
import { 
  finalizeSaleTransaction, 
  addLegacyIncome, 
  addLegacyExpense 
} from "../utils/firebaseHelpers";
import { updateProduct } from "../utils/artifactUserProducts";
import { 
  syncFullMasterStore, 
  getMasterStoreSnapshot, 
  subscribeToMasterStore,
  updateMemoryStoreOptimistically,
  invalidateAndRefreshMasterCache
} from "../utils/masterDataCache";
import useSubscription from "../hooks/useSubscription";
import Toast from "./Toast";
import InvoiceModal from "./InvoiceModal";
import { formatPhone } from "./Customers";

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

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Arama & Filtre State
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [custSearchTerm, setCustSearchTerm] = useState("");

  // Sepet State
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [mobileTab, setMobileTab] = useState("catalog"); // "catalog" | "cart"

  // Modallar State
  const [showGelirModal, setShowGelirModal] = useState(false);
  const [showGiderModal, setShowGiderModal] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDesc, setIncomeDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");

  // Fatura Modal State
  const [activeInvoice, setActiveInvoice] = useState(null);

  const [note, setNote] = useState(null);
  const barcodeInputRef = useRef(null);

  const { loading: subLoading, active: subActive } = useSubscription();

  function bildir(n) {
    setNote(n);
    const dur = n?.duration || (n?.actionText ? 8000 : 4000);
    setTimeout(() => setNote(null), dur);
  }

  useEffect(() => {
    const initialSnap = getMasterStoreSnapshot();
    if (initialSnap.products && initialSnap.products.length > 0) {
      setProducts(initialSnap.products);
      setCustomers(initialSnap.customers || []);
      setSalesHistory(initialSnap.sales || []);
      setLoading(false);
    }

    const unsubscribe = subscribeToMasterStore((store) => {
      if (store) {
        setProducts(store.products || []);
        setCustomers(store.customers || []);
        setSalesHistory(store.sales || []);
        setLoading(false);
      }
    });

    syncFullMasterStore(false).then((store) => {
      if (store) {
        setProducts(store.products || []);
        setCustomers(store.customers || []);
        setSalesHistory(store.sales || []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => unsubscribe();
  }, []);

  function moneyFormat(val) {
    return Number(val || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
  }

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!custSearchTerm) return customers;
    const t = custSearchTerm.toLowerCase();
    return customers.filter(c => (c.name || "").toLowerCase().includes(t) || (c.phone || "").includes(t));
  }, [customers, custSearchTerm]);

  function sepeteEkle(product) {
    if (!subActive) return bildir({ type: "error", title: "Kısıtlı Mod", message: "Satış yapmak için lisans anahtarınızı etkinleştirin." });
    if ((product.stock || 0) <= 0) {
      return bildir({ type: "warning", title: "Stok Yetersiz", message: `"${product.name}" ürünü stokta tükenmiştir.` });
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          bildir({ type: "warning", title: "Stok Limiti", message: `En fazla ${product.stock} adet eklenebilir.` });
          return prevCart;
        }
        return prevCart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  }

  function sepetMiktarDegistir(id, delta) {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            bildir({ type: "warning", title: "Stok Yetersiz", message: `Maksimum stok ${item.stock} adettir.` });
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  }

  function sepettenCikar(id) {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }

  function handleBarcodeSubmit(e) {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const found = products.find(p => p.barcode === code);
    if (found) {
      sepeteEkle(found);
      setBarcodeInput("");
      bildir({ type: "success", title: "Barkod Okutuldu", message: `"${found.name}" sepete eklendi.` });
    } else {
      bildir({ type: "error", title: "Barkod Bulunamadı", message: `"${code}" barkodlu ürün sistemde kayıtlı değil.` });
    }
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
  }, [cart]);

  async function satisiTamamla() {
    if (!subActive) return;
    if (cart.length === 0) return bildir({ type: "warning", title: "Sepet Boş", message: "Lütfen önce sepete ürün ekleyiniz." });
    if (saleType === "credit" && !selectedCustomerId) {
      return bildir({ type: "error", title: "Müşteri Seçilmedi", message: "Lütfen veresiye satış için bir müşteri seçiniz." });
    }

    const currentCart = [...cart];
    const currentTotal = cartTotal;
    const currentSaleType = saleType;
    const currentCustId = selectedCustomerId;
    const currentCustName = selectedCustomer?.name;
    const currentCustPhone = selectedCustomer?.phone;

    const saleItems = currentCart.map(item => ({
      id: item.id,
      productId: item.id,
      name: item.name || "Ürün",
      qty: Number(item.qty || 1),
      price: Number(item.price || 0)
    }));

    // 1. ANINDA 0MS EKRAN VE YEREL CACHE GÜNCELLEMESİ (OPTIMISTIC UI)
    setCart([]);
    setSelectedCustomerId("");
    setCustSearchTerm("");

    const isVeresiye = currentSaleType === "credit";
    const tempSaleId = `sale_${Date.now()}`;
    const invoiceData = {
      saleId: tempSaleId,
      items: saleItems,
      total: currentTotal,
      saleType: currentSaleType,
      customerName: isVeresiye ? currentCustName : "Perakende Müşteri",
      customerPhone: isVeresiye ? formatPhone(currentCustPhone) : "",
      createdAt: new Date().toISOString()
    };

    updateMemoryStoreOptimistically(store => {
      // Ürün stoklarını anında yerel düş
      saleItems.forEach(sItem => {
        const targetPrd = store.products.find(p => p.id === sItem.productId);
        if (targetPrd) {
          targetPrd.stock = Math.max(0, Number(targetPrd.stock || 0) - sItem.qty);
        }
      });

      // Müşteri veresiye bakiyesini anında artır
      if (isVeresiye && currentCustId) {
        const targetCust = store.customers.find(c => c.id === currentCustId);
        if (targetCust) {
          targetCust.balance = Number(targetCust.balance || 0) + currentTotal;
        }
      }

      // Satış kaydını önbelleğe ekle
      store.sales.unshift({
        id: tempSaleId,
        items: saleItems,
        total: currentTotal,
        saleType: currentSaleType,
        customerId: currentCustId || null,
        customerName: isVeresiye ? currentCustName : null,
        createdAt: new Date().toISOString()
      });

      return store;
    });

    bildir({
      type: "success",
      title: "Satış Tamamlandı",
      message: `${moneyFormat(currentTotal)} tutarındaki satış başarıyla işlendi.`,
      actionText: "Faturayı Görüntüle",
      onAction: () => setActiveInvoice(invoiceData)
    });

    // 2. ARKA PLANDA FIREBASE YAZMA İŞLEMİ (KULLANICI HİÇ BEKLEMEZ)
    finalizeSaleTransaction({
      items: saleItems,
      total: currentTotal,
      totals: { total: currentTotal },
      saleType: currentSaleType,
      paymentType: currentSaleType,
      customerId: isVeresiye ? currentCustId : null,
      customerName: isVeresiye ? currentCustName : null
    }).catch(err => {
      console.error("Arka plan satış yazma hatası:", err);
      invalidateAndRefreshMasterCache().catch(() => {});
    });
  }

  async function gelirEkle() {
    if (!subActive) return;
    const amount = parseFloat(incomeAmount);
    if (!amount || amount <= 0) return bildir({ type: "warning", title: "Geçersiz Tutar", message: "Lütfen 0'dan büyük tutar giriniz." });

    const desc = incomeDesc.trim() || "Kasa Ek Gelir Girişi";
    setIncomeAmount(""); setIncomeDesc(""); setShowGelirModal(false);

    // 0ms Anında yerel güncelleme
    updateMemoryStoreOptimistically(store => {
      store.incomes.unshift({ id: `inc_${Date.now()}`, amount, description: desc, createdAt: new Date().toISOString() });
      return store;
    });

    bildir({ type: "success", title: "Gelir Kaydedildi", message: `${moneyFormat(amount)} kasaya ek gelir olarak işlendi.` });

    addLegacyIncome({ amount, description: desc }).catch(err => console.error("Arka plan gelir hatası:", err));
  }

  async function giderEkle() {
    if (!subActive) return;
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) return bildir({ type: "warning", title: "Geçersiz Tutar", message: "Lütfen 0'dan büyük tutar giriniz." });

    const desc = expenseDesc.trim() || "Kasa Gider Çıktısı";
    setExpenseAmount(""); setExpenseDesc(""); setShowGiderModal(false);

    // 0ms Anında yerel güncelleme
    updateMemoryStoreOptimistically(store => {
      store.expenses.unshift({ id: `exp_${Date.now()}`, amount, description: desc, createdAt: new Date().toISOString() });
      return store;
    });

    bildir({ type: "info", title: "Gider Kaydedildi", message: `${moneyFormat(amount)} kasadan gider olarak düşüldü.` });

    addLegacyExpense({ amount, description: desc }).catch(err => console.error("Arka plan gider hatası:", err));
  }

  const filteredProducts = products.filter(p => {
    const t = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(t) ||
      (p.barcode || "").toLowerCase().includes(t) ||
      (p.category || "").toLowerCase().includes(t)
    );
  });

  return (
    <div className="page-container">
      <Toast note={note} onClose={() => setNote(null)} />

      {/* ÜST BİLGİ VE HIZLI KASA İŞLEM BUTONLARI */}
      <div className="prd-card pos-header-card" style={{ marginBottom: '12px', padding: '10px 14px' }}>
        <div className="pos-header-row">
          <form onSubmit={handleBarcodeSubmit} className="pos-barcode-form">
            <div className="input-icon-wrapper" style={{ width: '100%' }}>
              <FiZap className="input-icon" style={{ color: 'var(--warning)' }} />
              <input 
                ref={barcodeInputRef}
                placeholder="Barkod okutun veya yazın (Enter)..." 
                value={barcodeInput} 
                onChange={e => setBarcodeInput(e.target.value)} 
                className="search-input"
                style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
                autoFocus 
              />
            </div>
          </form>

          <div className="pos-action-btns">
            <button className="modern-btn success" onClick={() => setShowGelirModal(true)} disabled={!subActive} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <FiTrendingUp size={15} /> + Ek Gelir
            </button>
            <button className="modern-btn danger" onClick={() => setShowGiderModal(true)} disabled={!subActive} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <FiTrendingDown size={15} /> - Gider Çıkışı
            </button>
          </div>
        </div>
      </div>

      {/* MOBİL SEKME GEÇİŞİ (SADECE MOBİL EKRANDA GÖRÜNÜR) */}
      <div className="pos-mobil-tabs">
        <button 
          type="button" 
          className={`pos-tab-btn ${mobileTab === "catalog" ? "active" : ""}`}
          onClick={() => setMobileTab("catalog")}
        >
          <FiPackage size={16} /> Ürün Kataloğu
        </button>
        <button 
          type="button" 
          className={`pos-tab-btn ${mobileTab === "cart" ? "active" : ""}`}
          onClick={() => setMobileTab("cart")}
        >
          <FiShoppingCart size={16} /> Sepet
          {cart.length > 0 && <span className="pos-cart-badge">{cart.length}</span>}
        </button>
      </div>

      {/* ANA POS İKİ KOLONLU DÜZEN */}
      <div className="pos-grid-container">
        
        {/* SOL KOLON: ÜRÜN KATALOĞU VE HIZLI ARAMA */}
        <div className={`prd-card pos-column ${mobileTab === "catalog" ? "pos-mobile-show" : "pos-mobile-hide"}`}>
          <div className="input-icon-wrapper" style={{ marginBottom: '12px' }}>
            <FiSearch className="input-icon" />
            <input 
              placeholder="Ürün adı, barkod veya kategori arayın..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input" 
            />
          </div>

          {/* MASAÜSTÜ TABLO GÖRÜNÜMÜ */}
          <div className="pos-desktop-table table-responsive-wrapper" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ürün Adı</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: 'right' }}>Fiyat</th>
                  <th style={{ textAlign: 'center' }}>Stok</th>
                  <th style={{ textAlign: 'center', width: '70px' }}>Ekle</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ fontSize: '0.88rem' }}>{p.name}</strong>
                    </td>
                    <td>
                      <span className="table-badge gray">{p.category || "Genel"}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {moneyFormat(p.price)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`table-badge ${Number(p.stock) <= 0 ? 'red' : Number(p.stock) < 10 ? 'orange' : 'green'}`}>
                        {p.stock} Adet
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => sepeteEkle(p)} 
                        className="tbl-btn primary icon-only" 
                        disabled={(p.stock || 0) <= 0 || !subActive}
                        title="Sepete Ekle"
                      >
                        <FiPlus />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBİL DOKUNMATİK FERAH ÜRÜN KART LİSTESİ */}
          <div className="pos-mobile-product-list">
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FiSearch size={32} style={{ marginBottom: '8px' }} />
                <p>Aranan kriterlere uygun ürün bulunamadı.</p>
              </div>
            ) : (
              filteredProducts.map(p => (
                <div key={p.id} className="pos-mobile-card">
                  <div className="pos-mobile-card-main">
                    <strong className="pos-mobile-card-title">{p.name}</strong>
                    <div className="pos-mobile-card-sub">
                      <span className="pos-mobile-card-price">{moneyFormat(p.price)}</span>
                      <span className="pos-mobile-card-category">{p.category || "Genel"}</span>
                      <span className={`table-badge ${Number(p.stock) <= 0 ? 'red' : Number(p.stock) < 10 ? 'orange' : 'green'}`}>
                        {p.stock} Adet
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => sepeteEkle(p)} 
                    className="modern-btn primary pos-mobile-add-btn" 
                    disabled={(p.stock || 0) <= 0 || !subActive}
                  >
                    <FiPlus size={16} /> Ekle
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SAĞ KOLON: SEPET VE ÖDEME SEÇENEKLERİ */}
        <div className={`prd-card pos-column ${mobileTab === "cart" ? "pos-mobile-show" : "pos-mobile-hide"}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px', marginBottom: '12px' }}>
              <FiShoppingCart style={{ color: 'var(--primary)' }} /> Satış Sepeti ({cart.length})
            </h4>

            {cart.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FiShoppingCart size={40} style={{ marginBottom: '8px' }} />
                <p>Sepetiniz boş. Ürün eklemek için listeden ürün seçiniz.</p>
              </div>
            ) : (
              <div className="table-responsive-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th style={{ textAlign: 'center' }}>Adet</th>
                      <th style={{ textAlign: 'right' }}>Toplam</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.name}</strong></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => sepetMiktarDegistir(item.id, -1)} className="qty-stepper-btn">-</button>
                            <span style={{ fontWeight: 800 }}>{item.qty}</span>
                            <button onClick={() => sepetMiktarDegistir(item.id, 1)} className="qty-stepper-btn">+</button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {moneyFormat(item.price * item.qty)}
                        </td>
                        <td>
                          <button onClick={() => sepettenCikar(item.id)} className="tbl-btn danger icon-only" style={{ width: '24px', height: '24px' }}>
                            <FiTrash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px', borderTop: '1px solid var(--border-main)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Genel Toplam:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                {moneyFormat(cartTotal)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button 
                className={`modern-btn ${saleType === "cash" ? "primary" : "secondary"}`}
                onClick={() => setSaleType("cash")}
              >
                <FiDollarSign /> Peşin / Nakit
              </button>
              <button 
                className={`modern-btn ${saleType === "credit" ? "primary" : "secondary"}`}
                onClick={() => setSaleType("credit")}
              >
                <FiUser /> Veresiye Satış
              </button>
            </div>

            {/* VERESİYE SATIŞ İÇİN ARANABİLİR VE OKUNAKLI MÜŞTERİ SEÇİCİ */}
            {saleType === "credit" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiUser size={16} /> Veresiye Hesabına İşlenecek Müşteri *
                </label>

                {selectedCustomer ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '6px', border: '1.5px solid var(--primary)' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', display: 'block' }}>{selectedCustomer.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatPhone(selectedCustomer.phone) || "Telefon Belirtilmedi"} • Bakiye: 
                        <b style={{ marginLeft: '4px', color: (selectedCustomer.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {moneyFormat(selectedCustomer.balance)}
                        </b>
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedCustomerId("")}
                      className="modern-btn secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="input-icon-wrapper">
                      <FiSearch className="input-icon" />
                      <input 
                        placeholder="Müşteri adı veya telefon ile hızlı ara..." 
                        value={custSearchTerm} 
                        onChange={e => setCustSearchTerm(e.target.value)} 
                        className="search-input" 
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-main)', borderRadius: '6px', background: 'var(--bg-card)' }}>
                      {filteredCustomers.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Eşleşen müşteri bulunamadı.
                        </div>
                      ) : (
                        filteredCustomers.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => setSelectedCustomerId(c.id)}
                            style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div>
                              <strong style={{ fontSize: '0.85rem', display: 'block' }}>{c.name}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatPhone(c.phone) || "Telefon Yok"}</span>
                            </div>
                            <span className={`table-badge ${(c.balance || 0) > 0 ? 'red' : (c.balance || 0) < 0 ? 'green' : 'gray'}`} style={{ fontSize: '0.75rem' }}>
                              {moneyFormat(c.balance)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={satisiTamamla} 
              className="modern-btn success" 
              style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 900 }}
              disabled={cart.length === 0 || !subActive}
            >
              <FiCheckCircle size={20} /> Satışı Tamamla
            </button>
          </div>
        </div>

      </div>

      {/* MOBİL YAPISI İÇİN STICKY SEPET ALT BARI */}
      {cart.length > 0 && mobileTab === "catalog" && (
        <div className="pos-sticky-cart-bar">
          <div>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>Sepet ({cart.length} Ürün):</span>
            <strong style={{ fontSize: '1.15rem', display: 'block', color: '#ffffff' }}>{moneyFormat(cartTotal)}</strong>
          </div>
          <button 
            type="button" 
            onClick={() => setMobileTab("cart")} 
            className="modern-btn success" 
            style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Sepete Git & Öde <FiShoppingCart size={16} />
          </button>
        </div>
      )}

      {/* EK GELİR POPUP MODALI */}
      {showGelirModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h4><FiTrendingUp style={{ color: 'var(--success)' }} /> Kasa Ek Gelir Girişi</h4>
              <button onClick={() => setShowGelirModal(false)} className="close-btn"><FiX /></button>
            </div>
            <div className="modal-body">
              <label>Gelir Tutarı (₺) *</label>
              <input type="number" placeholder="0.00" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} className="modern-input" autoFocus />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Hızlı Açıklama Seçenekleri:</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {["Kasa Devir", "Sermaye İlavesi", "Eski Alacak Tahsilatı", "Hurda / Atık Satışı", "Ortak Katkısı"].map((chip, idx) => (
                    <button 
                      key={idx}
                      type="button" 
                      onClick={() => setIncomeDesc(chip)} 
                      className="tbl-btn secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '16px' }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ marginTop: '10px' }}>Açıklama / Not</label>
              <textarea placeholder="Gelir detayını yazabilir veya yukarıdaki seçeneklerden tıklayabilirsiniz..." value={incomeDesc} onChange={e => setIncomeDesc(e.target.value)} className="modern-textarea" />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowGelirModal(false)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={gelirEkle} className="modern-btn success">Gelir Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* GİDER POPUP MODALI */}
      {showGiderModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h4><FiTrendingDown style={{ color: 'var(--danger)' }} /> Kasa Gider Çıkışı</h4>
              <button onClick={() => setShowGiderModal(false)} className="close-btn"><FiX /></button>
            </div>
            <div className="modal-body">
              <label>Gider Tutarı (₺) *</label>
              <input type="number" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="modern-input" autoFocus />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Hızlı Açıklama Seçenekleri:</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {["Dükkan Kirası", "Elektrik / Su / İnternet", "Personel / Yemek", "Mal Alım Ödemesi", "Kargo / Nakliye", "Tedarikçi Ödemesi"].map((chip, idx) => (
                    <button 
                      key={idx}
                      type="button" 
                      onClick={() => setExpenseDesc(chip)} 
                      className="tbl-btn secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '16px' }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ marginTop: '10px' }}>Açıklama / Not</label>
              <textarea placeholder="Gider detayını yazabilir veya yukarıdaki seçeneklerden tıklayabilirsiniz..." value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="modern-textarea" />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowGiderModal(false)} className="modern-btn ghost">Vazgeç</button>
              <button onClick={giderEkle} className="modern-btn danger">Gider Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* FATURA VE FİŞ MODALI */}
      {activeInvoice && (
        <InvoiceModal 
          invoiceData={activeInvoice} 
          onClose={() => setActiveInvoice(null)} 
        />
      )}

    </div>
  );
}
