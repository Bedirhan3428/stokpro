import "./styles/Legal.css";
import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="legal-kapsul">
      <div className="legal-icerik">
        <Link to="/" className="legal-geri-btn">← Ana Sayfaya Dön</Link>
        <h1 className="legal-baslik">Gizlilik ve Veri Güvenliği</h1>
        <span className="legal-tarih">Son Güncelleme: 16 Ocak 2026</span>
        <div className="legal-bolum">
          <h2 className="legal-altbaslik">1. Veri Gizliliği</h2>
          <p className="legal-metin">Verileriniz asla üçüncü şahıslara satılmaz ve sadece sizin erişiminize açık tutulur.</p>
        </div>
        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. Altyapı</h2>
          <p className="legal-metin">Verileriniz Google Firebase altyapısında yüksek güvenlikli sunucularda saklanmaktadır.</p>
        </div>
        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. İletişim</h2>
          <p className="legal-metin">Talepleriniz için: <a href="mailto:destek@stokpro.shop" className="legal-link">destek@stokpro.shop</a></p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
