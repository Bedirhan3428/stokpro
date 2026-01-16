import "./styles/Legal.css";
import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="legal-kapsul">
      <div className="legal-icerik">
        <Link to="/" className="legal-geri-btn">← Ana Sayfaya Dön</Link>

        <h1 className="legal-baslik">Gizlilik ve Veri Güvenliği</h1>
        <span className="legal-tarih">Son Güncelleme: 16 Ocak 2026</span>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">1. Veri Gizliliği Taahhüdü</h2>
          <p className="legal-metin">
            StokPro olarak, işletme verilerinizin sizin en değerli varlığınız olduğunun bilincindeyiz. 
            Verileriniz asla üçüncü şahıslara satılmaz ve sadece sizin erişiminize açık tutulur.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. İşlenen Bilgiler</h2>
          <p className="legal-metin">Uygulamayı kullanırken aşağıdaki veriler işlenmektedir:</p>
          <ul className="legal-liste">
            <li><strong>Kurumsal Kimlik:</strong> Kayıt aşamasında kullanılan e-posta adresi.</li>
            <li><strong>Operasyonel Veriler:</strong> Girdiğiniz ürün listeleri, stok miktarları ve satış kayıtları.</li>
            <li><strong>Müşteri Kayıtları:</strong> Ticari döngü için tutulan müşteri bakiye bilgileri.</li>
          </ul>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. Veri Kullanımı</h2>
          <p className="legal-metin">
            Topladığımız bilgileri şu amaçlarla kullanırız:
          </p>
          <ul className="legal-liste">
            <li>Hizmetlerimizi sürdürmek ve senkronizasyon sağlamak.</li>
            <li>Hesabınızla ilgili kritik bildirimleri iletmek.</li>
            <li>Teknik sorunları gidermek ve performansı artırmak.</li>
          </ul>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">4. Altyapı Güvenliği</h2>
          <p className="legal-metin">
            Verileriniz dünya standartlarında güvenlik sunan <strong>Google Firebase</strong> altyapısında, 
            yüksek şifreleme yöntemleri ile korunmaktadır.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">5. İletişim</h2>
          <p className="legal-metin">
            Gizlilik talepleriniz için uzman ekibimize ulaşın:
            <br />
            <a href="mailto:destek@stokpro.shop" className="legal-link">destek@stokpro.shop</a>
          </p>
        </div>
      </div>
    </div>
  );
}
