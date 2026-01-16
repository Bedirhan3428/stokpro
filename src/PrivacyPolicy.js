import "./styles/Legal.css";
import React from "react";
import { Link } from "react-router-dom";

function PrivacyPolicy() {
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
            Verileriniz asla üçüncü şahıslara satılmaz, reklam amaçlı paylaşılmaz ve sadece sizin erişiminize açık tutulur.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. İşlenen Veri Kategorileri</h2>
          <ul className="legal-liste">
            <li><strong>Kurumsal Kimlik:</strong> Kayıt aşamasında alınan e-posta adresi (Güvenli kimlik doğrulama için).</li>
            <li><strong>Operasyonel Veriler:</strong> Girdiğiniz ürün listeleri, stok miktarları ve satış trendleri (Senkronizasyon için).</li>
            <li><strong>Müşteri Kayıtları:</strong> Müşteri bakiye ve işlem geçmişleri (Muhasebe döngüsü için).</li>
          </ul>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. Veri Güvenliği Altyapısı</h2>
          <p className="legal-metin">
            StokPro, dünya standartlarında güvenlik sunan <strong>Google Firebase</strong> altyapısını kullanır. 
            Verileriniz, endüstri standardı olan AES-256 şifreleme yöntemleri ile korunmakta ve Google'ın yüksek güvenlikli 
            veri merkezlerinde saklanmaktadır.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">4. Kullanıcı Hakları</h2>
          <p className="legal-metin">
            Kullanıcılar, sistem üzerindeki tüm verilerini diledikleri zaman güncelleme veya silme hakkına sahiptir. 
            Hesabınızı silmeniz durumunda, tüm ticari verileriniz kalıcı olarak imha edilir.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">5. İletişim Kanalları</h2>
          <p className="legal-metin">
            Veri gizliliği ile ilgili talepleriniz için uzman ekibimize ulaşın:
            <br />
            <a href="mailto:destek@stokpro.shop" className="legal-link">destek@stokpro.shop</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
