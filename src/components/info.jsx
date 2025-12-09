import "../styles/global.css";
import "../styles/Info.css";
import React from "react";

export default function Info() {
  return (
    <div className="page-info" aria-live="polite">
      <div className="info-body">
        <small className="info-small">
          <p className="info-copy">© 2025 StokPro Tüm hakları saklıdır.</p>
          <span className="info-version">Version 1.5.2</span>
        </small>
        <a className="info-feedback" href="mailto:stokproresmi@gmail.com">Geri Bildirim</a>
      </div>
    </div>
  );
}