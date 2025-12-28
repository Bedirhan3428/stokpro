import "../styles/Legal.css";
import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="legal-kapsul">
      <div className="legal-icerik">
        <Link to="/" className="legal-geri-btn">← Ana Sayfaya Dön</Link>
        
        <h1 className="legal-baslik">Gizlilik Politikası</h1>
        <span className="legal-tarih">Son Güncelleme: 29 Aralık 2025</span>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">1. Giriş</h2>
          <p className="legal-metin">
            StokPro ("biz", "bizim" veya "uygulama") olarak gizliliğinize önem veriyoruz. 
            Bu Gizlilik Politikası, StokPro uygulamasını kullandığınızda bilgilerinizin nasıl toplandığını, 
            kullanıldığını ve paylaşıldığını açıklar.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. Toplanan Bilgiler</h2>
          <p className="legal-metin">Uygulamayı kullanırken aşağıdaki bilgileri toplayabiliriz:</p>
          <ul className="legal-liste">
            <li><strong>Hesap Bilgileri:</strong> Kayıt olurken sağladığınız e-posta adresi ve şifre (şifrelenmiş olarak).</li>
            <li><strong>Kullanıcı İçeriği:</strong> Stok yönetimi için girdiğiniz ürün bilgileri, satış kayıtları, müşteri verileri ve finansal kayıtlar.</li>
            <li><strong>Kullanım Verileri:</strong> Uygulama performansını iyileştirmek için anonimleştirilmiş kullanım istatistikleri.</li>
          </ul>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. Bilgilerin Kullanımı</h2>
          <p className="legal-metin">
            Topladığımız bilgileri şu amaçlarla kullanırız:
          </p>
          <ul className="legal-liste">
            <li>Hizmetlerimizi sağlamak ve sürdürmek.</li>
            <li>Stok ve satış verilerinizi güvenli bir şekilde saklamak ve senkronize etmek.</li>
            <li>Hesabınızla ilgili önemli bildirimleri göndermek.</li>
            <li>Hataları tespit etmek ve teknik sorunları gidermek.</li>
          </ul>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">4. Üçüncü Taraf Hizmetler</h2>
          <p className="legal-metin">
            Uygulamamız altyapı ve kimlik doğrulama hizmetleri için <strong>Google Firebase</strong> kullanmaktadır. 
            Verileriniz Firebase sunucularında güvenli bir şekilde saklanmaktadır.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">5. İletişim</h2>
          <p className="legal-metin">
            Bu Gizlilik Politikası hakkında sorularınız varsa, lütfen bizimle iletişime geçin:
            <br />
            <a href="mailto:destek@stokpro.shop" className="legal-link">destek@stokpro.shop</a>
          </p>
        </div>
      </div>
    </div>
  );
}

