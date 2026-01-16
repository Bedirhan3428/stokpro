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
            Uygulamaya erişim sağlayarak veya kullanarak, bu şartların sizin için bağlayıcı olduğunu kabul etmiş sayılırsınız.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">2. Profesyonel Kullanım Lisansı</h2>
          <p className="legal-metin">
            StokPro, size ticari operasyonlarınızı optimize etmeniz amacıyla sınırlı ve devredilemez bir kullanım hakkı sunar. 
            Sistemin bütünlüğünü korumak adına; yazılım mimarisini kopyalamak, tersine mühendislik uygulamak veya platformu 
            etik dışı/yasa dışı faaliyetler için kullanmak kesinlikle yasaktır.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">3. Hesap Güvenliği ve Mesuliyet</h2>
          <p className="legal-metin">
            Verilerinizin gizliliği bizim önceliğimiz olsa da, giriş bilgilerinizin (e-posta/şifre) muhafazası tamamen 
            kullanıcı sorumluluğundadır. Hesabınız üzerinden gerçekleştirilen tüm finansal kayıtlar ve işlemler, 
            hesap sahibi tarafından yapılmış kabul edilir.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">4. Hizmet Sürekliliği ve Sorumluluk Sınırı</h2>
          <p className="legal-metin">
            StokPro, %99.9 erişilebilirlik hedefiyle çalışmaktadır. Ancak; teknik güncellemeler, mücbir sebepler veya 
            altyapı kaynaklı kesintilerden doğabilecek veri gecikmelerinden StokPro doğrudan sorumlu tutulamaz. 
            Yazılım "mevcut haliyle" sunulmakta olup, ticari kar/zarar durumları tamamen kullanıcının yönetim stratejisine bağlıdır.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">5. Güncelleme ve Bildirimler</h2>
          <p className="legal-metin">
            İşletme ihtiyaçlarına göre şartlarımızı modernize edebiliriz. Platformu kullanmaya devam etmeniz, 
            güncel şartları onayladığınız anlamına gelir.
          </p>
        </div>

        <div className="legal-bolum">
          <h2 className="legal-altbaslik">6. Profesyonel Destek</h2>
          <p className="legal-metin">
            Kurumsal sorularınız ve hukuki danışma için:
            <br />
            <a href="mailto:iletisim@stokpro.shop" className="legal-link">iletisim@stokpro.shop</a>
          </p>
        </div>
      </div>
    </div>
  );
}
