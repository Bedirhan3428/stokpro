import "../styles/BarcodeScanner.css";
import React, { useEffect, useRef, useState } from "react";
// @zxing/library kütüphanesini import ediyoruz
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from "@zxing/library";

// Zxing'in desteklediği formatlar
const DECODER_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE,
];

export default function BarcodeScanner({ onDetected }) {
  const [destekli, setDestekli] = useState(false);
  const [tarama, setTarama] = useState(false);
  const [manuel, setManuel] = useState("");
  const [izinHatasi, setIzinHatasi] = useState("");

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const manualStop = useRef(false);
  const restartTimer = useRef(null);
  const lastCodeRef = useRef({ code: null, ts: 0 });

  useEffect(() => {
    setDestekli(typeof navigator !== "undefined" && !!navigator.mediaDevices);
    
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, DECODER_FORMATS);
    codeReaderRef.current = new BrowserMultiFormatReader(hints);

    return () => stopZxing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearTimers() {
    if (restartTimer.current) {
      clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
  }

  function stopZxing(fullStop = true) {
    clearTimers();
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      console.log("Zxing tarayıcı durduruldu.");
    }
    if (fullStop) setTarama(false);
  }

  function onZxingDetected(code) {
    if (manualStop.current) return;
    
    const now = Date.now();
    // Aynı kodu çok hızlı tekrar okumayı engelle (spam koruması)
    if (lastCodeRef.current.code === code && now - lastCodeRef.current.ts < 1000) return;
    lastCodeRef.current = { code, ts: now };

    // Üst bileşene kodu gönder ve sonucu al
    const basarili = onDetected?.(code);

    if (basarili) {
      // SADECE ürün sepete eklendiyse kamerayı durdur ve 1 sn bekle
      stopZxing(false);
      restartTimer.current = setTimeout(() => {
        if (!manualStop.current) startZxing();
      }, 1000);
    } else {
      console.log("Ürün bulunamadı, tarama devam ediyor...");
    }
  }

  async function startZxing() {
    if (!destekli || tarama) return;
    
    manualStop.current = false;
    setTarama(true);
    setIzinHatasi("");

    try {
      if (!videoRef.current) throw new Error("Video elementi bulunamadı.");
      
      await codeReaderRef.current.decodeFromVideoDevice(
        null, 
        videoRef.current, 
        (result, err) => {
          if (result) {
            onZxingDetected(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Zxing tarama hatası:", err);
            // Kritik olmayan hatalarda durdurmuyoruz
          }
        }
      );
      console.log("Zxing tarama başlatıldı.");
    } catch (err) {
      console.error("Zxing başlatma hatası", err);
      setIzinHatasi(err?.message || "Kamera başlatılamadı.");
      setTarama(false);
    }
  }

  function toggleScan() {
    if (tarama) {
      manualStop.current = true;
      stopZxing(true);
    } else {
      startZxing();
    }
  }

  return (
    <div className="page-barcode-scanner">
      {destekli ? (
        <div>
          <div className="scanner-controls">
            <button className="btn btn-ghost" onClick={toggleScan}>
              {tarama ? "Taramayı Durdur" : "Kamera ile tara"}
            </button>
            <small className="scanner-note">
              Ürün bulununca 1 sn duraklar. Bulunamazsa taramaya devam eder.
            </small>
          </div>
          {izinHatasi && <div className="scanner-error" role="alert">{izinHatasi}</div>}

          {/* Kamera önizlemesi yalnızca tarama açıkken yer kaplar */}
          <div className="video-wrap" style={{ display: tarama ? "block" : "none" }}>
            <video ref={videoRef} className="video-preview" />
            {tarama && <div className="scanner-focus-area"></div>}
          </div>
        </div>
      ) : (
        <div className="manual-wrap">
          <div className="manual-note">Tarayıcı kamera API'sini desteklemiyor. Manuel giriniz.</div>
          <div className="manual-entry">
            <input
              placeholder="Barkod girin"
              value={manuel}
              onChange={(e) => setManuel(e.target.value)}
              className="manual-input"
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                const code = (manuel || "").trim();
                if (code) onDetected?.(code);
                setManuel("");
              }}
            >
              Ekle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}