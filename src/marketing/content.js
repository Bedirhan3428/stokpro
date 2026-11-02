// Tanıtım sayfalarının içeriği. Buradaki her özellik StokPro Masaüstü'nde bulunmalıdır;
// kanıtlanmamış iddia, sahte puan veya kullanıcı sayısı eklemeyin.
export const SITE_URL = "https://stokpro.com.tr";
export const SITE_NAME = "StokPro";
export const OG_IMAGES = [{ url: "/og-stokpro.png", width: 1200, height: 630, alt: "StokPro: Stok takip ve ön muhasebe programı" }];
export const LAST_UPDATED = "2026-11-02";
export const SETUP_URL = "/downloads/StokPro-Setup.exe";
export const FULL_SETUP_URL = "/downloads/StokPro-POS-Full-Setup.exe";

export const NAV_LINKS = [
  { href: "/stok-takip-programi", label: "Stok Takibi" },
  { href: "/on-muhasebe-programi", label: "Ön Muhasebe" },
  { href: "/barkodlu-satis-programi", label: "Barkodlu Satış" },
  { href: "/cari-hesap-takip-programi", label: "Cari Hesap" },
  { href: "/market-programi", label: "Market" },
];

export const SCREENS = {
  stok: { src: "/ekran/stok.webp", alt: "StokPro stok ve ürün listesi: kritik stok, depo maliyeti ve barkodlu ürünler" },
  satis: { src: "/ekran/satis.webp", alt: "StokPro hızlı satış ekranı: barkod alanı, satış kalemleri, nakit ve kart butonları" },
  cari: { src: "/ekran/cari.webp", alt: "StokPro cari hesap ekranı: müşteri alacakları, tedarikçi borçları ve bakiyeler" },
  fatura: { src: "/ekran/fatura.webp", alt: "StokPro alış ve satış faturaları listesi: KDV matrahı, KDV tutarı ve genel toplam" },
  kasa: { src: "/ekran/kasa.webp", alt: "StokPro kasa ve gider ekranı: nakit, banka ve POS hesap bakiyeleri" },
  rapor: { src: "/ekran/rapor.webp", alt: "StokPro finansal raporlar: satış, gider, net kâr ve KDV özeti" },
};

export const HOME_FAQ = [
  {
    q: "StokPro nedir?",
    a: "StokPro; küçük ve orta ölçekli işletmeler için Windows'ta çalışan stok takip, barkodlu satış, cari hesap, fatura, kasa ve ön muhasebe programıdır.",
  },
  {
    q: "StokPro ücretsiz mi?",
    a: "Evet, StokPro 2028'e kadar ücretsizdir. Masaüstü programını ücretsiz indirip hemen kullanmaya başlayabilirsiniz.",
  },
  {
    q: "Hangi işletmeler kullanabilir?",
    a: "Market, bakkal, mağaza, kırtasiye, hırdavat ve toptan satış gibi ürün satan işletmeler stoklarını, satışlarını ve müşteri hesaplarını StokPro ile takip edebilir.",
  },
  {
    q: "Mali müşavirimin yerine geçer mi?",
    a: "Hayır. StokPro bir ön muhasebe programıdır: günlük alış, satış, kasa ve cari kayıtlarınızı düzenler. Resmi defter ve beyanname işleri için mali müşavirinizle çalışmaya devam etmelisiniz.",
  },
  {
    q: "Mac veya telefonda çalışır mı?",
    a: "StokPro Masaüstü şu anda yalnızca Windows bilgisayarlar için sunuluyor.",
  },
];

