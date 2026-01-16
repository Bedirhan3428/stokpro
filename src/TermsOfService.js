import "./styles/Legal.css";
import React from "react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="legal-kapsul">
      <div className="legal-icerik">
        <Link to="/" className="legal-geri-btn">← Ana Sayfaya Dön</Link>
        <h1 className="legal-baslik">Kullanım ve Hizmet Şartları</h1>
        <span className="legal-tarih">Son Güncelleme: 16 Ocak 2026</span>
        <div className="legal-bolum">
          <h2 className="legal-altbaslik">1. Genel Bakış</h2>
          <p className="legal-metin">StokPro, işletmenizin dijital dönüşümünü hızlandırmak için tasarlanmış profesyonel bir envanter yönetim aracıdır.</p>
        </div>
        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. Kullanım Lisansı</h2>
          <p className="legal-metin">Sistemin bütünlüğünü korumak adına; yazılım mimarisini kopyalamak veya tersine mühendislik uygulamak yasaktır.</p>
        </div>
        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. Sorumluluk Sınırı</h2>
          <p className="legal-metin">StokPro "mevcut haliyle" sunulmakta olup, ticari kar/zarar durumları kullanıcının yönetim stratejisine bağlıdır.</p>
        </div>
        <div className="legal-bolum">
          <h2 className="legal-altbaslik">4. İletişim</h2>
          <p className="legal-metin">Sorularınız için: <a href="mailto:iletisim@stokpro.shop" className="legal-link">iletisim@stokpro.shop</a></p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
