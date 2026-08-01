"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FiPrinter, FiX, FiFileText, FiDownload } from "react-icons/fi";
import { auth } from "../firebase";
import { getUserProfile } from "../utils/firebaseHelpers";
import { getMasterStoreSnapshot } from "../utils/masterDataCache";

export default function InvoiceModal({ invoiceData: propInvoiceData, invoice: propInvoice, onClose }) {
  const invoiceData = propInvoiceData || propInvoice;
  const [downloading, setDownloading] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({
    name: "",
    companyTitle: "",
    taxOffice: "",
    taxNumber: "",
    address: "",
    logoUrl: "",
    email: "",
    invoicePrefix: "GIB2026"
  });

  useEffect(() => {
    async function loadSeller() {
      // 1. Önce Master Cache Anlık Görüntüsünü Kontrol Et (Hızlı Yükleme)
      const snap = getMasterStoreSnapshot();
      const u = auth.currentUser;
      const uid = u?.uid;

      let logo = snap?.profile?.logoUrl || "";
      if (!logo && uid && typeof window !== "undefined") {
        logo = localStorage.getItem(`stokpro_logoUrl_${uid}`) || localStorage.getItem("user_logo_url") || "";
      }

      let sName = snap?.profile?.name || snap?.profile?.displayName || "";
      let cTitle = snap?.profile?.companyTitle || snap?.profile?.storeName || sName;
      let tOffice = snap?.profile?.taxOffice || "";
      let tNum = snap?.profile?.taxNumber || "";
      let addr = snap?.profile?.companyAddress || snap?.profile?.address || "";
      let invPrefix = snap?.profile?.invoicePrefix || "GIB2026";
      let vRate = snap?.profile?.vatRate !== undefined ? Number(snap.profile.vatRate) : 20;

      let sEmail = u?.email || "";
      if (sEmail.endsWith("gmailcom")) {
        sEmail = sEmail.replace("gmailcom", "gmail.com");
      }

      try {
        const prof = await getUserProfile();
        if (prof) {
          sName = prof.name || prof.displayName || sName;
          cTitle = prof.companyTitle || prof.storeName || sName || cTitle;
          tOffice = prof.taxOffice || tOffice;
          tNum = prof.taxNumber || tNum;
          addr = prof.companyAddress || prof.address || addr;
          if (prof.logoUrl) logo = prof.logoUrl;
          if (prof.invoicePrefix) invPrefix = prof.invoicePrefix;
          if (prof.vatRate !== undefined) vRate = Number(prof.vatRate);
        }
      } catch (e) {
        console.error(e);
      }

      if (!cTitle && sEmail) {
        const prefix = sEmail.split("@")[0];
        cTitle = prefix.charAt(0).toUpperCase() + prefix.slice(1) + " Ticaret";
      }

      if (!logo) {
        logo = "/browserlogo.svg";
      }

      setSellerInfo({
        name: sName || "İşletme Yetkilisi",
        companyTitle: cTitle || "StokPro Ticaret",
        taxOffice: tOffice || "Kadıköy V.D.",
        taxNumber: tNum || "1234567890",
        address: addr || "İstanbul, Türkiye",
        logoUrl: logo,
        email: sEmail,
        invoicePrefix: invPrefix || "GIB2026",
        vatRate: isNaN(vRate) ? 20 : vRate
      });
    }

    loadSeller();
  }, []);

  // AYARLARDAKİ CANLI FATURA ÖNEKİNE (INVOICE PREFIX) UYGUN TEK VE SABİT SERİ NO ÜRETİMİ
  const ftrNo = useMemo(() => {
    const prefix = sellerInfo.invoicePrefix || "GIB2026";

    if (!invoiceData) return `${prefix}000000001`;
    if (invoiceData.invoiceNo) return invoiceData.invoiceNo;

    if (invoiceData.id) {
      const numericPart = String(invoiceData.id).replace(/[^0-9]/g, "").slice(0, 9);
      if (numericPart.length >= 5) {
        return `${prefix}${numericPart.padStart(9, "0")}`;
      }
    }

    if (invoiceData.createdAt) {
      const ts = new Date(invoiceData.createdAt).getTime();
      if (!isNaN(ts)) {
        return `${prefix}${String(ts).slice(-9)}`;
      }
    }

    return `${prefix}000100201`;
  }, [invoiceData, sellerInfo.invoicePrefix]);

  if (!invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById("printable-invoice");
      if (!element) return;

      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin: 10,
        filename: `${ftrNo}_fatura.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
  const total = Number(invoiceData.totals?.total || invoiceData.total || invoiceData.amount || 0);
  
  const currentVatRate = Number(sellerInfo.vatRate ?? 20);
  const vatMultiplier = currentVatRate > 0 ? (1 + (currentVatRate / 100)) : 1;
  const araToplam = currentVatRate > 0 ? (total / vatMultiplier) : total; // KDV Hariç Matrah
  const kdv = total - araToplam;   // KDV Tutarı

  const now = invoiceData.createdAt ? new Date(invoiceData.createdAt) : new Date();
  const dateStr = now.toLocaleDateString("tr-TR", { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });

  const customerName = invoiceData.customerName || invoiceData.customer || "Perakende Müşteri";
  const customerTaxOffice = invoiceData.customerTaxOffice || "";
  const customerTaxNumber = invoiceData.customerTaxNumber || invoiceData.customerTckn || "";
  const customerAddress = invoiceData.customerAddress || invoiceData.address || "";

  return (
    <div className="modal-overlay p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="modal-card p-3 sm:p-5 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 w-full max-h-[95vh] flex flex-col overflow-hidden" style={{ maxWidth: '750px' }}>
        
        {/* MODAL HEADER */}
        <div className="modal-header print:hidden shrink-0">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiFileText style={{ color: 'var(--text-main)' }} /> Fatura Görünümü
          </h4>
          <button onClick={onClose} className="close-btn"><FiX /></button>
        </div>

        {/* ULTRA SADE & DÜZ FATURA GÖVDESİ */}
        <div 
          id="printable-invoice" 
          className="modal-body p-4 sm:p-9 print:p-6 overflow-y-auto" 
          style={{ 
            background: '#ffffff', 
            color: '#000000', 
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            fontFamily: 'Calibri, Arial, sans-serif'
          }}
        >
          
          {/* ÜST BAŞLIK & FATURA BİLGİSİ */}
          <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start border-b border-black pb-4 gap-4 sm:gap-0">
            <div>
              {sellerInfo.logoUrl ? (
                <img 
                  src={sellerInfo.logoUrl} 
                  alt="İşletme Logosu" 
                  style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', marginBottom: '8px', display: 'block' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/browserlogo.svg";
                  }}
                />
              ) : null}
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{sellerInfo.companyTitle}</h2>
              {sellerInfo.taxOffice || sellerInfo.taxNumber ? (
                <p style={{ fontSize: '0.85rem', margin: '2px 0 0 0', color: '#333333' }}>
                  {sellerInfo.taxOffice} V.D. - {sellerInfo.taxNumber}
                </p>
              ) : null}
              {sellerInfo.address ? (
                <p style={{ fontSize: '0.85rem', margin: '2px 0 0 0', color: '#333333', wordBreak: 'break-word' }}>{sellerInfo.address}</p>
              ) : null}
              <p style={{ fontSize: '0.85rem', margin: '2px 0 0 0', color: '#333333' }}>{sellerInfo.email}</p>
            </div>

            <div className="text-left sm:text-right print:text-right shrink-0 pt-2 sm:pt-0">
              <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 6px 0', letterSpacing: '1px' }}>FATURA</h1>
              <p style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Fatura No:</strong> {ftrNo}</p>
              <p style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Tarih:</strong> {dateStr}</p>
              <p style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Saat:</strong> {timeStr}</p>
            </div>
          </div>

          {/* ALICI MÜŞTERİ BİLGİLERİ */}
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666666', textTransform: 'uppercase' }}>Sayın (Alıcı):</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '4px 0 2px 0', wordBreak: 'break-word' }}>{customerName}</h3>
            {customerTaxOffice || customerTaxNumber ? (
              <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#333333' }}>
                Vergi Dairesi / VKN: {customerTaxOffice} {customerTaxNumber}
              </p>
            ) : null}
            {customerAddress ? (
              <p style={{ fontSize: '0.85rem', margin: '2px 0', color: '#333333', wordBreak: 'break-word' }}>{customerAddress}</p>
            ) : null}
          </div>

          {/* ÜRÜN VE HİZMET TABLOSU */}
          <div className="w-full overflow-x-auto print:overflow-visible">
            <table style={{ width: '100%', minWidth: '440px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000000' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 'bold' }}>Açıklama / Ürün</th>
                  <th style={{ textAlign: 'center', padding: '8px 0', fontWeight: 'bold', width: '70px' }}>Miktar</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold', width: '110px' }}>Birim Fiyat</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold', width: '120px' }}>Toplam Tutar (KDV Dahil)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 0' }}>{invoiceData.label || invoiceData.description || "Genel Satış İşlemi"}</td>
                    <td style={{ textAlign: 'center', padding: '10px 0' }}>1 Adet</td>
                    <td style={{ textAlign: 'right', padding: '10px 0' }}>{total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 'bold' }}>{total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const price = Number(it.price || 0);
                    const qty = Number(it.qty || 1);
                    const lineTotal = price * qty;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 0', wordBreak: 'break-word' }}>{it.name || "Ürün"}</td>
                        <td style={{ textAlign: 'center', padding: '10px 0' }}>{qty} {it.unit || "Adet"}</td>
                        <td style={{ textAlign: 'right', padding: '10px 0' }}>
                          {price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 'bold' }}>
                          {lineTotal.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* HESAP TOPLAMLARI & KELİMELERİ ASLA BİRLEŞMEYEN NET DİPNOT METNİ */}
          <div className="flex flex-col-reverse sm:flex-row print:flex-row justify-between items-start pt-2 gap-4 sm:gap-2">
            <div style={{ fontSize: '0.8rem', color: '#555555', maxWidth: '340px', lineHeight: 1.6, wordSpacing: '2px' }}>
              Bu belge StokPro® Otomasyonu (stokpro.shop) üzerinden dijital olarak oluşturulmuştur.
            </div>

            <div className="w-full sm:w-[240px] print:w-[240px] flex flex-col gap-1.5 text-sm">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444444' }}>
                <span>Matrah (KDV Hariç):</span>
                <span>{araToplam.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444444' }}>
                <span>KDV (%{currentVatRate}):</span>
                <span>{kdv.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 'bold', borderTop: '1px solid #000000', paddingTop: '6px', marginTop: '4px' }}>
                <span>Genel Toplam (KDV Dahil):</span>
                <span>{total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</span>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer print:hidden flex flex-col-reverse sm:flex-row justify-between items-center gap-3 shrink-0 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="modern-btn ghost w-full sm:w-auto">Kapat</button>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={handleDownloadPDF} className="modern-btn success w-full sm:w-auto justify-center" disabled={downloading}>
              <FiDownload size={18} /> {downloading ? "Hazırlanıyor..." : "PDF Olarak İndir (.pdf)"}
            </button>
            <button onClick={handlePrint} className="modern-btn primary w-full sm:w-auto justify-center">
              <FiPrinter size={18} /> Yazıcıdan Yazdır
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