export const LANDING_PAGES = {
  "stok-takip-programi": {
    title: "Stok Takip Programı | Barkodlu Stok ve Depo Yönetimi",
    description:
      "StokPro stok takip programı ile hangi üründen kaç adet kaldığını görün, kritik stok uyarısı alın, depolar arası transfer yapın ve ürünleri Excel'den aktarın.",
    label: "Stok Takibi",
    h1: "Stok Takip Programı",
    lead: "Hangi üründen kaç adet kaldığını tahmin etmeyin, ekranda görün. StokPro ürünlerinizi, stok adetlerinizi ve depo maliyetinizi tek listede toplar.",
    screen: "stok",
    featuresTitle: "Stok takibinde neler yapabilirsiniz?",
    features: [
      { t: "Barkodlu ürün kartları", d: "Ürünü barkod, stok kodu, kategori, birim, KDV oranı, alış ve satış fiyatıyla kaydedin." },
      { t: "Kritik stok uyarısı", d: "Her ürüne en düşük stok seviyesi verin. Seviyenin altına düşen ürünler listede kırmızı işaretlenir ve özet kartında sayılır." },
      { t: "Toplu ürün girişi", d: "Çok sayıda ürünü tek tek yazmak yerine toplu giriş veya Excel aktarımı kullanın." },
      { t: "Depo ve transfer", d: "Birden fazla depo çalışıyorsanız depoları tanımlayın, ürünleri depolar arasında transfer edin." },
      { t: "Stok sayımı", d: "Ürün satırından sayım yaparak program ile raftaki adeti eşitleyin." },
      { t: "Barkod etiketi", d: "Ürünleriniz için etiket yazıcısından barkod etiketi basın." },
    ],
    stepsTitle: "Stok takibine nasıl başlanır?",
    steps: [
      "StokPro'yu Windows bilgisayarınıza kurun ve hesabınızla giriş yapın.",
      "Ürünlerinizi tek tek, toplu olarak veya Excel'den ekleyin.",
      "Satış ve alış faturaları girdikçe stoklarınızı listeden takip edin.",
    ],
    faq: [
      { q: "Stok takip programı ne işe yarar?", a: "Elinizdeki ürünlerin adedini, maliyetini ve azalan ürünleri tek ekranda gösterir. Böylece defter veya Excel'de elle takip etmeniz gerekmez ve eksik ürünü zamanında fark edersiniz." },
      { q: "Mevcut ürün listemi aktarabilir miyim?", a: "Evet. StokPro'da Excel üzerinden ürün aktarımı ve toplu stok girişi bulunur." },
      { q: "Barkod okuyucu gerekir mi?", a: "Zorunlu değildir; ürünü adından veya kodundan da bulabilirsiniz. Barkod okuyucu kullanırsanız işlemler hızlanır." },
      { q: "Birden fazla depoyu takip edebilir miyim?", a: "Evet. Çoklu depo özelliğini açarak depoları tanımlayabilir ve depolar arasında ürün transferi yapabilirsiniz." },
    ],
  },
  "on-muhasebe-programi": {
    title: "Ön Muhasebe Programı | Fatura, Kasa ve Cari Takibi",
    description:
      "StokPro ön muhasebe programı ile alış ve satış faturalarını, kasa, banka ve POS hesaplarını, giderleri, KDV özetini ve net kârınızı tek yerden takip edin.",
    label: "Ön Muhasebe",
    h1: "Ön Muhasebe Programı",
    lead: "Alış, satış, gider ve tahsilatlarınız farklı defterlerde kalmasın. StokPro işletmenizin günlük muhasebe kayıtlarını düzenler, tablonuzu tek ekranda gösterir.",
    screen: "rapor",
    featuresTitle: "Ön muhasebede neler yapabilirsiniz?",
    features: [
      { t: "Alış ve satış faturaları", d: "Faturaları cari, depo ve KDV bilgileriyle kaydedin, listeden arayın ve yazdırın." },
      { t: "Kasa, banka ve POS", d: "Nakit kasa, banka ve POS hesaplarınızı tanımlayın, toplam bakiyenizi tek ekranda izleyin." },
      { t: "Gider takibi", d: "Kira, personel, elektrik ve kargo gibi masrafları kategorilere ayırarak kaydedin." },
      { t: "Net kâr raporu", d: "Satış hasılatı, alış maliyeti ve giderlerden oluşan dönem kârınızı görün." },
      { t: "KDV özeti", d: "Hesaplanan ve indirilecek KDV toplamlarını dönem özeti olarak takip edin." },
      { t: "Yazdırma ve PDF", d: "Mali raporlarınızı yazdırın veya PDF olarak kaydedin, mali müşavirinizle paylaşın." },
    ],
    stepsTitle: "Ön muhasebeye nasıl başlanır?",
    steps: [
      "Kasa, banka ve POS hesaplarınızı tanımlayın.",
      "Müşteri ve tedarikçilerinizi cari kart olarak ekleyin.",
      "Fatura ve giderlerinizi girin, raporlardan dönemi inceleyin.",
    ],
    faq: [
      { q: "Ön muhasebe programı nedir?", a: "İşletmenin alış, satış, tahsilat, ödeme ve gider gibi günlük ticari kayıtlarını tutan programdır. Resmi defterler ve beyannameler ise mali müşavirin kullandığı genel muhasebe tarafında hazırlanır." },
      { q: "Muhasebe programı yerine StokPro kullanabilir miyim?", a: "Günlük ticari takibiniz için evet. Ancak StokPro resmi defter ve beyanname programı değildir; bu işler için mali müşavirinizle çalışmaya devam edin." },
      { q: "e-Fatura kesebilir miyim?", a: "Programda e-Arşiv ve UBL-TR ayarları ile faturadan XML çıktısı alma seçeneği bulunur. Resmi e-belge gönderimi için kendi entegratör ve mali mükellefiyet durumunuzu kontrol etmeniz gerekir." },
      { q: "KDV hesabını program yapar mı?", a: "Evet. Fatura ve satışlardaki KDV ürün oranına göre hesaplanır, raporlarda dönem özeti olarak görünür." },
    ],
  },
  "barkodlu-satis-programi": {
    title: "Barkodlu Satış Programı | Hızlı Kasa ve Fiş Yazdırma",
    description:
      "StokPro barkodlu satış programıyla ürünü okutun, toplamı anında görün, nakit, kart veya veresiye satış yapın. Termal fiş yazıcı ve klavye kısayolu desteği.",
    label: "Barkodlu Satış",
    h1: "Barkodlu Satış Programı",
    lead: "Barkodu okutun, ürün sepete düşsün, toplam kendiliğinden hesaplansın. Kasada sıra bekletmeden nakit, kart veya veresiye satış yapın.",
    screen: "satis",
    featuresTitle: "Kasada neler yapabilirsiniz?",
    features: [
      { t: "Barkodla hızlı satış", d: "Barkod okuyucuyla ürünü sepete ekleyin veya barkodu olmayan ürünü adından bulun." },
      { t: "Otomatik toplam ve KDV", d: "Ara toplam, iskonto, KDV hariç tutar ve ödenecek tutar satış sırasında güncellenir." },
      { t: "Klavye kısayolları", d: "F8 ile nakit, F9 ile kart, F2 ile adet, F3 ile iskonto: fareye dokunmadan satış yapın." },
      { t: "Veresiye satış", d: "Satışı müşteri seçerek cari hesaba işleyin, borç müşterinin ekstresinde görünsün." },
      { t: "Termal fiş yazıcı", d: "ESC/POS termal yazıcıdan fiş basın, fişinizi logo ve iletişim bilgilerinizle düzenleyin." },
      { t: "Müşteri ekranı", d: "İkinci ekranda müşteriye sepeti ve kampanya görsellerinizi gösterin." },
    ],
    stepsTitle: "Satışa nasıl başlanır?",
    steps: [
      "Barkod okuyucunuzu bilgisayara takın ve ürünlerinizi tanımlayın.",
      "F5 ile Hızlı Satış ekranını açıp ürünleri okutun.",
      "F8 ile nakit veya F9 ile kart tahsilatını tamamlayın.",
    ],
    faq: [
      { q: "Hangi barkod okuyucu çalışır?", a: "Bilgisayara klavye gibi bağlanan USB (HID) barkod okuyucular barkodu doğrudan satış ekranına iletir." },
      { q: "Fiş yazıcı gerekli mi?", a: "Hayır. Satışı yazıcı olmadan da kaydedebilirsiniz. Fiş basmak isterseniz ESC/POS destekli bir termal yazıcı kullanabilirsiniz." },
      { q: "Barkodu olmayan ürünü satabilir miyim?", a: "Evet. Elle satış modunda ürünü adından veya kodundan arayıp sepete ekleyebilirsiniz." },
      { q: "Veresiye satış yapılır mı?", a: "Evet. Müşteri seçerek satışı cari hesaba işleyebilir, tahsilatı sonradan kaydedebilirsiniz." },
    ],
  },
  "cari-hesap-takip-programi": {
    title: "Cari Hesap Takip Programı | Müşteri ve Tedarikçi Borçları",
    description:
      "StokPro cari hesap takip programıyla müşteri alacaklarını ve tedarikçi borçlarını görün, tahsilat ve ödeme kaydedin, hesap ekstresi yazdırın.",
    label: "Cari Hesap",
    h1: "Cari Hesap Takip Programı",
    lead: "Kim size ne kadar borçlu, siz kime ne kadar ödeyeceksiniz? Müşteri ve tedarikçi hesaplarınızı defter karıştırmadan tek listede görün.",
    screen: "cari",
    featuresTitle: "Cari takipte neler yapabilirsiniz?",
    features: [
      { t: "Müşteri ve tedarikçi kartları", d: "Ünvan, telefon, vergi dairesi, vergi numarası ve kredi limitiyle cari kart açın." },
      { t: "Anlık bakiye", d: "Toplam müşteri alacağınızı, tedarikçi borcunuzu ve net durumunuzu özet kartlarda görün." },
      { t: "Tahsilat ve ödeme", d: "Müşteriden aldığınız parayı ve tedarikçiye yaptığınız ödemeyi cari hesaba işleyin." },
      { t: "Hesap ekstresi", d: "Bir carinin tüm hareketlerini ekstre olarak görün ve yazdırın." },
      { t: "Veresiye bağlantısı", d: "Kasadan yapılan veresiye satışları müşterinin hesabına işleyin." },
      { t: "Hızlı arama", d: "Cariyi ünvan, kod, telefon veya vergi numarasıyla bulun, müşteri ve tedarikçi olarak filtreleyin." },
    ],
    stepsTitle: "Cari takibine nasıl başlanır?",
    steps: [
      "Müşteri ve tedarikçilerinizi cari kart olarak ekleyin.",
      "Fatura, veresiye satış, tahsilat ve ödemeleri kaydedin.",
      "Bakiyeleri listeden izleyin, gerektiğinde ekstre yazdırın.",
    ],
    faq: [
      { q: "Cari hesap nedir?", a: "İşletmenin müşteri ve tedarikçileriyle olan borç ve alacak hareketlerinin tutulduğu hesaptır." },
      { q: "Hesap ekstresi alabilir miyim?", a: "Evet. Her cari için hesap hareketlerini görüntüleyip yazdırabilirsiniz." },
      { q: "Müşteri ve tedarikçiyi ayrı görebilir miyim?", a: "Evet. Cari listesini müşteriler ve tedarikçiler olarak filtreleyebilirsiniz." },
      { q: "Veresiye defterinin yerine geçer mi?", a: "Evet. Veresiye satışları ve tahsilatları müşteri bazında kaydederek güncel borcu ekranda görebilirsiniz." },
    ],
  },
  "market-programi": {
    title: "Market Programı | Bakkal ve Market İçin Barkodlu Satış",
    description:
      "Market ve bakkallar için StokPro: barkodla hızlı kasa, azalan ürün uyarısı, veresiye defteri, kasa takibi ve termal fiş yazıcı desteği tek programda.",
    label: "Market",
    h1: "Market ve Bakkal Programı",
    lead: "Marketin yoğun temposuna uygun: ürünü okutun, parayı alın, azalan ürünü görün, veresiyeyi deftere değil programa yazın.",
    screen: "satis",
    featuresTitle: "Marketinizde günlük işler",
    features: [
      { t: "Sıra bekletmeyen kasa", d: "Barkod okuyucu ve F tuşlarıyla satışı klavyeden tamamlayın." },
      { t: "Azalan ürünleri görün", d: "En düşük stok seviyesinin altına inen ürünleri sipariş vermeden önce listeden kontrol edin." },
      { t: "Veresiye defteri", d: "Mahalle müşterilerinizin borcunu, tahsilatını ve hesap dökümünü programda tutun." },
      { t: "Toptancı hesapları", d: "Alış faturalarını ve toptancıya yaptığınız ödemeleri tedarikçi carisine işleyin." },
      { t: "Kasa ve giderler", d: "Nakit, banka ve POS bakiyenizi, kira ve elektrik gibi giderlerinizi takip edin." },
      { t: "Kâr durumu", d: "Dönem satışınızı, alışınızı, giderinizi ve net kârınızı raporlardan görün." },
    ],
    stepsTitle: "Marketinizde nasıl başlarsınız?",
    steps: [
      "Programı kasadaki Windows bilgisayara kurun, barkod okuyucuyu takın.",
      "Ürünlerinizi Excel'den veya toplu girişle ekleyin, fiş bilgilerinizi düzenleyin.",
      "F5 ile kasayı açın ve satışa başlayın.",
    ],
    faq: [
      { q: "Market için hangi donanım gerekir?", a: "Windows bilgisayar yeterlidir. Barkod okuyucu ve termal fiş yazıcı işleri hızlandırır, para çekmecesi ve ikinci müşteri ekranı da kullanılabilir." },
      { q: "Çok sayıda ürünü nasıl eklerim?", a: "Excel aktarımı ve toplu stok girişi ile ürünleri tek tek yazmadan ekleyebilirsiniz." },
      { q: "Bakkal için de uygun mu?", a: "Evet. Barkodlu satış, veresiye ve stok takibi küçük işletmelerde de aynı şekilde kullanılır." },
      { q: "İnternet kesilirse ne olur?", a: "Veriler bilgisayarınızdaki yerel veritabanında tutulduğu için kasada çalışmaya devam edersiniz. İlk giriş ve bulut senkronizasyonu için internet gerekir." },
    ],
  },
};
