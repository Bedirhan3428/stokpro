import "../styles/global.css";
import "../styles/BarcodeScanner.css";

import React, { useEffect, useRef, useState } from "react";

/**
 * Improved BarcodeScanner
 *
 * Fixes / improvements:
 * - Only show "camera" UI when a BarcodeDetector instance is actually created.
 * - Add playsInline and muted to the <video> element for better mobile behavior.
 * - Add basic debounce / duplicate-suppression so the same code isn't repeatedly reported.
 * - Stop camera after a successful detection to avoid multiple calls and to give caller a single clear event.
 * - Add console.debug logging to help debug if detection doesn't happen.
 * - Ensure video.play() awaited so readyState checks are more reliable.
 */
export default function BarcodeScanner({ onDetected }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const lastDetectedRef = useRef({ code: null, time: 0 });
  const [manual, setManual] = useState("");

  useEffect(() => {
    // Feature-detect and try to create a detector.
    if (window.BarcodeDetector) {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "qr_code"],
        });
        setSupported(true);
        console.debug("BarcodeDetector created with formats:", detectorRef.current);
      } catch (err) {
        // If constructor fails (some browsers might throw when unsupported formats are requested),
        // treat as not supported to avoid showing camera controls that won't detect.
        console.warn("BarcodeDetector constructor failed:", err);
        detectorRef.current = null;
        setSupported(false);
      }
    } else {
      console.debug("window.BarcodeDetector is not available");
      setSupported(false);
    }

    return () => stopCamera();
    // eslint-disable-next-line
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices || !videoRef.current) {
      console.warn("No mediaDevices or video element");
      return;
    }
    if (!detectorRef.current) {
      console.warn("No BarcodeDetector instance available");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      // Useful on iOS to allow inline playback
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      await videoRef.current.play();
      setScanning(true);
      console.debug("Camera started");
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
    console.debug("Camera stopped");
  }

  async function tick() {
    // Ensure we have a detector and video ready and scanning active
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2 || !scanning) {
      if (scanning) requestAnimationFrame(tick);
      return;
    }

    try {
      const detections = await detectorRef.current.detect(videoRef.current);
      if (detections && detections.length) {
        const code = detections[0].rawValue;
        console.debug("Barcode detected:", code, detections[0]);
        if (code) {
          const now = Date.now();
          const last = lastDetectedRef.current;
          // debounce duplicates: ignore same code within 3 sec
          if (code === last.code && now - last.time < 3000) {
            console.debug("Duplicate detection ignored:", code);
          } else {
            lastDetectedRef.current = { code, time: now };
            // Stop the camera to avoid repeated detections and to let parent handle adding to cart
            stopCamera();
            try {
              // Call the parent callback
              onDetected(code);
            } catch (err) {
              console.error("onDetected callback threw:", err);
            }
          }
        }
      }
    } catch (err) {
      // Don't spam the console with repeated errors; log once
      console.warn("Barcode detection error (ignored):", err);
    }

    if (scanning) requestAnimationFrame(tick);
  }

  return (
    <div className="page-barcode-scanner">
      {supported ? (
        <div>
          <div className="scanner-controls">
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (scanning) stopCamera();
                else startCamera();
              }}
            >
              {scanning ? "Taramayı Durdur" : "Kamera ile tara"}
            </button>
            <small className="scanner-note">Tarayıcı destekliyorsa kameradan otomatik barkod algılanır.</small>
          </div>

          <div className="video-wrap">
            {/* playsInline and muted help on iOS/Android */}
            <video ref={videoRef} className="video-preview" playsInline muted />
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
                if (manual.trim()) {
                  try {
                    onDetected(manual.trim());
                  } catch (err) {
                    console.error("onDetected callback threw:", err);
                  }
                }
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
