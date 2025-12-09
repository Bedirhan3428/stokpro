import "../styles/global.css";
import "../styles/BarcodeScanner.css";

import React, { useEffect, useRef, useState } from "react";

export default function BarcodeScanner({ onDetected }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (window.BarcodeDetector) {
      setSupported(true);
      try {
        detectorRef.current = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "qr_code"] });
      } catch {
        detectorRef.current = null;
      }
    } else {
      setSupported(false);
    }
    return () => stopCamera();
    // eslint-disable-next-line
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices || !videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setScanning(true);
      requestAnimationFrame(tick);
    } catch (err) {
      console.warn("Kamera açılamadı:", err);
      setScanning(false);
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  async function tick() {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2 || !scanning) {
      if (scanning) requestAnimationFrame(tick);
      return;
    }
    try {
      const detections = await detectorRef.current.detect(videoRef.current);
      if (detections && detections.length) {
        const code = detections[0].rawValue;
        if (code) onDetected(code);
      }
    } catch (err) { /* ignore detection errors */ }
    if (scanning) requestAnimationFrame(tick);
  }

  return (
    <div className="page-barcode-scanner">
      {supported ? (
        <div>
          <div className="scanner-controls">
            <button className="btn btn-ghost" onClick={() => (scanning ? stopCamera() : startCamera())}>
              {scanning ? "Taramayı Durdur" : "Kamera ile tara"}
            </button>
            <small className="scanner-note">Tarayıcı destekliyorsa kameradan otomatik barkod algılanır.</small>
          </div>

          <div className="video-wrap">
            <video ref={videoRef} className="video-preview" />
          </div>
        </div>
      ) : (
        <div className="manual-wrap">
          <div className="manual-note">Tarayıcı barkod API'sini desteklemiyor. Manuel giriniz.</div>
          <div className="manual-entry">
            <input
              placeholder="Barkod girin"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="manual-input"
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                if (manual.trim()) onDetected(manual.trim());
                setManual("");
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
