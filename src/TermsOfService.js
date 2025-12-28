import "../styles/Legal.css";
import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="legal-kapsul">
      <div className="legal-icerik">
        <Link to="/" className="legal-geri-btn">← Ana Sayfaya Dön</Link>

        <h1 className="legal-baslik">Hizmet Şartları</h1>
        <span className="legal-tarih">Son Güncelleme: 29 Aralık 2025</span>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">1. Kabul</h2>
          <p className="legal-metin">
            StokPro uygulamasını indirerek, kurarak veya kullanarak bu Hizmet Şartlarını ("Şartlar") kabul etmiş olursunuz. 
            Eğer bu şartları kabul etmiyorsanız, lütfen uygulamayı kullanmayın.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. Kullanım Lisansı</h2>
          <p className="legal-metin">
            StokPro, size uygulamayı kişisel veya ticari işletmeniz için kullanmanız üzere, devredilemez ve münhasır olmayan bir lisans verir.
            Ancak şunları yapamazsınız:
          </p>
          <ul className="legal-liste">
            <li>Uygulamanın kaynak kodunu değiştirmek, kopyalamak veya tersine mühendislik yapmak.</li>
            <li>Uygulamayı yasa dışı amaçlar için kullanmak.</li>
            <li>Sistemin güvenliğini veya bütünlüğünü tehlikeye atacak girişimlerde bulunmak.</li>
          </ul>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. Hesap Güvenliği</h2>
          <p className="legal-metin">
            Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmamalısınız. 
            Hesabınızla yapılan tüm işlemlerden siz sorumlu tutulursunuz.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">4. Sorumluluk Reddi</h2>
          <p className="legal-metin">
            StokPro, "olduğu gibi" sunulmaktadır. Yazılımın hatasız olacağını veya kesintisiz çalışacağını garanti etmeyiz. 
            Veri kaybı veya ticari kayıplar konusunda StokPro sorumlu tutulamaz. Verilerinizi düzenli yedeklemeniz önerilir.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">5. Değişiklikler</h2>
          <p className="legal-metin">
            Bu şartları zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda sizi bilgilendirmeye çalışacağız. 
            Değişikliklerden sonra uygulamayı kullanmaya devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">6. İletişim</h2>
          <p className="legal-metin">
            Hizmet şartları hakkında sorularınız için:
            <br />
            <a href="mailto:iletisim@stokpro.shop" className="legal-link">iletisim@stokpro.shop</a>
          </p>
        </div>
      </div>
    </div>
  );
}

