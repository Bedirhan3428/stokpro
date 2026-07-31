"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCopy, FiCheck } from "react-icons/fi";

export default function TermsOfService() {
  const [copied, setCopied] = useState(false);

  const contractText = `STOKPRO HİZMET ŞARTLARI VE KULLANIM KOŞULLARI SÖZLEŞMESİ

Son Güncelleme Tarihi: 31 Temmuz 2026 (31.07.2026)
Yürürlük Tarihi: 31 Temmuz 2026 (31.07.2026)
Alan Adı / Platform: stokpro.shop
İletişim: iletisim@stokpro.shop

1. GENEL HÜKÜMLER VE TARAFLAR
İşbu Hizmet Şartları ve Kullanım Koşulları Sözleşmesi ("Sözleşme"), StokPro ("Platform", "Şirket", "Biz") ile stokpro.shop alan adı ve bağlı alt alan adları veya mobil/web uygulamaları üzerinden sunulan hizmetlere erişen, üye olan veya kullanan gerçek ya da tüzel kişiler ("Kullanıcı", "Müşteri", "Siz") arasında akdedilmiştir.

Platforma erişim sağlamanız, üyelik oluşturmanız veya hizmetleri kullanmanız, işbu Sözleşme’de yer alan tüm şartları okuduğunuzu, anladığınızı ve bu şartlarla gayrikabili rücu bağlı olduğunuzu kabul, beyan ve taahhüt ettiğiniz anlamına gelir. Sözleşme şartlarını kabul etmiyorsanız, Platformu ve sunulan hizmetleri kullanmamanız gerekmektedir.

2. HİZMETİN KAPSAMI VE SUNULAN MODÜLLER
StokPro, işletmelerin dijital operasyonlarını yönetmelerini sağlayan bulut tabanlı bir Hizmet Olarak Yazılım (SaaS) platformudur. StokPro tarafından sunulan ve ileride sunulabilecek hizmetlerin kapsamı aşağıdakileri içerir ancak bunlarla sınırlı değildir:

- Envanter ve Stok Yönetimi: Ürün ekleme, stok takibi, kritik stok uyarıları, barkod/QR kod sistemleri, depo ve şube bazlı envanter hareketleri.
- Satış ve Hızlı POS Sistemleri: Barkodlu/kartsız hızlı satış ekranları, sepet yönetimi, dijital fiş/fatura oluşturma ve satış geçmişi raporlaması.
- Müşteri ve Tedarikçi Yönetimi (CRM & Cari): Cari hesap takibi, veresiye ve borç/alacak bakiyesi yönetimi, müşteri/tedarikçi iletişim verilerinin işlenmesi.
- Finans ve Ön Muhasebe: Gelir-gider takibi, kasa/banka hareketleri, karlılık analizleri ve finansal durum raporları.
- Analiz, Raporlama ve Yapay Zeka (AI) Öngörüleri: İşletme verilerine dayalı otomatik veri analitiği, talep tahminleri, grafiksel ve istatistiki raporlamalar.
- API ve Entegrasyonlar: E-ticaret, pazar yeri, ödeme kuruluşları ve üçüncü taraf yazılımlarla veri senkronizasyonu entegrasyonları.

StokPro, platforma yeni modüller ekleme, mevcut modülleri değiştirme, güncelleme veya tek taraflı olarak kaldırma hakkını saklı tutar.

3. LİSANS, ÜYELİK VE HESAP GÜVENLİĞİ
3.1. Kullanım Lisansı: İşbu Sözleşme uyarınca Kullanıcıya; StokPro hizmetlerini işletmesinin dahili ticari operasyonlarında kullanması amacıyla münhasır olmayan, devredilemeyen, alt lisans verilemeyen ve kısıtlı bir kullanım lisansı verilmektedir.
3.2. Hesap Oluşturma ve Doğruluk: Kullanıcı, üyelik esnasında sunduğu tüm bilgilerin (ticari unvan, e-posta, vergi numarası, yetkili bilgisi vb.) doğru, güncel ve eksiksiz olduğunu beyan eder. Yalan veya yanıltıcı bilgi verilmesi sebebiyle doğabilecek tüm hukuki ve cezai sorumluluk Kullanıcıya aittir.
3.3. Hesap Güvenliği: Kullanıcı adı, şifre ve API anahtarları gibi erişim bilgilerinin güvenliği tamamen Kullanıcının sorumluluğundadır. Hesabınız üzerinden gerçekleştirilen tüm işlemler yetkili Kullanıcı tarafından yapılmış sayılır. Yetkisiz erişim şüphesi durumunda Kullanıcı derhal iletisim@stokpro.shop adresine bildirimde bulunmakla yükümlüdür.

4. KULLANIM KURALLARI VE YASAKLANAN FAALİYETLER
Kullanıcı, StokPro platformunu kullanırken aşağıdaki eylemleri gerçekleştirmeyeceğini kabul ve taahhüt eder:
- Tersine Mühendislik ve Kopyalama: Yazılım mimarisini, kaynak kodlarını, algoritmasını veya veritabanı yapısını kopyalamak, parçalamak, tersine mühendislik uygulamak veya benzer bir yazılım üretmek.
- Yasadışı Faaliyetler: Platformu yasadışı, kaçak, taklit veya mevzuata aykırı ürün/hizmetlerin ticaretini, takibini veya satışını yapmak amacıyla kullanmak.
- Sistem Güvenliğini İhlal: Hizmet Engelleme (DoS/DDoS) saldırıları düzenlemek, sisteme virüs, trojan veya zararlı kod bulaştırmak, sistemin performansını bozacak aşırı yüklenmeler yaratmak.
- Veri Madenciliği ve Scraping: Yetkisiz botlar, örümcekler veya otomatik araçlar kullanarak platformdan veri çekmek veya sistem açıklarını taramak.
- Kötüye Kullanım ve Başkası Adına Kullanım: Lisans haklarını üçüncü şahıslara kiralamak, satmak veya yetkisiz erişim imkanı sağlamak.

Bu kuralların ihlali durumunda StokPro, Kullanıcının hesabını askıya alma veya kalıcı olarak kapatma hakkına sahiptir. Ayrıca, doğabilecek zararlar için yasal yollara başvurma hakkı saklıdır.

5. ÖDEME, ABONELİK VE İADE KOŞULLARI
- Abonelik Modeli: StokPro hizmetleri; aylık, yıllık veya dönemsel paket abonelikleri ya da ürün anahtarı (product key) modeli ile sunulabilir.
- Fiyat Değişiklikleri: StokPro, paket fiyatlarını ve hizmet ücretlerini dilediği zaman güncelleme hakkına sahiptir. Fiyat değişiklikleri yeni abonelik dönemlerinde geçerli olur.
- Gecikmiş Ödemeler: Ödeme zamanında yapılmadığı takdirde StokPro, Kullanıcının sisteme erişimini ve veri girişini kısıtlama veya hesabı dondurma hakkını haizdir.
- İade Politikası: SaaS (yazılım) hizmetlerinin anında ifa edilen dijital hizmet kapsamında olması sebebiyle, ödenen abonelik ücretlerinde aksi yazılı olarak belirtilmedikçe iade yapılmaz.

6. HİZMET SEVİYESİ (SLA), KESİNTİLER VE BAKIM
- Erişilebilirlik: StokPro, sistemin 7/24 kesintisiz çalışması için gerekli teknik altyapı tedbirlerini alır. Ancak %100 kesintisiz çalışma garantisi (SLA) verilmemektedir.
- Planlı ve Plansız Bakım: Sistem geliştirmeleri, sunucu güncellemeleri veya güvenlik yamaları sebebiyle önceden bildirilerek veya acil durumlarda bildirilmeksizin geçici hizmet kesintileri yaşanabilir.
- Üçüncü Taraf Altyapı: İnternet servis sağlayıcıları, bulut sunucu sağlayıcıları (AWS, Google Cloud, Firebase vb.) veya entegrasyon sağlanan sistemlerin (POS, banka, e-ticaret altyapıları) çökmesi veya aksamasından StokPro sorumlu tutulamaz.

7. VERİ MÜLKiYETİ, YEDEKLEME VE KVKK (GİZLİLİK)
7.1. Veri Mülkiyeti: Kullanıcının sisteme yüklediği ürün, stok, cari, müşteri, fatura ve finansal verilerin tüm mülkiyeti Kullanıcıya aittir. StokPro, bu verileri yalnızca hizmetin ifası, sistemin geliştirilmesi ve anonimleştirilmiş istatistiki analizler için işler.
7.2. Veri Yedekleme Sorumluluğu: StokPro düzenli olarak sistem yedekleri almaktadır. Ancak, Kullanıcı kendi ticari verilerinin (stok, satış, cari kayıtlar vb.) yasal saklama sürelerine uygun olarak periyodik yedeklerini (Excel/CSV çıktısı vb.) almakla bizzat yükümlüdür. Veri kaybından doğabilecek doğrudan veya dolaylı ticari zararlardan StokPro sorumlu tutulamaz.
7.3. Kişisel Verilerin Korunması (KVKK): Kullanıcı, sisteme kaydettiği kendi müşterilerine veya personeline ait kişisel verilerin Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuata uygun olarak toplandığını, rızalarının alındığını kabul eder. Kullanıcı, bu veriler yönünden "Veri Sorumlusu", StokPro ise "Veri İşleyen" konumundadır.

8. SORUMLULUĞUN SINIRLANDIRILMASI (LIMITATION OF LIABILITY)
YASAL UYARI: Mevzuatın izin verdiği azami ölçüde;
- Dolaylı Zararlar: StokPro; kar kaybı, veri kaybı, itibar kaybı, iş durması, yanlış stok sayımından veya yanlış muhasebe/fatura kaydından doğan dolaylı, arızi, özel veya cezai zararlardan hiçbir koşulda sorumlu tutulamaz.
- Kullanıcı Hataları: Kullanıcının veya personelinin sisteme yanlış ürün miktarı, hatalı fiyat veya eksik cari girmesi sonucu oluşan ticari zararlardan tamamen Kullanıcı sorumludur.
- Azami Sorumluluk Sınırı: StokPro’nun işbu Sözleşme kapsamındaki her türlü iddia, zarar veya talebe karşı toplam mali sorumluluğu, olayın gerçekleştiği tarihten önceki son 3 (üç) ay içinde Kullanıcının StokPro’ya ödediği toplam abonelik ücreti ile sınırlıdır.

9. SÖZLEŞMENİN FESHİ VE HESABIN DONDURULMASI
- Kullanıcı Tarafından Fesih: Kullanıcı, dilediği zaman aboneliğini iptal ederek veya hesabını kapatarak Sözleşmeyi feshedebilir. İptal durumunda ödenmiş ücretlerin iadesi yapılmaz.
- StokPro Tarafından Fesih: Kullanıcının Sözleşme şartlarını ihlal etmesi, ödemeleri aksatması, yasadışı faaliyetlerde bulunması veya platformun güvenliğini tehdit etmesi durumunda StokPro, herhangi bir tazminat yükümlülüğü olmaksızın hesabı derhal dondurabilir veya feshedebilir.
- Hesap Kapatma Sonrası Veriler: Hesabı kapatılan veya aboneliği biten Kullanıcının verileri, yasal saklama süreleri hariç olmak üzere sistemden belirli bir süre sonra silinebilir veya anonimleştirilebilir.

10. FİKRİ MÜLKIYET HAKLARI
stokpro.shop alan adı, StokPro markası, logosu, yazılım kodları, arayüz tasarımları, veritabanı mimarisi, grafikleri, görselleri ve dokümantasyonları üzerindeki tüm telif, marka ve fikri mülkiyet hakları münhasıran StokPro’ya aittir. İşbu Sözleşme Kullanıcıya bu unsurlar üzerinde lisans hakkı dışında hiçbir mülkiyet hakkı devretmez.

11. MÜCBİR SEBEPLER (FORCE MAJEURE)
Deprem, yangın, doğal afetler, savaş, terör eylemleri, siber saldırılar, genel internet/altyapı kesintileri, hükümet kısıtlamaları veya yasal düzenleme değişiklikleri gibi tarafların kontrolü dışında gelişen mücbir sebep hallerinde, StokPro yükümlülüklerini yerine getirememekten veya geciktirmekten dolayı sorumlu tutulamaz.

12. DEĞİŞİKLİKLER VE BİLDİRİMLER
StokPro, işbu Sözleşme şartlarını, gizlilik politikasını veya hizmet koşullarını dilediği zaman modernize etme veya değiştirme hakkını saklı tutar. Güncellenmiş şartlar stokpro.shop üzerinde yayınlandığı andan itibaren yürürlüğe girer. Değişiklik sonrasında platformu kullanmaya devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.

13. UYGULANACAK HUKUK VE YETKİLİ MAHKEME
İşbu Sözleşme’nin uygulanmasında, yorumlanmasında ve Sözleşme’den doğabilecek tüm uyuşmazlıkların çözümünde Türkiye Cumhuriyeti Kanunları uygulanacaktır. Uyuşmazlıkların çözümünde İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.

14. İLETİŞİM BİLGİLERİ
Hizmet şartları, yasal talepleriniz veya kurumsal sorularınız için bizimle aşağıdaki kanallardan iletişime geçebilirsiniz:
E-posta: iletisim@stokpro.shop
Web Sitesi: https://www.stokpro.shop

StokPro platformunu kullanarak yukarıdaki şartları kabul etmiş sayılırsınız.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* ÜST GİZLİLİK VE NAVİGASYON ŞERİDİ */}
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
          {contractText}
        </div>
      </div>

    </div>
  );
}
