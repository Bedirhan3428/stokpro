import Link from "next/link";
import { notFound } from "next/navigation";
import { LANDING_PAGES, OG_IMAGES, SITE_NAME, SITE_URL } from "../../src/marketing/content";
import {
  DownloadButton,
  Faq,
  FinalCta,
  JsonLd,
  MarketingFooter,
  RelatedLinks,
  Screen,
  breadcrumbSchema,
  faqSchema,
} from "../../src/marketing/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(LANDING_PAGES).map((landing) => ({ landing }));
}

export async function generateMetadata({ params }) {
  const { landing } = await params;
  const page = LANDING_PAGES[landing];
  if (!page) return {};
  const path = `/${landing}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: { title: page.title, description: page.description, url: path, siteName: SITE_NAME, locale: "tr_TR", type: "website", images: OG_IMAGES },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: ["/og-stokpro.png"] },
  };
}

export default async function LandingPage({ params }) {
  const { landing } = await params;
  const page = LANDING_PAGES[landing];
  if (!page) notFound();
  const path = `/${landing}`;

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${SITE_NAME} ${page.label}`,
    description: page.description,
    url: `${SITE_URL}${path}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows",
    inLanguage: "tr-TR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "TRY", priceValidUntil: "2027-12-31" },
  };

  return (
    <div className="bg-sp-canvas text-sp-obsidian dark:bg-sp-deep dark:text-sp-canvas">
      <JsonLd data={software} />
      <JsonLd data={faqSchema(page.faq)} />
      <JsonLd data={breadcrumbSchema(page.h1, path)} />

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-8 lg:pt-12">
        <nav aria-label="Sayfa yolu" className="text-sm text-sp-graphite dark:text-zinc-400">
          <Link href="/" className="text-sp-graphite no-underline hover:text-sp-caramel dark:text-zinc-400">Ana Sayfa</Link>
          <span aria-hidden="true"> / </span>
          <span>{page.label}</span>
        </nav>
        <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-6xl">{page.h1}</h1>
            <p className="mt-5 text-lg leading-relaxed text-sp-graphite dark:text-zinc-300">{page.lead}</p>
            <div className="mt-7"><DownloadButton /></div>
            <p className="mt-3 text-sm text-sp-graphite dark:text-zinc-400">Windows için · 2028'e kadar ücretsiz</p>
          </div>
          <Screen name={page.screen} priority />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{page.featuresTitle}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-sp-border bg-white p-6 dark:border-white/10 dark:bg-sp-cardDark">
              <h3 className="text-lg font-extrabold">{f.t}</h3>
              <p className="mt-2 text-base leading-relaxed text-sp-graphite dark:text-zinc-400">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{page.stepsTitle}</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {page.steps.map((s, i) => (
            <li key={s} className="border-t-2 border-sp-obsidian pt-4 dark:border-sp-caramel">
              <span className="text-3xl font-extrabold text-sp-caramel">{i + 1}</span>
              <p className="mt-2 text-lg leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="px-5 py-12"><Faq items={page.faq} title={`${page.label} hakkında sorular`} /></div>
      <div className="mx-auto max-w-6xl px-5 py-10"><RelatedLinks current={landing} /></div>
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-4"><FinalCta /></div>
      <MarketingFooter />
    </div>
  );
}
