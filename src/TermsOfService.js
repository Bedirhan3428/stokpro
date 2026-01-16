import "./styles/Legal.css";
import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="legal-kapsul">
      <div className="legal-icerik">
        <Link to="/" className="legal-geri-btn">← Ana Sayfaya Dön</Link>

        <h1 className="legal-baslik">Kullanım ve Hizmet Şartları</h1>
        <span className="legal-tarih">Son Güncelleme: 16 Ocak 2026</span>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">1. Genel Bakış</h2>
          <p className="legal-metin">
            StokPro, işletmenizin dijital dönüşümünü hızlandırmak için tasarlanmış profesyonel bir envanter yönetim aracıdır. 
            Platformu kullanarak bu şartların sizin için bağlayıcı olduğunu kabul etmiş sayılırsınız.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. Profesyonel Kullanım Lisansı</h2>
          <p className="legal-metin">
            StokPro, ticari operasyonlarınızı optimize etmeniz amacıyla sınırlı bir kullanım hakkı sunar. 
            Şunlar kesinlikle yasaktır:
          </p>
          <ul className="legal-liste">
            <li>Yazılım mimarisini kopyalamak veya tersine mühendislik uygulamak.</li>
            <li>Platformu yasa dışı ticari faaliyetler için kullanmak.</li>
            <li>Sistem güvenliğini tehlikeye atacak girişimlerde bulunmak.</li>
          </ul>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. Hesap Güvenliği</h2>
          <p className="legal-metin">
            Giriş bilgilerinizin muhafazası tamamen kullanıcı sorumluluğundadır. 
            Hesabınız üzerinden gerçekleştirilen tüm işlemlerden hesap sahibi sorumlu tutulur.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">4. Sorumluluk Sınırı</h2>
          <p className="legal-metin">
            StokPro, yüksek erişilebilirlik hedefiyle sunulmaktadır. Ancak altyapı kaynaklı kesintilerden 
            doğabilecek gecikmelerden StokPro sorumlu tutulamaz. Verilerinizi düzenli kontrol etmeniz önerilir.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">5. Değişiklikler</h2>
          <p className="legal-metin">
            İşletme ihtiyaçlarına göre şartlarımızı modernize edebiliriz. Kullanıma devam etmeniz, 
            yeni şartları kabul ettiğiniz anlamına gelir.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">6. İletişim</h2>
          <p className="legal-metin">
            Kurumsal sorularınız için:
            <br />
            <a href="mailto:iletisim@stokpro.shop" className="legal-link">iletisim@stokpro.shop</a>
          </p>
        </div>
      </div>
    </div>
  );
}
