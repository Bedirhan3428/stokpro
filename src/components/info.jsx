import "../styles/Info.css";
import React from "react";

export default function Info() {
  return (
    <div className="info-kapsul" aria-live="polite">
      <div className="info-icerik">
        <small className="info-detay">
          <p className="info-yazi">© 2025 StokPro Tüm hakları saklıdır.</p>
          <span className="info-surum">Sürüm 1.8.3</span>
        </small>
        <a className="info-geri" href="mailto:stokproresmi@gmail.com">Geri Bildirim</a>
      </div>
    </div>
  );
}