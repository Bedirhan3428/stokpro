import "../styles/NotFound.css";
import React from "react";

export default function NotFound() {
  return (
    <div className="nf-kapsul" role="main" aria-labelledby="nf-title">
      <h2 id="nf-title" className="nf-baslik">Sayfa bulunamadı</h2>
      <p className="nf-alt">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
    </div>
  );
}