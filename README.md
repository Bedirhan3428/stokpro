<div align="center">
  <h1>📦 StokPro</h1>
  <p><strong>Next.js 16 (App Router) & Firebase Tabanlı Gelişmiş Stok, POS Satış ve Ön Muhasebe Otomasyonu</strong></p>
</div>

---

StokPro, modern işletmeler için tasarlanmış, bulut tabanlı (Firebase Cloud Firestore), 0ms gecikmesiz akıllı yerel belleğe (`Master Data Cache` / `LocalStorage`), entegre barkod okuyucuya ve profesyonel E-Fatura / PDF yazdırma motoruna sahip kapsamlı bir stok takip ve ön muhasebe otomasyonudur. 

Proje **Next.js 16 (Turbopack & App Router)** mimarisine taşınmış olup %100 SEO uyumlu ve yüksek performanslıdır.

---

## ✨ Temel Özellikler

- **⚡ 0ms Optimistic UI & LocalStorage Motoru:** Veri değişiklikleri (satış, stok, borç/alacak) ağ beklenmeden anında 0ms hızında yerel belleğe ve `LocalStorage` deposuna yazılır.
- **🔄 Arka Plan Gecikmeli Senkronizasyon:** Veri işlemleri 0ms'de ekranda görünür; arka planda Firebase ve Master JSON dokümanı sessizce senkronize edilir.
- **📄 Profesyonel Fatura & PDF Sistemi (`InvoiceModal.js`):** Fatura yazdırma, PDF indirme, özel logo gösterimi, dinamik Fatura Öneki (örn: `GIB2026`) ve ayarlanabilir KDV Oranları (%0, %1, %10, %20).
- **🖨️ İzole Yazıcı Çıktı Desteği (`@media print`):** Yazıcıdan "Yazdır" dendiğinde arka plan ögeleri otomatik gizlenir, sadece saf beyaz zeminli net fatura çıktısı alınır.
- **📊 4 İnteraktif Finansal KPI Kartı & Hover Menü:** Dashboard üzerinde Ciro, Gider, Net Kâr/Zarar ve Kasa/Banka dengesi anında hesaplanır ve hover popup menüleri ile detay sunar.
- **🛒 POS Hızlı Satış Ekranı (`Sales.js`):** Barkod tarama, arama, veresiye müşteri seçimi, sepet ve anında eksiye düşmeyen güvenli stok düşümü.
- **📦 Stok ve Ürün Yönetimi (`Products.js`):** Hızlı inline stok artırma/azaltma stepper'ı (`QtyStepper`), resim yükleme, toplu ürün ekleme (CSV/Excel) ve gelişmiş filtreleme ribbon barı.
- **👥 Müşteri ve Cari Yönetimi (`Customers.js`):** Veresiye alacak/borç takibi, tahsilat alma, telefon formatlama ve dinamik müşteri arama.
- **📑 Muhasebe ve Günlük Finans (`Accounting.js`):** Günlük bazda gruplanmış kasa hareketleri, ek gelir/gider kaydı ve detaylı finansal filtreleme.
- **🤖 Yaplı Zeka (AI Now Brief) Widget'ı:** İşletmeniz için hızlı ve akıllı satış/stok analiz tavsiyeleri.
- **🎨 Dinamik Tema ve Kurumsal Ayarlar:** Aydınlık/Karanlık mod desteği, firma logosu yükleme, adres ve vergi bilgileri yapılandırması.

---

## 🛠 Kullanılan Teknolojiler

### Frontend & Çatı
- **Framework:** `Next.js 16` (App Router, Turbopack, React 19)
- **Stil & CSS:** Tailwind CSS v3 & Single Master Global CSS (`src/styles/global.css`)
- **İkon Seti:** `React Icons` (Feather Icons)
- **PDF Oluşturucu:** `html2pdf.js` & `html2canvas`

### Backend & Veritabanı
- **Kimlik Doğrulama:** `Firebase Authentication`
- **Veritabanı:** `Firebase Cloud Firestore` (NoSQL & Sync Meta)
- **Önbellek & Cache:** Universal LocalStorage & Memory Store Engine (`masterDataCache.js`)

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Ön Koşullar
- Bilgisayarınızda Node.js (v18.0 veya üzeri) yüklü olmalıdır.

### 2. Projeyi Klonlayın
```bash
git clone https://github.com/Bedirhan3428/stokpro.git
cd stokpro
```

### 3. Bağımlılıkları Yükleyin
```bash
npm install
```

### 4. Çevre Değişkenlerini (Environment Variables) Ayarlayın
Dizin kökünde bir `.env` dosyası oluşturun ve Firebase konfigürasyonunuzu ekleyin:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=senin_api_anahtarin
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=senin_projen.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=senin_proje_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=senin_projen.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=senin_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=senin_app_id
```

### 5. Geliştirici Sunucusunu Başlatın
```bash
npm run dev
```
*Uygulama `http://localhost:3000` adresinde Turbopack hızıyla çalışmaya başlayacaktır.*

---

## 🏗️ Production Build (Canlıya Alma)

Üretim sürümünü derlemek ve statik/dinamik sayfaları doğrulamak için:

```bash
npm run build
npm run start
```

---

## 📁 Proje Klasör Yapısı

```text
stokpro/
├── app/                    # Next.js 16 App Router Sayfaları ve Rotaları
│   ├── accounting/         # Muhasebe & Kasa Hareketleri
│   ├── customers/          # Müşteri & Cari Takibi
│   ├── dashboard/          # Finansal Özet & KPI Kartları
│   ├── products/           # Stok & Ürün Yönetimi
│   ├── sales/              # POS Satış Ekranı
│   ├── settings/           # Firma, Logo, KDV & Fatura Ayarları
│   └── layout.js           # Ana HTML Kapsayıcı & SEO Meta Tanımları
├── public/                 # Statik görseller, logolar ve ikonlar
├── src/
│   ├── components/         # Modüler React Bileşenleri (InvoiceModal, Toast vb.)
│   ├── styles/             # Master Global CSS (`global.css`)
│   └── utils/              # Firebase Yardımcıları ve Master Data Cache Engine
├── .env                    # Çevre Değişkenleri
├── next.config.mjs         # Next.js Konfigürasyonu
└── package.json            # Proje Bağımlılıkları ve Scriptler
```

---

## 📄 Lisans ve Kullanım Şartları

Uygulama şartları ve sözleşmeler sistem içerisinden görüntülenebilir:
- **Gizlilik Politikası:** `/privacy-policy`
- **Kullanım Şartları:** `/terms-of-service`

---
**Geliştirici:** Bedirhan İmer | **Proje Versiyonu:** 2.0.0 (Next.js 16 Edition)
