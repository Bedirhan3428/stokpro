"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCopy, FiCheck } from "react-icons/fi";

export default function PrivacyPolicy() {
  const [copied, setCopied] = useState(false);

  const policyText = `STOKPRO GİZLİLİK POLİTİKASI VE KVKK AYDINLATMA METNİ

Son Güncelleme Tarihi: 31 Temmuz 2026 (31.07.2026)
Yürürlük Tarihi: 31 Temmuz 2026 (31.07.2026)
Alan Adı / Platform: stokpro.shop
Veri Sorumlusu: StokPro ("Şirket", "Platform", "Biz")
İletişim: destek@stokpro.shop / iletisim@stokpro.shop

1. GENEL BİLGİLENDİRME VE AMAÇ
İşbu Gizlilik Politikası ve Kişisel Verilerin Korunması Aydınlatma Metni; StokPro platformunu (stokpro.shop ve bağlı web/mobil uygulamaları) ziyaret eden, üye olan, yazılım hizmetlerini kullanan gerçek ve tüzel kişilerin ("Kullanıcı", "Veri Sahibi") kişisel verilerinin ve ticari verilerinin 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili sair mevzuata uygun olarak işlenmesini, saklanmasını ve korunmasını sağlamak amacıyla hazırlanmıştır.

StokPro, verilerinizin gizliliğini ve güvenliğini en üst düzeyde tutmayı taahhüt eder. Platformu kullanarak, işbu metinde belirtilen veri toplama, işleme, saklama ve aktarım süreçlerini kabul etmiş sayılırsınız.

2. İŞLENEN VERİ KATEGORİLERİ VE TOPLAMA YÖNTEMLERİ
StokPro, hizmetlerin sunulması, platform performansının artırılması ve yasal yükümlülüklerin yerine getirilmesi amacıyla aşağıdaki veri kategorilerini otomatik veya otomatik olmayan yollarla toplamaktadır:

2.1. Kullanıcı ve Kurumsal Kimlik Verileri: Ad, soyad, T.C. kimlik numarası (veya vergi kimlik numarası), ticari unvan, firma yetkilisi bilgileri. Kayıt esnasında ve profil güncellemelerinde sağlanan e-posta adresi, telefon numarası, adres ve fatura bilgileri.

2.2. Operasyonel ve Ticari İşletme Verileri:
- Envanter ve Stok Kayıtları: Ürün adları, kategoriler, alış/satış fiyatları, stok miktarları, barkod/QR kod verileri, tedarikçi ve depo hareketleri.
- Satış ve İşlem Verileri: Hızlı POS ve satış ekranlarında oluşturulan satış geçmişi, fiş/fatura içerikleri, ödeme yöntemleri ve karlılık verileri.
- Cari ve Müşteri Kayıtları: Kullanıcının kendi müşterilerine ve tedarikçilerine ilişkin tuttuğu isim, iletişim, borç/alacak bakiyesi ve veresiye hareketleri.

2.3. Teknik ve Güvenlik Verileri (Sistem Analitiği): IP adresi, cihaz türü, işletim sistemi, tarayıcı tipi, oturum açma/kapatma zamanları, log (günlük) kayıtları ve hata/çökme raporları. Google OAuth veya Firebase Authentication aracılığıyla sağlanan güvenli kimlik doğrulama belirteçleri (tokens).

3. VERİ İŞLEME AMAÇLARI VE HUKUKİ SEBEPLERİ
Toplanan verileriniz, KVKK’nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları çerçevesinde aşağıdaki amaçlarla işlenmektedir:
- Sözleşmenin İfası: SaaS hizmetlerinin eksiksiz sunulması, stok ve satış takibinin yapılması, cari hesapların yönetilmesi ve entegrasyonların sağlanması.
- Müşteri Destek ve İletişim: Teknik sorunların çözülmesi, abonelik ve ürün anahtarı bildirimlerinin iletilmesi, güvenlik ve güncelleme duyurularının yapılması.
- Analiz, Geliştirme ve Yapay Zeka Öngörüleri: Kullanıcı deneyimini iyileştirmek, sistem performansını optimize etmek, anonimleştirilmiş veri analitiği ile işletme öngörüleri üretmek.
- Yasal Yükümlülükler: Vergi Usul Kanunu, Türk Ticaret Kanunu ve İnternet Ortamında Yapılan Yayınların Düzenlenmesi Hakkında Kanun kapsamındaki saklama ve bilgi verme yükümlülüklerinin ifası.

4. VERİ SORUMLUSU VE VERİ İŞLEYEN AYRIMI (ÇOK KRİTİK)
StokPro kullanımı esnasında verilerin hukuki niteliği iki farklı grupta değerlendirilir:
- StokPro’nun Veri Sorumlusu Olduğu Haller: Kullanıcının (müşterinin) StokPro’ya üye olurken sunduğu ad, e-posta, fatura ve iletişim bilgileri yönünden StokPro Veri Sorumlusu'dur.
- StokPro’nun Veri İşleyen Olduğu Haller: Kullanıcının platforma kaydettiği kendi müşterilerine, personeline veya tedarikçilerine ait kişisel ve ticari veriler yönünden Kullanıcı Veri Sorumlusu, StokPro ise sırf hizmeti sunan altyapı sağlayıcısı sıfatıyla Veri İşleyen konumundadır. Kullanıcı, bu verileri sisteme girerken ilgili kişilerden gerekli KVKK rızalarını aldığını beyan ve taahhüt eder.

5. VERİ GÜVENLİĞİ VE ALTYAPI TEDBİRLERİ
StokPro, verilerinizin yetkisiz erişime, kaybolmaya, kötüye kullanıma veya değiştirilmeye karşı korunması amacıyla dünya standartlarında teknik ve idari tedbirler almaktadır:
- Bulut ve Sunucu Güvenliği: Verileriniz Google Cloud / Firebase yüksek güvenlikli altyapılarında, uçtan uca şifrelenmiş (SSL/TLS protocols) veritabanlarında barındırılır.
- Erişim Kısıtlamaları ve Yetkilendirme: Sistem verilerine erişim yalnızca yetkili kullanıcı hesabı ve şifreleme anahtarları ile mümkündür. Şirket personeli dahil hiçbir üçüncü şahıs müşteri verilerini izinsiz görüntüleyemez veya işleyemez.
- Şifreli Veri Depolama: Parolalar ve hassas doğrulama verileri geri döndürülemez kriptografik hash algoritmaları ile saklanır.

6. VERİLERİN AKTARILMASI VE ÜÇÜNCÜ TARAFLAR
StokPro, kullanıcı verilerini asla üçüncü şahıslara satmaz, kiralamaz veya ticari amaçla pazarlamaz.
Verileriniz yalnızca aşağıdaki durumlarla sınırlı olarak aktarılabilir:
- Altyapı ve Hizmet Sağlayıcılar: Sistem işleyişi için zorunlu olan güvenli sunucu, e-posta gönderim ve entegrasyon hizmet sağlayıcıları (Google Firebase, Vercel, e-Fatura/POS entegrasyon sağlayıcıları).
- Yasal Zorunluluklar: Mahkemeler, emniyet güçleri veya idari makamlar tarafından usulüne uygun olarak talep edilmesi halinde resmi makamlarla.

7. VERİ SAKLAMA, İMHA VE HESAP KAPATMA
- Saklama Süresi: Kişisel verileriniz, üyeliğiniz devam ettiği sürece ve üyelik sona erdikten sonra ilgili mevzuatta öngörülen zamanaşımı ve saklama süreleri (örn. vergi mevzuatı uyarınca 10 yıl) boyunca saklanır.
- Hesap Silme ve İmha: Hesabınızı kapattığınızda veya destek@stokpro.shop adresine veri silme talebinde bulunduğunuzda; yasal saklama zorunluluğu bulunmayan tüm kişisel ve ticari verileriniz sistemlerimizden kalıcı olarak silinir veya anonim hale getirilir.

8. ÇEREZLER (COOKIES) VE ANALİTİK
Platformumuzda kullanıcı deneyimini iyileştirmek ve oturum güvenliğini sağlamak amacıyla zorunlu ve analitik çerezler (cookies) kullanılmaktadır.
- Zorunlu Çerezler: Kullanıcının sisteme güvenli giriş yapması ve oturumunun açık kalması için gereklidir.
- Performans/Analitik Çerezleri: Platformun hangi sayfalarının daha çok kullanıldığını tespit etmek ve teknik hataları yakalamak için anonim veri toplar.
Tarayıcı ayarlarınız üzerinden çerez kullanımını kısıtlayabilir veya engelleyebilirsiniz.

9. KVKK KAPSAMINDAKİ HAKLARINIZ (MADDE 11)
KVKK’nın 11. maddesi uyarınca, veri sahibi olarak aşağıdaki haklara sahipsiniz:
- Kişisel verilerinizin işlenip işlenmediğini öğrenme,
- İşlenmişse buna ilişkin bilgi talep etme,
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,
- Eksik veya yanlış işlenmişse düzeltilmesini isteme,
- KVKK m. 7 çerçevesinde silinmesini veya yok edilmesini isteme,
- Düzeltme, silme ve yok edilme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,
- Otomatik sistemler vasıtasıyla işlenen verilerin aleyhinize bir sonuç doğurmasına itiraz etme,
- Kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme.

10. İLETİŞİM VE BAŞVURU KANALLARI
KVKK kapsamındaki haklarınızı kullanmak, gizlilik politikamızla ilgili soru sormak veya veri silme talebinde bulunmak için bizimle iletişime geçebilirsiniz:
E-posta: destek@stokpro.shop / iletisim@stokpro.shop
Web Sitesi: https://www.stokpro.shop

Talepleriniz, başvurunun bize ulaşmasından itibaren en geç 30 (otuz) gün içerisinde ücretsiz olarak sonuçlandırılacaktır.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(policyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* ÜST ŞERİT */}
      <div className="page-header-bar">
        <Link href="/" className="modern-btn ghost">
          <FiArrowLeft size={16} /> Ana Sayfaya Dön
        </Link>

        <button onClick={copyToClipboard} className="modern-btn secondary">
          {copied ? <><FiCheck size={16} /> Kopyalandı!</> : <><FiCopy size={16} /> Metni Kopyala</>}
        </button>
      </div>

      {/* DÜZ YAZI METİN FORMATI (SADECE CALİBRİ FORMATI) */}
      <div className="prd-card">
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'Calibri, Arial, sans-serif', 
          fontSize: '0.95rem', 
          lineHeight: 1.8, 
          color: 'var(--text-main)', 
          background: 'var(--bg-card)'
        }}>
          {policyText}
        </div>
      </div>

    </div>
  );
}
