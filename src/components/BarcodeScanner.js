import "../styles/BarcodeScanner.css";
import React, { useEffect, useRef, useState } from "react";

export default function BarcodeScanner({ onDetected }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState("");
  const [feedback, setFeedback] = useState("");
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const lastCodeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (window.BarcodeDetector) {
      setSupported(true);
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "qr_code"]
        });
      } catch {
        detectorRef.current = null;
      }
    } else {
      setSupported(false);
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices || !videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      lastCodeRef.current = null;
      tick();
    } catch (err) {
      setFeedback("Kamera açılamadı.");
      setScanning(false);
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  async function tick() {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2 || !scanning) {
      if (scanning) rafRef.current = requestAnimationFrame(tick);
      return;
    }
    try {
      const detections = await detectorRef.current.detect(videoRef.current);
      if (detections && detections.length) {
        const code = detections[0].rawValue;
        if (code && code !== lastCodeRef.current) {
          lastCodeRef.current = code;
          setFeedback(`Bulundu: ${code}`);
          onDetected(code);
          // küçük gecikme ile tekrar taramaya devam et
          setTimeout(() => {
            if (scanning) rafRef.current = requestAnimationFrame(tick);
          }, 350);
          return;
        }
      }
    } catch {
      // ignore
    }
    if (scanning) rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <div className="scanner-kapsul">
      {supported ? (
        <div className="scanner-icerik">
          <div className="scanner-kontrol">
            <button className={`scanner-btn ${scanning ? "kirmizi" : "mavi"}`} onClick={() => (scanning ? stopCamera() : startCamera())}>
              {scanning ? "Taramayı Durdur" : "Kamera ile Tara"}
            </button>
            <div className="scanner-not">Kamera destekliyorsa barkod otomatik algılanır.</div>
          </div>

          <div className="scanner-video">
            <video ref={videoRef} className="scanner-goruntu" />
          </div>
          {feedback && <div className="scanner-geri">{feedback}</div>}
        </div>
      ) : (
        <div className="scanner-manuel">
          <div className="scanner-not">Tarayıcı barkod API'sini desteklemiyor. Manuel girin.</div>
          <div className="scanner-manuel-satir">
            <input
              placeholder="Barkod girin"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="scanner-input"
            />
            <button
              className="scanner-btn mavi"
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