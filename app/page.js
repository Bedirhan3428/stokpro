import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { FULL_SETUP_URL, HOME_FAQ, OG_IMAGES, SITE_NAME, SITE_URL } from "../src/marketing/content";
import { CheckList, DownloadButton, Faq, FinalCta, JsonLd, MarketingFooter, Screen, faqSchema } from "../src/marketing/ui";

const title = "Stok Takip ve Ön Muhasebe Programı | StokPro";
const description =
  "StokPro; stok takip, barkodlu satış, cari hesap, fatura ve kasa işlerinizi tek programda toplar. Windows için ücretsiz stok ve ön muhasebe programını indirin.";

export const metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", siteName: SITE_NAME, locale: "tr_TR", type: "website", images: OG_IMAGES },
  twitter: { card: "summary_large_image", title, description, images: ["/og-stokpro.png"] },
};

const MODULES = [
  {
    screen: "stok",
    h: "Stok takibi",
    p: "Hangi üründen kaç adet kaldığını, depodaki malın maliyetini ve azalan ürünleri tek listede görün.",
    list: ["Barkodlu ürün kartları", "Kritik stok uyarısı", "Excel'den ürün aktarımı"],
    href: "/stok-takip-programi",
    more: "Stok takip programı",
  },
  {
    screen: "satis",
    h: "Barkodlu satış",
    p: "Barkodu okutun, ürün sepete düşsün, toplam kendiliğinden hesaplansın. Klavye kısayollarıyla kasada hız kazanın.",
    list: ["Nakit, kart ve veresiye", "Termal fiş yazıcı", "İkinci müşteri ekranı"],
    href: "/barkodlu-satis-programi",
    more: "Barkodlu satış programı",
  },
  {
    screen: "cari",
    h: "Cari hesap",
    p: "Kimin size ne kadar borçlu olduğunu, sizin kime ne kadar ödeyeceğinizi defter karıştırmadan görün.",
    list: ["Müşteri ve tedarikçi kartları", "Tahsilat ve ödeme kaydı", "Yazdırılabilir hesap ekstresi"],
    href: "/cari-hesap-takip-programi",
    more: "Cari hesap takip programı",
  },
  {
    screen: "rapor",
    h: "Fatura, kasa ve raporlar",
    p: "Alış ve satış faturalarınızı, kasa ve banka bakiyenizi, giderlerinizi ve net kârınızı tek yerden izleyin.",
    list: ["Alış ve satış faturaları", "Kasa, banka ve POS hesapları", "Net kâr ve KDV özeti"],
    href: "/on-muhasebe-programi",
    more: "Ön muhasebe programı",
  },
];

const WHO = [
  { h: "Market ve bakkal", p: "Barkodla hızlı kasa, azalan ürün takibi ve veresiye defteri.", href: "/market-programi" },
  { h: "Mağaza ve perakende", p: "Ürün, fiş, kart ve nakit tahsilatı tek ekranda.", href: "/barkodlu-satis-programi" },
  { h: "Toptan satış", p: "Toplu ürün girişi, tedarikçi ve müşteri hesapları, faturalar.", href: "/cari-hesap-takip-programi" },
  { h: "Depolu işletmeler", p: "Çoklu depo, depo transferi ve stok sayımı.", href: "/stok-takip-programi" },
];

const appSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "tr-TR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      description,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Stok Takip ve Ön Muhasebe Programı",
      operatingSystem: "Windows",
      inLanguage: "tr-TR",
      downloadUrl: `${SITE_URL}${FULL_SETUP_URL}`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "TRY", priceValidUntil: "2027-12-31" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function Page() {
  return (
    <div className="bg-sp-canvas text-sp-obsidian dark:bg-sp-deep dark:text-sp-canvas">
      <JsonLd data={appSchema} />
      <JsonLd data={faqSchema(HOME_FAQ)} />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-12 lg:grid-cols-[1fr_1.15fr] lg:pt-20">
        <div>
          <p className="font-bold text-sp-caramel">Windows için · 2028'e kadar ücretsiz</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-6xl">
            Stok takip ve ön muhasebe programı
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-sp-graphite dark:text-zinc-300">
            Stoğunuzu, satışınızı, carinizi, faturanızı ve kasanızı tek programdan yönetin. Market, mağaza ve toptan satış yapan işletmeler için.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <DownloadButton />
            <a href="#ozellikler" className="inline-flex items-center justify-center gap-2 px-4 py-3 font-bold text-sp-obsidian no-underline hover:text-sp-caramel dark:text-sp-canvas">
              Neler yapabilir? <FiArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
        <Screen name="satis" priority />
      </section>

      <section id="ozellikler" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Dükkanın bütün işi tek programda</h2>
        <div className="mt-12 space-y-20">
          {MODULES.map((m, i) => (
            <article key={m.h} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className={i % 2 ? "lg:order-2" : ""}>
                <h3 className="text-3xl font-extrabold tracking-tight">{m.h}</h3>
                <p className="mt-3 text-lg leading-relaxed text-sp-graphite dark:text-zinc-300">{m.p}</p>
                <div className="mt-5"><CheckList items={m.list} /></div>
                <Link href={m.href} className="mt-6 inline-flex items-center gap-2 font-bold text-sp-caramel no-underline hover:text-sp-caramelDark">
                  {m.more} <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
              <div className={i % 2 ? "lg:order-1" : ""}><Screen name={m.screen} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Kimler için?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHO.map((w) => (
            <Link key={w.h} href={w.href} className="rounded-2xl border border-sp-border bg-white p-6 no-underline transition hover:border-sp-caramel dark:border-white/10 dark:bg-sp-cardDark">
              <h3 className="text-lg font-extrabold text-sp-obsidian dark:text-sp-canvas">{w.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sp-graphite dark:text-zinc-400">{w.p}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="px-5 py-14"><Faq items={HOME_FAQ} /></div>
      <div className="mx-auto max-w-6xl px-5 pb-16"><FinalCta /></div>
      <MarketingFooter />
    </div>
  );
}
