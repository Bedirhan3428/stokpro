<div align="center">
  <h1>📦 StokPro</h1>
  <p><strong>Gelişmiş Stok, Satış ve Ön Muhasebe Yönetim Sistemi</strong></p>
</div>

---

StokPro, modern işletmeler için tasarlanmış, bulut tabanlı (Firebase), barkod okuyucu entegrasyonuna sahip, kapsamlı bir stok takip ve ön muhasebe uygulamasıdır. React ile geliştirilmiş olup, PWA (Progressive Web App) desteği sayesinde hem masaüstü hem de mobil cihazlarda uygulama gibi çalışabilir.

## ✨ Temel Özellikler

- **🔐 Güvenli Kimlik Doğrulama:** E-posta/Şifre girişi, şifre sıfırlama ve e-posta doğrulama (Firebase Auth).
- **🛒 Ürün ve Stok Yönetimi:** Ürün ekleme, düzenleme, silme, kritik stok uyarıları ve kategori bazlı yönetim.
- **📷 Entegre Barkod Okuyucu:** Kamera üzerinden veya cihazdaki barkod okuyucularla hızlı ürün arama ve satış (`BarcodeScanner.js`).
- **💰 Satış ve Kasa Noktası (POS):** Hızlı ve pratik satış ekranı, anlık stok düşümü.
- **👥 Müşteri Yönetimi (CRM):** Müşteri kaydı, cari hesap ve borç/alacak takibi.
- **📊 Ön Muhasebe & Raporlama:** Gelir-gider takibi, gelişmiş grafiksel raporlar ve istatistikler (`AdvancedReport.js`, `Accounting.js`).
- **👑 Rol Tabanlı Erişim:** Normal kullanıcı ve Yönetici (Admin) panelleri (`AdminDashboard.js`).
- **🔑 Abonelik/Lisans Sistemi:** Ürün anahtarı (ProductKey) ile hesap ve abonelik süresi yönetimi.
- **🎨 Özelleştirilebilir Tema:** Karanlık (Dark) ve Aydınlık (Light) tema desteği (`theme.js`).
- **📱 PWA Desteği:** Çevrimdışı çalışabilme ve tarayıcıdan cihaza uygulama olarak yüklenebilme (`manifest.json`, `service-worker.js`).
- **🔔 Gelişmiş Bildirimler:** Başarılı işlem, hata veya stok uyarıları için entegre bildirim sistemi (`notificationHelper.js`).

---

## 🛠 Kullanılan Teknolojiler

### Frontend
- **Kullanıcı Arayüzü:** `React.js`
- **Rotalama:** `React Router DOM`
- **Veri Görselleştirme:** `Chart.js` / `Recharts`
- **Tasarım:** `CSS3` (Özel modüler tasarımlar)

### Backend & Servisler
- **Kimlik Doğrulama:** `Firebase Authentication`
- **Veritabanı:** `Firebase Cloud Firestore` (Gerçek zamanlı NoSQL veritabanı)
- **Barındırma:** `Vercel` (Uygulama barındırma / Hosting)

---

## 🚀 Kurulum ve Başlangıç

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Ön Koşullar
- Bilgisayarınızda Node.js (v14 veya üzeri) yüklü olmalıdır.
- Bir Firebase hesabı ve oluşturulmuş bir proje.

### 2. Projeyi Klonlayın
```bash
git clone https://github.com/Bedirhan3428/stokpro.git
cd stokpro
```

### 3. Bağımlılıkları Yükleyin
```bash
npm install
# veya
yarn install
```

### 4. Çevre Değişkenlerini (Environment Variables) Ayarlayın
Proje dizininde (root) bir `.env` dosyası oluşturun (veya `.env.example` dosyasını kopyalayın) ve Firebase yapılandırma bilgilerinizi girin:

```env
REACT_APP_FIREBASE_API_KEY=senin_api_anahtarin
REACT_APP_FIREBASE_AUTH_DOMAIN=senin_projen.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=senin_proje_id
REACT_APP_FIREBASE_STORAGE_BUCKET=senin_projen.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=senin_sender_id
REACT_APP_FIREBASE_APP_ID=senin_app_id
```

### 5. Uygulamayı Başlatın
```bash
npm start
# veya
yarn start
```
*Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışmaya başlayacaktır.*

---

## 📁 Proje Klasör Yapısı

```text
stokpro/
├── public/                 # PWA dosyaları, logolar, manifest ve sesler (beep.wav)
├── src/
│   ├── components/         # Arayüz bileşenleri (Dashboard, Sales, Products vb.)
│   ├── contexts/           # React Context yapıları (AuthContext)
│   ├── hooks/              # Özel React Hook'ları (useSubscription)
│   ├── styles/             # Bileşenlere özel CSS dosyaları
│   ├── utils/              # Yardımcı fonksiyonlar (Firebase config, api, chartSetup)
│   ├── App.js              # Ana uygulama rotaları ve sarmalayıcı
│   ├── firebase.js         # Firebase başlatma ve konfigürasyon ayarları
│   └── index.js            # React DOM render noktası
├── .env                    # Ortam değişkenleri (Git'e eklenmez)
├── package.json            # Proje bağımlılıkları ve scriptler
└── vercel.json             # Vercel deployment konfigürasyonu
```

---

## ☁️ Yayına Alma (Deployment)

Bu proje Vercel üzerinde yayınlanmak üzere konfigüre edilmiştir (`vercel.json` içerir).

1. Vercel dashboard'una gidin.
2. GitHub deponuzu bağlayın.
3. Vercel proje ayarlarından **Environment Variables (Çevre Değişkenleri)** kısmına `.env` dosyanızdaki Firebase anahtarlarını ekleyin.
4. **Deploy** butonuna tıklayın.

---

## 📄 Lisans ve Kullanım Şartları

Uygulamanın kullanım koşulları, gizlilik politikası ve abonelik sistemleriyle ilgili yasal metinler uygulama içerisinde mevcuttur.
- **Gizlilik Politikası:** `PrivacyPolicy.js`
- **Kullanım Şartları:** `TermsOfService.js` / `TermsModal.js`

---

## 🤝 Katkıda Bulunma

Bu proje özel bir işletme projesi olduğundan dolayı dışarıdan pull request (PR) kabul edilmemektedir. Geliştirme ekibi için kod standartları aşağıda belirtilmiştir:
- Her yeni özellik için ayrı bir branch (örn: `feature/barkod-guncelleme`) açılmalıdır.
- Commit mesajları anlaşılır ve yapılan değişikliği özetler nitelikte olmalıdır.

---
**Geliştirici:** Bedirhan İmer | **Proje Versiyonu:** 1.0.0
