import { FULL_SETUP_URL, OG_IMAGES, SITE_NAME } from "../../src/marketing/content";
import { DownloadButton, Faq, JsonLd, MarketingFooter, RelatedLinks, breadcrumbSchema, faqSchema } from "../../src/marketing/ui";

const title = "StokPro İndir | Windows Stok ve Ön Muhasebe Programı";
const description =
  "StokPro Masaüstü'nü Windows bilgisayarınıza ücretsiz indirin. Kurulum adımları, gereksinimler ve Windows güvenlik uyarısında yapılacaklar.";

export const metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/indir" },
  openGraph: { title, description, url: "/indir", siteName: SITE_NAME, locale: "tr_TR", type: "website", images: OG_IMAGES },
  twitter: { card: "summary_large_image", title, description, images: ["/og-stokpro.png"] },
};

const FAQ = [
  {
    q: "Windows \"bilinmeyen yayıncı\" uyarısı verirse ne yapmalıyım?",
    a: "Kurulum dosyası henüz kod imzalı olmadığı için Windows bu uyarıyı gösterebilir. Dosyayı yalnızca stokpro.com.tr adresinden indirdiyseniz \"Ek bilgi\" ve ardından \"Yine de çalıştır\" seçeneğiyle devam edebilirsiniz.",
  },
  {
    q: "Tam kurulum ile çevrimiçi yükleyici arasındaki fark nedir?",
    a: "Çevrimiçi yükleyici küçüktür ve güncel sürümü internetten indirip kurar. Tam kurulum ise programın kendisini içerir.",
  },
  {
    q: "Program kendini güncelliyor mu?",
    a: "Evet. Sistem ayarlarından yeni sürüm olup olmadığını denetleyip güncellemeyi programın içinden kurabilirsiniz.",
  },
];

export default function DownloadPage() {
  return (
    <div className="bg-sp-canvas text-sp-obsidian dark:bg-sp-deep dark:text-sp-canvas">
      <JsonLd data={faqSchema(FAQ)} />
      <JsonLd data={breadcrumbSchema("İndir", "/indir")} />
      <section className="mx-auto max-w-3xl px-5 pb-10 pt-14 text-center">
        <h1 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">StokPro'yu indirin</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-sp-graphite dark:text-zinc-300">
          Stok, satış, cari, fatura ve kasa işleriniz için Windows programı. 2028'e kadar ücretsiz: indirin, hesabınızla giriş yapın, ürünlerinizi eklemeye başlayın.
        </p>
        <div className="mt-7"><DownloadButton label="Çevrimiçi Yükleyiciyi İndir" /></div>
        <p className="mt-4 text-sm text-sp-graphite dark:text-zinc-400">
          Çevrimiçi yükleyici çalışmazsa{" "}
          <a href={FULL_SETUP_URL} download className="font-semibold text-sp-caramel underline">tam kurulum dosyasını indirin</a>.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10">
        <h2 className="text-3xl font-extrabold tracking-tight">Kurulum üç adımda</h2>
        <ol className="mt-6 space-y-5">
          {[
            "Kurulum dosyasını indirip çalıştırın.",
            "Program açılınca \"Giriş\" butonuna basın, açılan web sayfasından hesabınızı onaylayın.",
            "İlk açılış turunu izleyin ve ürünlerinizi eklemeye başlayın.",
          ].map((s, i) => (
            <li key={s} className="flex gap-4 text-lg">
              <span className="text-2xl font-extrabold text-sp-caramel">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        <h2 className="mt-12 text-3xl font-extrabold tracking-tight">Gereksinimler</h2>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-lg text-sp-graphite dark:text-zinc-300">
          <li>Windows bilgisayar</li>
          <li>Kurulum ve ilk giriş için internet bağlantısı</li>
          <li>İsteğe bağlı: barkod okuyucu, termal fiş yazıcı, etiket yazıcı, ikinci ekran</li>
        </ul>
      </section>

      <div className="px-5 py-10"><Faq items={FAQ} title="Kurulum soruları" /></div>
      <div className="mx-auto max-w-6xl px-5 pb-16"><RelatedLinks current="indir" /></div>
      <MarketingFooter />
    </div>
  );
}
