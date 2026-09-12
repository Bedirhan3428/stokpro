"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FiLayers, FiShoppingBag, FiTruck, FiPercent, 
  FiPrinter, FiCheck, FiSend, FiPlus, 
  FiTrash2, FiClock, FiDollarSign, FiBox, FiTag, 
  FiRefreshCw, FiExternalLink, FiChevronRight, FiSliders,
  FiGrid, FiArchive, FiCheckCircle, FiAlertCircle,
  FiChevronDown, FiChevronUp
} from "react-icons/fi";
import { logUserActivity } from "../utils/telemetryLogger";

export default function SectorSpecializedTools({ 
  currentSector = "perakende", 
  products = [], 
  customers = [], 
  currencySymbol = "₺",
  onNavigate 
}) {
  const [activeSector, setActiveSector] = useState(currentSector || "perakende");

  useEffect(() => {
    if (currentSector) setActiveSector(currentSector);
  }, [currentSector]);

  // =============================================================
  // 1. TEKSTİL / İMALAT MODÜLLERİ
  // =============================================================
  
  // A: Kumaş & Metraj Hesaplayıcı
  const [rollsCount, setRollsCount] = useState(3);
  const [metersPerRoll, setMetersPerRoll] = useState(50);
  const [metersPerPiece, setMetersPerPiece] = useState(1.4);
  const [wastePercentage, setWastePercentage] = useState(5);

  const fabricCalc = useMemo(() => {
    const totalMeters = (Number(rollsCount) || 0) * (Number(metersPerRoll) || 0);
    const usableMeters = totalMeters * (1 - (Number(wastePercentage) || 0) / 100);
    const pieceReq = Number(metersPerPiece) || 1;
    const maxPieces = pieceReq > 0 ? Math.floor(usableMeters / pieceReq) : 0;
    const wasteMeters = (totalMeters * (Number(wastePercentage) || 0)) / 100;
    return { totalMeters, usableMeters, maxPieces, wasteMeters };
  }, [rollsCount, metersPerRoll, metersPerPiece, wastePercentage]);

  // B: Beden & Varyant Serileme Matrisi Dağıtıcı (Textile Ratio Distributor)
  const [totalOrderQty, setTotalOrderQty] = useState(300);
  const [ratioS, setRatioS] = useState(1);
  const [ratioM, setRatioM] = useState(2);
  const [ratioL, setRatioL] = useState(2);
  const [ratioXL, setRatioXL] = useState(1);

  const sizeBreakdown = useMemo(() => {
    const totalRatio = (Number(ratioS) || 0) + (Number(ratioM) || 0) + (Number(ratioL) || 0) + (Number(ratioXL) || 0);
    const ord = Number(totalOrderQty) || 0;
    if (totalRatio <= 0 || ord <= 0) {
      return { s: 0, m: 0, l: 0, xl: 0, totalRatio: 0, allocated: 0 };
    }
    const unitPerRatio = ord / totalRatio;
    const s = Math.round(unitPerRatio * (Number(ratioS) || 0));
    const m = Math.round(unitPerRatio * (Number(ratioM) || 0));
    const l = Math.round(unitPerRatio * (Number(ratioL) || 0));
    const xl = Math.max(0, ord - (s + m + l));
    return { s, m, l, xl, totalRatio, allocated: s + m + l + xl };
  }, [totalOrderQty, ratioS, ratioM, ratioL, ratioXL]);

  // C: İmalat Partileri & Atölye Takip (Kanban)
  const [batches, setBatches] = useState([]);
  const [newBatchModel, setNewBatchModel] = useState("");
  const [newBatchQty, setNewBatchQty] = useState(100);
  const [newBatchWorkshop, setNewBatchWorkshop] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stokpro_textile_batches");
      if (saved) {
        setBatches(JSON.parse(saved));
      } else {
        setBatches([
          { id: "B1", model: "Oversize T-Shirt (S-XL)", qty: 250, workshop: "Ana Atölye", stage: "dikim", createdAt: "Bugün" },
          { id: "B2", model: "Slim Fit Jean Pantolon", qty: 120, workshop: "Fason Yıkama", stage: "kesim", createdAt: "Dün" }
        ]);
      }
    } catch {}
  }, []);

  const saveBatches = (list) => {
    setBatches(list);
    try {
      localStorage.setItem("stokpro_textile_batches", JSON.stringify(list));
    } catch {}
  };

  const handleAddBatch = (e) => {
    e.preventDefault();
    if (!newBatchModel.trim()) return;
    const newB = {
      id: "B" + Date.now().toString().slice(-4),
      model: newBatchModel.trim(),
      qty: Number(newBatchQty) || 50,
      workshop: newBatchWorkshop.trim() || "Merkez Kesimhane",
      stage: "kesim",
      createdAt: new Date().toLocaleDateString("tr-TR")
    };
    const updated = [newB, ...batches];
    saveBatches(updated);
    setNewBatchModel("");
    setNewBatchWorkshop("");
    logUserActivity("PRODUCTION_BATCH_CREATE", `Yeni İmalat Partisi: ${newB.model} (${newB.qty} adet)`, newB);
  };

  const handleAdvanceBatch = (id) => {
    const STAGES = ["kesim", "dikim", "utu_paket", "tamamlandi"];
    const updated = batches.map((b) => {
      if (b.id === id) {
        const curIdx = STAGES.indexOf(b.stage);
        const nextStage = curIdx < STAGES.length - 1 ? STAGES[curIdx + 1] : b.stage;
        return { ...b, stage: nextStage };
      }
      return b;
    });
    saveBatches(updated);
  };

  const handleDeleteBatch = (id) => {
    const updated = batches.filter((b) => b.id !== id);
    saveBatches(updated);
  };

  // =============================================================
  // 2. PERAKENDE / MAĞAZA MODÜLLERİ
  // =============================================================

  // A: Akıllı Kasa & Para Üstü Asistanı
  const [saleTotalInput, setSaleTotalInput] = useState(85);
  const [tenderInput, setTenderInput] = useState(100);

  const changeDue = useMemo(() => {
    const tot = Number(saleTotalInput) || 0;
    const tnd = Number(tenderInput) || 0;
    return Math.max(0, tnd - tot);
  }, [saleTotalInput, tenderInput]);

  // B: Gün Sonu Kasa Sayım & Z-Raporu Karşılaştırıcı (Cash Drawer Reconciliation)
  const [count200, setCount200] = useState(0);
  const [count100, setCount100] = useState(0);
  const [count50, setCount50] = useState(0);
  const [count20, setCount20] = useState(0);
  const [count10, setCount10] = useState(0);
  const [count5, setCount5] = useState(0);
  const [countCoins, setCountCoins] = useState(0);
  const [systemDrawerTotal, setSystemDrawerTotal] = useState(1500);

  const drawerReconciliation = useMemo(() => {
    const countedTotal = 
      (Number(count200) || 0) * 200 +
      (Number(count100) || 0) * 100 +
      (Number(count50) || 0) * 50 +
      (Number(count20) || 0) * 20 +
      (Number(count10) || 0) * 10 +
      (Number(count5) || 0) * 5 +
      (Number(countCoins) || 0);
    const system = Number(systemDrawerTotal) || 0;
    const diff = countedTotal - system;
    return { countedTotal, system, diff };
  }, [count200, count100, count50, count20, count10, count5, countCoins, systemDrawerTotal]);

  // C: Barkodlu Raf Fiyat Etiketi Yazdırma
  const [selectedProductForLabel, setSelectedProductForLabel] = useState(products[0]?.id || "");
  const [customLabelTitle, setCustomLabelTitle] = useState("");
  const [customLabelPrice, setCustomLabelPrice] = useState("");
  const [customLabelBarcode, setCustomLabelBarcode] = useState("");

  useEffect(() => {
    if (products.length > 0) {
      const p = products.find((x) => x.id === selectedProductForLabel) || products[0];
      if (p) {
        setSelectedProductForLabel(p.id);
        setCustomLabelTitle(p.name || "");
        setCustomLabelPrice(String(p.price || ""));
        setCustomLabelBarcode(p.barcode || "869000000000");
      }
    }
  }, [products, selectedProductForLabel]);

  const handlePrintShelfLabel = () => {
    const printWin = window.open("", "_blank", "width=480,height=360");
    if (!printWin) return alert("Yazdırma penceresi açılamadı. Tarayıcı engelleyicisini kontrol edin.");
    
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Raf Etiketi - ${customLabelTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 15px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; color: #000; }
          .label-card { width: 75mm; border: 2px dashed #000; padding: 12px; border-radius: 6px; text-align: center; }
          .store-name { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 4px; }
          .title { font-size: 15px; font-weight: 800; line-height: 1.2; margin-bottom: 8px; text-transform: uppercase; }
          .price-box { font-size: 32px; font-weight: 900; margin: 6px 0; letter-spacing: -1px; }
          .kdv { font-size: 10px; font-weight: 600; color: #666; margin-bottom: 8px; }
          .barcode { font-family: monospace; font-size: 13px; font-weight: 700; letter-spacing: 3px; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; display: inline-block; }
          .date { font-size: 9px; color: #888; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="label-card">
          <div class="store-name">StokPro Mağaza Raf Etiketi</div>
          <div class="title">${customLabelTitle || "Ürün Adı"}</div>
          <div class="price-box">${customLabelPrice || 0} ${currencySymbol}</div>
          <div class="kdv">KDV DAHİL FİYATTIR</div>
          <div class="barcode">*${customLabelBarcode || "869000000000"}*</div>
          <div class="date">Basım: ${new Date().toLocaleDateString("tr-TR")}</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // =============================================================
  // 3. TOPTAN / DAĞITIM MODÜLLERİ
  // =============================================================

  // A: Koli & Kademeli İskonto Hesaplayıcı
  const [boxQty, setBoxQty] = useState(24);
  const [boxCount, setBoxCount] = useState(10);
  const [unitListPrice, setUnitListPrice] = useState(50);
  const [discountPercent, setDiscountPercent] = useState(10);

  const wholesaleCalc = useMemo(() => {
    const totalPieces = (Number(boxQty) || 1) * (Number(boxCount) || 1);
    const subtotal = totalPieces * (Number(unitListPrice) || 0);
    const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100;
    const finalTotal = subtotal - discountAmount;
    const discountedUnitPrice = totalPieces > 0 ? finalTotal / totalPieces : 0;
    const boxPrice = (Number(boxQty) || 1) * discountedUnitPrice;
    return { totalPieces, subtotal, discountAmount, finalTotal, discountedUnitPrice, boxPrice };
  }, [boxQty, boxCount, unitListPrice, discountPercent]);

  // B: Kargo Desi & Palet Hacim Hesaplayıcı
  const [boxWidthCm, setBoxWidthCm] = useState(40);
  const [boxLengthCm, setBoxLengthCm] = useState(60);
  const [boxHeightCm, setBoxHeightCm] = useState(30);
  const [boxWeightKg, setBoxWeightKg] = useState(8);
  const [shipmentBoxCount, setShipmentBoxCount] = useState(12);

  const cargoCalc = useMemo(() => {
    const w = Number(boxWidthCm) || 1;
    const l = Number(boxLengthCm) || 1;
    const h = Number(boxHeightCm) || 1;
    const kg = Number(boxWeightKg) || 0;
    const cnt = Number(shipmentBoxCount) || 1;

    const singleDesi = (w * l * h) / 3000;
    const totalDesi = singleDesi * cnt;
    const totalWeight = kg * cnt;
    const billableMetric = Math.max(totalDesi, totalWeight);

    const boxesPerLayer = Math.floor(80 / w) * Math.floor(120 / l);
    const layers = Math.floor(180 / h);
    const palletCapacity = Math.max(1, boxesPerLayer * layers);

    return { singleDesi, totalDesi, totalWeight, billableMetric, palletCapacity };
  }, [boxWidthCm, boxLengthCm, boxHeightCm, boxWeightKg, shipmentBoxCount]);

  // C: WhatsApp Bakiye & Ekstre Hatırlatma
  const [selectedCustomerForWa, setSelectedCustomerForWa] = useState(null);
  const [waNote, setWaNote] = useState("");

  const handleSendWhatsApp = () => {
    if (!selectedCustomerForWa) return alert("Lütfen bir müşteri seçin.");
    const cust = customers.find(c => c.id === selectedCustomerForWa);
    if (!cust) return;

    const bakiye = Number(cust.balance || 0).toLocaleString("tr-TR");
    const msg = `Sayın ${cust.name}, StokPro cari hesabınızda ${bakiye} ${currencySymbol} açık bakiye bulunmaktadır. ${waNote ? `Not: ${waNote}. ` : ""}Ödemenizi rica eder, hayırlı işler dileriz.`;
    const cleanPhone = String(cust.phone || "").replace(/[^0-9]/g, "");
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
    logUserActivity("WHATSAPP_REMINDER_SEND", `WhatsApp Bakiye Hatırlatması: ${cust.name}`, { customerId: cust.id, balance: cust.balance });
  };

  // =============================================================
  // 4. GENEL / DİĞER: KÂR MARJI & KDV TEVKİFAT MODÜLLERİ
  // =============================================================

  // A: Kâr Marjı & Fiyatlandırma Sihirbazı
  const [costPriceInput, setCostPriceInput] = useState(100);
  const [desiredMarginPercent, setDesiredMarginPercent] = useState(35);
  const [calcVatRate, setCalcVatRate] = useState(20);

  const marginCalc = useMemo(() => {
    const cost = Number(costPriceInput) || 0;
    const margin = Number(desiredMarginPercent) || 0;
    const vat = Number(calcVatRate) || 0;
    const netSale = cost * (1 + margin / 100);
    const profit = netSale - cost;
    const grossSaleWithVat = netSale * (1 + vat / 100);
    return { netSale, profit, grossSaleWithVat };
  }, [costPriceInput, desiredMarginPercent, calcVatRate]);

  // B: KDV Tevkifatı & Fatura Dağılım Hesaplayıcı
  const [tevkifatBaseAmount, setTevkifatBaseAmount] = useState(5000);
  const [tevkifatVatRate, setTevkifatVatRate] = useState(20);
  const [tevkifatRatio, setTevkifatRatio] = useState("5/10");

  const tevkifatCalc = useMemo(() => {
    const base = Number(tevkifatBaseAmount) || 0;
    const vatPercent = Number(tevkifatVatRate) || 20;
    const normalVat = (base * vatPercent) / 100;

    const [numerator, denominator] = tevkifatRatio.split("/").map(Number);
    const tevkifEdilenKdv = (normalVat * (numerator || 5)) / (denominator || 10);
    const beyanEdilenKdv = normalVat - tevkifEdilenKdv;
    const payableToSeller = base + beyanEdilenKdv;
    const grandTotal = base + normalVat;

    return { base, normalVat, tevkifEdilenKdv, beyanEdilenKdv, payableToSeller, grandTotal };
  }, [tevkifatBaseAmount, tevkifatVatRate, tevkifatRatio]);

  // Çalışma Araçları Masası Gizlenebilir / Katlanabilir
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stokpro_tools_collapsed");
      if (saved !== null) {
        setIsToolsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleTools = () => {
    setIsToolsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("stokpro_tools_collapsed", String(next)); } catch {}
      return next;
    });
  };

  return (
    <div style={{ marginTop: "1.75rem", marginBottom: "2rem" }}>
      {/* BAŞLIK VE SEKTÖR DEĞİŞTİRİCİ TABLAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: isToolsCollapsed ? "0.5rem" : "1.25rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "var(--primary-bg)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 800, border: "1px solid var(--border-main)" }}>
            <FiSliders size={13} /> ALANA ÖZEL ÇALIŞMA ARAÇLARI
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: "0.35rem 0 0 0", letterSpacing: "-0.02em", color: "var(--text-main)" }}>
            Sektörünüze Özel Akıllı Araç Masası
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Sektör Değiştirici Hap Butonlar */}
          <div style={{ display: "flex", background: "var(--bg-subtle)", padding: "0.3rem", borderRadius: "10px", border: "1px solid var(--border-main)", gap: "0.3rem", flexWrap: "wrap" }}>
            {[
              { key: "tekstil", label: "Tekstil / İmalat", icon: FiLayers },
              { key: "perakende", label: "Perakende / Kasa", icon: FiShoppingBag },
              { key: "toptan", label: "Toptan / Dağıtım", icon: FiTruck },
              { key: "diger", label: "Kâr & Tevkifat", icon: FiPercent }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSel = activeSector === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveSector(tab.key);
                    if (isToolsCollapsed) {
                      setIsToolsCollapsed(false);
                      try { localStorage.setItem("stokpro_tools_collapsed", "false"); } catch {}
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "7px",
                    border: isSel ? "1px solid var(--primary)" : "1px solid transparent",
                    background: isSel ? "var(--primary)" : "transparent",
                    color: isSel ? "#ffffff" : "var(--text-muted)",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSel ? "0 2px 6px rgba(37,99,235,0.25)" : "none"
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Gizle / Göster Butonu */}
          <button
            type="button"
            onClick={toggleTools}
            className="tbl-btn secondary"
            style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem", gap: "5px", cursor: "pointer", height: "36px" }}
            title={isToolsCollapsed ? "Çalışma araçlarını göster" : "Çalışma araçlarını gizle"}
          >
            {isToolsCollapsed ? (
              <>Araçları Göster <FiChevronDown size={14} /></>
            ) : (
              <>Araçları Gizle <FiChevronUp size={14} /></>
            )}
          </button>
        </div>
      </div>

      {/* MODÜLLER YALNIZCA AÇIKKEN GÖSTERİLİR */}
      {!isToolsCollapsed && (
        <div style={{ animation: "fadeIn 0.2s ease-out" }}>

      {/* ========================================================================= */}
      {/* 1. TEKSTİL / İMALAT MODÜLLERİ                                             */}
      {/* ========================================================================= */}
      {activeSector === "tekstil" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "1.25rem" }}>
          
          {/* A: Kumaş & Metraj Hesaplayıcı */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--primary-bg)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiLayers size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Kumaş Topu & Metraj Hesaplayıcı</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Rulo metrajından adet ve fire hesabı</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Top (Rulo) Adedi:</label>
                <input 
                  type="number" 
                  value={rollsCount} 
                  onChange={(e) => setRollsCount(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Top Başı Metre:</label>
                <input 
                  type="number" 
                  value={metersPerRoll} 
                  onChange={(e) => setMetersPerRoll(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Adet Sarfiyatı (mt):</label>
                <input 
                  type="number" 
                  step="0.05"
                  value={metersPerPiece} 
                  onChange={(e) => setMetersPerPiece(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Fire Payı (%):</label>
                <input 
                  type="number" 
                  value={wastePercentage} 
                  onChange={(e) => setWastePercentage(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
            </div>

            {/* ÇERÇEVELİ VE AYRIŞTIRILMIŞ METRİK KUTULARI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Çıkacak Maks. Adet</span>
                <span className="metric-tile-val highlight-green">{fabricCalc.maxPieces} Adet</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Kullanılabilir Metraj</span>
                <span className="metric-tile-val highlight-blue">{fabricCalc.usableMeters.toFixed(1)} mt</span>
              </div>
              <div className="metric-tile-box" style={{ gridColumn: "span 2", padding: "0.6rem 0.8rem", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>Toplam Kumaş: <strong>{fabricCalc.totalMeters} mt</strong></span>
                <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 700 }}>Tahmini Fire: <strong>{fabricCalc.wasteMeters.toFixed(1)} mt</strong></span>
              </div>
            </div>
          </div>

          {/* B: Beden & Varyant Serileme Dağıtıcı (Textile Variant Matrix) */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiGrid size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Serileme & Beden Dağıtıcı</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Siparişi S-M-L-XL oranına bölüştürün</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Toplam Üretim / Sipariş Adedi:</label>
              <input 
                type="number" 
                value={totalOrderQty} 
                onChange={(e) => setTotalOrderQty(e.target.value)} 
                className="tool-input-frame"
                style={{ fontSize: "1.05rem" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Serileme Oranı (Örn: 1-2-2-1):</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
                {[
                  { label: "S", val: ratioS, set: setRatioS },
                  { label: "M", val: ratioM, set: setRatioM },
                  { label: "L", val: ratioL, set: setRatioL },
                  { label: "XL", val: ratioXL, set: setRatioXL }
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: "center", background: "var(--bg-subtle)", border: "1px solid var(--border-main)", borderRadius: "6px", padding: "0.4rem 0.2rem" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "var(--primary)", marginBottom: "0.15rem" }}>{item.label}</div>
                    <input 
                      type="number"
                      min="0"
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      style={{ width: "80%", textAlign: "center", padding: "0.25rem", borderRadius: "4px", border: "1px solid var(--border-main)", background: "var(--bg-input)", color: "var(--text-main)", fontWeight: 800, fontSize: "0.85rem" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ÇERÇEVELİ BEDEN DÖKÜM KUTUCUKLARI */}
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.4rem", textTransform: "uppercase" }}>Kesilecek Net Adetler:</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.45rem" }}>
                <div className="metric-tile-box" style={{ padding: "0.5rem 0.25rem" }}>
                  <span className="metric-tile-label" style={{ color: "#3b82f6" }}>S Beden</span>
                  <span className="metric-tile-val" style={{ fontSize: "1.15rem" }}>{sizeBreakdown.s}</span>
                </div>
                <div className="metric-tile-box" style={{ padding: "0.5rem 0.25rem" }}>
                  <span className="metric-tile-label" style={{ color: "#10b981" }}>M Beden</span>
                  <span className="metric-tile-val" style={{ fontSize: "1.15rem" }}>{sizeBreakdown.m}</span>
                </div>
                <div className="metric-tile-box" style={{ padding: "0.5rem 0.25rem" }}>
                  <span className="metric-tile-label" style={{ color: "#f59e0b" }}>L Beden</span>
                  <span className="metric-tile-val" style={{ fontSize: "1.15rem" }}>{sizeBreakdown.l}</span>
                </div>
                <div className="metric-tile-box" style={{ padding: "0.5rem 0.25rem" }}>
                  <span className="metric-tile-label" style={{ color: "#f43f5e" }}>XL Beden</span>
                  <span className="metric-tile-val" style={{ fontSize: "1.15rem" }}>{sizeBreakdown.xl}</span>
                </div>
              </div>
            </div>
          </div>

          {/* C: İmalat Partileri & Atölye Kanban */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiClock size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>İmalat Partileri (Kanban)</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Kesim, dikim ve paket aşama takibi</span>
              </div>
            </div>

            {/* Yeni Parti Ekleme Formu */}
            <form onSubmit={handleAddBatch} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input 
                placeholder="Model Adı (Örn: Polo Yaka)"
                value={newBatchModel}
                onChange={(e) => setNewBatchModel(e.target.value)}
                className="tool-input-frame"
                style={{ flex: "1 1 140px", padding: "0.45rem 0.6rem", fontSize: "0.82rem" }}
              />
              <input 
                type="number" 
                placeholder="Adet"
                value={newBatchQty}
                onChange={(e) => setNewBatchQty(e.target.value)}
                className="tool-input-frame"
                style={{ width: "70px", padding: "0.45rem 0.6rem", fontSize: "0.82rem" }}
              />
              <button 
                type="submit" 
                style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "6px", padding: "0.45rem 0.75rem", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}
              >
                <FiPlus size={14} /> Ekle
              </button>
            </form>

            {/* Parti Kartları Listesi */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
              {batches.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.8rem", border: "1px dashed var(--border-main)", borderRadius: "6px" }}>Aktif parti bulunmuyor.</div>
              ) : (
                batches.map((b) => {
                  const STAGE_LABELS = {
                    kesim: { label: "1. Kesimhane", color: "#3b82f6" },
                    dikim: { label: "2. Dikimhane", color: "#f59e0b" },
                    utu_paket: { label: "3. Ütü & Paket", color: "#8b5cf6" },
                    tamamlandi: { label: "4. Tamamlandı", color: "#10b981" }
                  };
                  const currentStg = STAGE_LABELS[b.stage] || STAGE_LABELS.kesim;

                  return (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-subtle)", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-main)" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>{b.model}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.15rem" }}>
                          <span>{b.qty} Adet</span>
                          <span>•</span>
                          <span style={{ color: currentStg.color, fontWeight: 800 }}>{currentStg.label}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {b.stage !== "tamamlandi" && (
                          <button 
                            onClick={() => handleAdvanceBatch(b.id)}
                            title="Sonraki Aşamaya Geçir"
                            style={{ background: "var(--primary-bg)", border: "1px solid var(--border-main)", color: "var(--primary)", padding: "0.35rem 0.55rem", borderRadius: "5px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                          >
                            İlerlet <FiChevronRight size={12} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteBatch(b.id)}
                          title="Partiyi Sil"
                          style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.25rem" }}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PERAKENDE / MAĞAZA MODÜLLERİ                                           */}
      {/* ========================================================================= */}
      {activeSector === "perakende" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "1.25rem" }}>
          
          {/* A: Akıllı Kasa & Para Üstü Asistanı */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiDollarSign size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Akıllı Para Üstü Asistanı</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Hızlı nakit para üstü ve banknot tuşları</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Satış Tutarı ({currencySymbol}):</label>
                <input 
                  type="number" 
                  value={saleTotalInput} 
                  onChange={(e) => setSaleTotalInput(e.target.value)} 
                  className="tool-input-frame"
                  style={{ fontSize: "1.05rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Alınan Nakit ({currencySymbol}):</label>
                <input 
                  type="number" 
                  value={tenderInput} 
                  onChange={(e) => setTenderInput(e.target.value)} 
                  className="tool-input-frame"
                  style={{ fontSize: "1.05rem" }}
                />
              </div>
            </div>

            {/* Hızlı Banknot Tuşları */}
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.35rem", textTransform: "uppercase" }}>Hızlı Banknot Seçimi:</div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {[200, 100, 50, 20, 10].map((noteVal) => (
                  <button
                    key={noteVal}
                    type="button"
                    onClick={() => setTenderInput(noteVal)}
                    style={{
                      background: tenderInput === noteVal ? "var(--primary)" : "var(--bg-subtle)",
                      color: tenderInput === noteVal ? "#ffffff" : "var(--text-main)",
                      border: "1px solid var(--border-main)",
                      padding: "0.35rem 0.65rem",
                      borderRadius: "6px",
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {noteVal} {currencySymbol}
                  </button>
                ))}
              </div>
            </div>

            {/* ÇERÇEVELİ PARA ÜSTÜ KUTUSU */}
            <div className="metric-tile-box" style={{ padding: "1rem" }}>
              <span className="metric-tile-label">Müşteriye Verilecek Para Üstü</span>
              <span className="metric-tile-val highlight-green" style={{ fontSize: "1.8rem", margin: "0.3rem 0" }}>
                {changeDue.toLocaleString("tr-TR")} {currencySymbol}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Alınan: <strong>{tenderInput} {currencySymbol}</strong> • Satış: <strong>{saleTotalInput} {currencySymbol}</strong>
              </span>
            </div>
          </div>

          {/* B: Gün Sonu Kasa Sayım & Mutabakat (Z-Report Cash Reconciliation) */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiArchive size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Gün Sonu Kasa Sayımı</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Kasa çekmecesi sayımı ile kasa açığı/fazlası</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Sistemdeki Kasa Tutarı ({currencySymbol}):</label>
              <input 
                type="number" 
                value={systemDrawerTotal} 
                onChange={(e) => setSystemDrawerTotal(e.target.value)} 
                className="tool-input-frame"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.3rem", textTransform: "uppercase" }}>Banknot Sayım Adetleri:</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
                {[
                  { label: "200 ₺", val: count200, set: setCount200 },
                  { label: "100 ₺", val: count100, set: setCount100 },
                  { label: "50 ₺", val: count50, set: setCount50 },
                  { label: "20 ₺", val: count20, set: setCount20 },
                  { label: "10 ₺", val: count10, set: setCount10 },
                  { label: "5 ₺", val: count5, set: setCount5 },
                  { label: "Madeni", val: countCoins, set: setCountCoins }
                ].map((item) => (
                  <div key={item.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-main)", borderRadius: "6px", padding: "0.35rem 0.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.15rem" }}>{item.label}</div>
                    <input 
                      type="number"
                      min="0"
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      style={{ width: "85%", padding: "0.25rem", borderRadius: "4px", border: "1px solid var(--border-main)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: "0.82rem", textAlign: "center", fontWeight: 800 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ÇERÇEVELİ KASA KARŞILAŞTIRMA KUTULARI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Fiili Sayılan</span>
                <span className="metric-tile-val">{drawerReconciliation.countedTotal.toLocaleString("tr-TR")} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Sistem Kaydı</span>
                <span className="metric-tile-val">{drawerReconciliation.system.toLocaleString("tr-TR")} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box" style={{ 
                gridColumn: "span 2", 
                borderWidth: "2px",
                borderColor: drawerReconciliation.diff === 0 ? "#10b981" : drawerReconciliation.diff > 0 ? "#3b82f6" : "#ef4444",
                background: drawerReconciliation.diff === 0 ? "rgba(16, 185, 129, 0.08)" : drawerReconciliation.diff > 0 ? "rgba(59, 130, 246, 0.08)" : "rgba(239, 68, 68, 0.08)"
              }}>
                <span className="metric-tile-label" style={{ color: "var(--text-main)" }}>Kasa Mutabakat Durumu</span>
                <span className="metric-tile-val" style={{ 
                  color: drawerReconciliation.diff === 0 ? "#10b981" : drawerReconciliation.diff > 0 ? "#3b82f6" : "#ef4444",
                  fontSize: "1.1rem" 
                }}>
                  {drawerReconciliation.diff === 0 ? "✅ Kasa Tam Eşit (Fark Yok)" : drawerReconciliation.diff > 0 ? `+${drawerReconciliation.diff.toLocaleString("tr-TR")} ${currencySymbol} Kasa Fazlası` : `${drawerReconciliation.diff.toLocaleString("tr-TR")} ${currencySymbol} Kasa Açığı`}
                </span>
              </div>
            </div>
          </div>

          {/* C: Barkodlu Raf Fiyat Etiketi Yazdır */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--primary-bg)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiTag size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Barkodlu Raf Etiketi Yazdır</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Reyon ve vitrinler için etiket basımı</span>
              </div>
            </div>

            {products.length > 0 && (
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Kayıtlı Üründen Çek:</label>
                <select 
                  value={selectedProductForLabel} 
                  onChange={(e) => {
                    setSelectedProductForLabel(e.target.value);
                    const prd = products.find(p => p.id === e.target.value);
                    if (prd) {
                      setCustomLabelTitle(prd.name || "");
                      setCustomLabelPrice(String(prd.price || ""));
                      setCustomLabelBarcode(prd.barcode || "869000000000");
                    }
                  }}
                  className="tool-input-frame"
                  style={{ fontSize: "0.82rem" }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price} {currencySymbol})</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }}>
              <input 
                placeholder="Ürün Adı" 
                value={customLabelTitle} 
                onChange={(e) => setCustomLabelTitle(e.target.value)} 
                className="tool-input-frame"
                style={{ fontSize: "0.82rem" }}
              />
              <input 
                placeholder={`Fiyat ${currencySymbol}`}
                value={customLabelPrice} 
                onChange={(e) => setCustomLabelPrice(e.target.value)} 
                className="tool-input-frame"
                style={{ fontSize: "0.82rem" }}
              />
            </div>

            {/* ÇERÇEVELİ RAF ETİKETİ ÖNİZLEME KUTUSU */}
            <div style={{ border: "2px dashed var(--border-main)", padding: "0.85rem", borderRadius: "8px", textAlign: "center", background: "var(--bg-subtle)" }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontWeight: 800 }}>STOKPRO MAĞAZA ETİKETİ</div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", margin: "0.2rem 0", color: "var(--text-main)" }}>{customLabelTitle || "Ürün Adı"}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#10b981" }}>{customLabelPrice || 0} {currencySymbol}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>KDV DAHİL FİYAT</div>
              <code style={{ fontSize: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border-main)", padding: "0.15rem 0.5rem", borderRadius: "4px", color: "var(--text-main)" }}>*{customLabelBarcode || "869000000000"}*</code>
            </div>

            <button 
              type="button" 
              onClick={handlePrintShelfLabel}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "6px", padding: "0.6rem", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
            >
              <FiPrinter size={15} /> Raf Etiketini Yazdır
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TOPTAN / DAĞITIM MODÜLLERİ                                             */}
      {/* ========================================================================= */}
      {activeSector === "toptan" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "1.25rem" }}>
          
          {/* A: Koli & Kademeli İskonto Hesaplayıcı */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiBox size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Koli & İskonto Hesaplayıcı</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Toplu koli alımları ve kademeli indirim</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Koli İçi Adet:</label>
                <input 
                  type="number" 
                  value={boxQty} 
                  onChange={(e) => setBoxQty(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Koli Sayısı:</label>
                <input 
                  type="number" 
                  value={boxCount} 
                  onChange={(e) => setBoxCount(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Birim Liste Fiyatı ({currencySymbol}):</label>
                <input 
                  type="number" 
                  value={unitListPrice} 
                  onChange={(e) => setUnitListPrice(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>İskonto Oranı (%):</label>
                <input 
                  type="number" 
                  value={discountPercent} 
                  onChange={(e) => setDiscountPercent(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
            </div>

            {/* ÇERÇEVELİ İSKONTO HESAP DÖKÜM KUTULARI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Toplam Ürün</span>
                <span className="metric-tile-val">{wholesaleCalc.totalPieces} Adet</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">İndirimli Birim</span>
                <span className="metric-tile-val highlight-purple">{wholesaleCalc.discountedUnitPrice.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Koli Başı Net Fiyat</span>
                <span className="metric-tile-val highlight-blue">{wholesaleCalc.boxPrice.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Sağlanan İskonto</span>
                <span className="metric-tile-val highlight-amber">-{wholesaleCalc.discountAmount.toLocaleString("tr-TR")} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box" style={{ gridColumn: "span 2", padding: "0.85rem", background: "var(--bg-subtle)", border: "1px solid var(--border-main)" }}>
                <span className="metric-tile-label">Toplam Fatura Bedeli</span>
                <span className="metric-tile-val highlight-green" style={{ fontSize: "1.6rem" }}>
                  {wholesaleCalc.finalTotal.toLocaleString("tr-TR")} {currencySymbol}
                </span>
              </div>
            </div>
          </div>

          {/* B: Kargo Desi & Palet Hacim Hesaplayıcı */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--primary-bg)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiTruck size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Kargo Desi & Palet Hacmi</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Koli ebatlarından kargo desi ve palet kapasitesi</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>En (cm):</label>
                <input 
                  type="number"
                  value={boxWidthCm}
                  onChange={(e) => setBoxWidthCm(e.target.value)}
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Boy (cm):</label>
                <input 
                  type="number"
                  value={boxLengthCm}
                  onChange={(e) => setBoxLengthCm(e.target.value)}
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Yükseklik (cm):</label>
                <input 
                  type="number"
                  value={boxHeightCm}
                  onChange={(e) => setBoxHeightCm(e.target.value)}
                  className="tool-input-frame"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Koli Ağırlığı (kg):</label>
                <input 
                  type="number"
                  value={boxWeightKg}
                  onChange={(e) => setBoxWeightKg(e.target.value)}
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Sevk Koli Adedi:</label>
                <input 
                  type="number"
                  value={shipmentBoxCount}
                  onChange={(e) => setShipmentBoxCount(e.target.value)}
                  className="tool-input-frame"
                />
              </div>
            </div>

            {/* ÇERÇEVELİ KARGO & DESİ KUTULARI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Tek Koli Desi</span>
                <span className="metric-tile-val">{cargoCalc.singleDesi.toFixed(2)} Desi</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Toplam Desi</span>
                <span className="metric-tile-val highlight-blue">{cargoCalc.totalDesi.toFixed(1)} Desi</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Toplam Ağırlık</span>
                <span className="metric-tile-val">{cargoCalc.totalWeight.toFixed(1)} kg</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Euro Palet Kapasitesi</span>
                <span className="metric-tile-val highlight-green">~{cargoCalc.palletCapacity} Koli</span>
              </div>
            </div>
          </div>

          {/* C: WhatsApp Bakiye & Ekstre Hatırlatma */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiSend size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>WhatsApp Bakiye Hatırlatıcı</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Açık cari hesaplara tek tıkla mesaj atın</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Borçlu Cari Seçin:</label>
              <select 
                value={selectedCustomerForWa || ""} 
                onChange={(e) => setSelectedCustomerForWa(e.target.value)}
                className="tool-input-frame"
                style={{ fontSize: "0.82rem" }}
              >
                <option value="">-- Müşteri / Bayi Seçiniz --</option>
                {customers.filter(c => Number(c.balance || 0) > 0).map(c => (
                  <option key={c.id} value={c.id}>{c.name} — Bakiye: {c.balance} {currencySymbol} ({c.phone || "Tel yok"})</option>
                ))}
                {customers.filter(c => Number(c.balance || 0) <= 0).map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Bakiye: {c.balance || 0} {currencySymbol})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Özel Not (Opsiyonel):</label>
              <input 
                placeholder="Örn: Vade tarihi 15 Eylül'dür."
                value={waNote} 
                onChange={(e) => setWaNote(e.target.value)} 
                className="tool-input-frame"
                style={{ fontSize: "0.82rem" }}
              />
            </div>

            <div className="metric-tile-box" style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Seçilen müşteriye doğrudan WhatsApp Web veya Mobil üzerinden otomatik biçimlendirilmiş bakiye ekstresi gönderilir.
            </div>

            <button 
              type="button" 
              onClick={handleSendWhatsApp}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "0.65rem", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
            >
              <FiSend size={15} /> WhatsApp İle Gönder
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. GENEL / DİĞER: KÂR MARJI & KDV TEVKİFAT MODÜLLERİ                       */}
      {/* ========================================================================= */}
      {activeSector === "diger" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "1.25rem" }}>
          
          {/* A: Kâr Marjı & Fiyatlandırma Sihirbazı */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--primary-bg)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiPercent size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>Kâr Marjı & Fiyatlandırma</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Maliyetten hedef satış ve net kâr hesabı</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Alış Maliyeti ({currencySymbol}):</label>
                <input 
                  type="number" 
                  value={costPriceInput} 
                  onChange={(e) => setCostPriceInput(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Hedef Kâr Marjı (%):</label>
                <input 
                  type="number" 
                  value={desiredMarginPercent} 
                  onChange={(e) => setDesiredMarginPercent(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>KDV Oranı (%):</label>
                <select 
                  value={calcVatRate} 
                  onChange={(e) => setCalcVatRate(Number(e.target.value))}
                  className="tool-input-frame"
                >
                  <option value={0}>%0 KDV</option>
                  <option value={1}>%1 KDV</option>
                  <option value={10}>%10 KDV</option>
                  <option value={20}>%20 KDV</option>
                </select>
              </div>
            </div>

            {/* ÇERÇEVELİ KÂR VE FİYAT KUTULARI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.55rem" }}>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Net Satış (KDV Hariç)</span>
                <span className="metric-tile-val highlight-blue">{marginCalc.netSale.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Birim Net Kâr</span>
                <span className="metric-tile-val highlight-green">+{marginCalc.profit.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Etiket Fiyatı (KDV Dahil)</span>
                <span className="metric-tile-val highlight-amber">{marginCalc.grossSaleWithVat.toFixed(2)} {currencySymbol}</span>
              </div>
            </div>
          </div>

          {/* B: KDV Tevkifatı & Fatura Dağılım Hesaplayıcı */}
          <div className="tool-panel-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-main)" }}>
                <FiDollarSign size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "var(--text-main)" }}>KDV Tevkifatı Hesaplayıcı</h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Tevkifat oranına göre tahsilat ve kesinti dökümü</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>KDV Hariç Matrah ({currencySymbol}):</label>
                <input 
                  type="number" 
                  value={tevkifatBaseAmount} 
                  onChange={(e) => setTevkifatBaseAmount(e.target.value)} 
                  className="tool-input-frame"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>KDV Oranı (%):</label>
                <select 
                  value={tevkifatVatRate} 
                  onChange={(e) => setTevkifatVatRate(Number(e.target.value))}
                  className="tool-input-frame"
                >
                  <option value={20}>%20 Standart KDV</option>
                  <option value={10}>%10 İndirimli KDV</option>
                  <option value={1}>%1 KDV</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem", textTransform: "uppercase" }}>Tevkifat Oranı:</label>
                <select 
                  value={tevkifatRatio} 
                  onChange={(e) => setTevkifatRatio(e.target.value)}
                  className="tool-input-frame"
                >
                  <option value="2/10">2/10 Tevkifat</option>
                  <option value="3/10">3/10 Tevkifat</option>
                  <option value="4/10">4/10 Tevkifat</option>
                  <option value="5/10">5/10 Tevkifat</option>
                  <option value="7/10">7/10 Tevkifat</option>
                  <option value="9/10">9/10 Tevkifat</option>
                </select>
              </div>
            </div>

            {/* ÇERÇEVELİ TEVKİFAT DÖKÜM KUTULARI */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Tevkif Edilen KDV (Alıcı Öder)</span>
                <span className="metric-tile-val highlight-rose">-{tevkifatCalc.tevkifEdilenKdv.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box">
                <span className="metric-tile-label">Tahsil Edilecek KDV</span>
                <span className="metric-tile-val highlight-blue">+{tevkifatCalc.beyanEdilenKdv.toFixed(2)} {currencySymbol}</span>
              </div>
              <div className="metric-tile-box" style={{ gridColumn: "span 2", padding: "0.85rem", background: "var(--bg-subtle)", border: "1px solid var(--border-main)" }}>
                <span className="metric-tile-label">Satıcıya Ödenecek Net Tutar</span>
                <span className="metric-tile-val highlight-green" style={{ fontSize: "1.6rem" }}>
                  {tevkifatCalc.payableToSeller.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {currencySymbol}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Fatura Genel Dip Toplamı: <strong>{tevkifatCalc.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
