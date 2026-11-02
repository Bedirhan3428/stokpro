import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiDownload } from "react-icons/fi";
import { LANDING_PAGES, NAV_LINKS, SCREENS, SETUP_URL, SITE_URL } from "./content";

export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const faqSchema = (faq) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const breadcrumbSchema = (name, path) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
    { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
  ],
});

export function DownloadButton({ dark = false, label = "Ücretsiz İndir" }) {
  const tone = dark
    ? "bg-white text-sp-obsidian hover:bg-sp-canvas"
    : "bg-sp-obsidian text-white hover:bg-[#27272A] dark:bg-sp-caramel dark:hover:bg-sp-caramelDark";
  return (
    <a
      href={SETUP_URL}
      download="StokPro-Setup.exe"
      className={`inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-base font-bold no-underline transition ${tone}`}
    >
      <FiDownload size={18} aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}

export function Screen({ name, priority = false, className = "" }) {
  const s = SCREENS[name];
  return (
    <Image
      src={s.src}
      alt={s.alt}
      width={1280}
      height={800}
      priority={priority}
      sizes="(max-width: 1024px) 100vw, 640px"
      className={`h-auto w-full rounded-2xl border border-sp-border shadow-[0_18px_50px_-22px_rgba(24,24,27,0.35)] dark:border-white/10 ${className}`}
    />
  );
}

export function Faq({ items, title = "Sık sorulan sorular" }) {
  return (
    <section aria-labelledby="sss" className="mx-auto w-full max-w-3xl">
      <h2 id="sss" className="text-3xl font-extrabold tracking-tight text-sp-obsidian dark:text-sp-canvas">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-sp-border border-y border-sp-border dark:divide-white/10 dark:border-white/10">
        {items.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-sp-obsidian dark:text-sp-canvas [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden="true" className="text-2xl font-normal text-sp-caramel transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-base leading-relaxed text-sp-graphite dark:text-zinc-400">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta({ title = "Defteri bırakın, işinizi tek programdan yönetin." }) {
  return (
    <section className="rounded-3xl bg-sp-obsidian px-6 py-14 text-center text-white sm:px-12 dark:bg-sp-cardDark">
      <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-zinc-300">StokPro'yu Windows bilgisayarınıza kurun, dakikalar içinde ürünlerinizi eklemeye başlayın.</p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <DownloadButton dark />
        <Link href="/indir" className="inline-flex items-center gap-2 px-4 py-3 font-bold text-white no-underline hover:text-[#E0A27C]">
          Kurulum adımları <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-sp-border bg-white px-5 py-12 dark:border-white/10 dark:bg-sp-cardDark">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
        <div>
          <strong className="text-xl font-extrabold text-sp-obsidian dark:text-sp-canvas">StokPro</strong>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-sp-graphite dark:text-zinc-400">
            Windows için stok takip, barkodlu satış, cari hesap ve ön muhasebe programı.
          </p>
        </div>
        <nav aria-label="Programlar">
          <strong className="text-sm font-bold text-sp-obsidian dark:text-sp-canvas">Programlar</strong>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(LANDING_PAGES).map(([slug, p]) => (
              <li key={slug}>
                <Link href={`/${slug}`} className="text-sp-graphite no-underline hover:text-sp-caramel dark:text-zinc-400">{p.h1}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="StokPro">
          <strong className="text-sm font-bold text-sp-obsidian dark:text-sp-canvas">StokPro</strong>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/indir" className="text-sp-graphite no-underline hover:text-sp-caramel dark:text-zinc-400">İndir</Link></li>
            <li><Link href="/auth" className="text-sp-graphite no-underline hover:text-sp-caramel dark:text-zinc-400">Giriş Yap / Kayıt Ol</Link></li>
            <li><Link href="/privacy-policy" className="text-sp-graphite no-underline hover:text-sp-caramel dark:text-zinc-400">Gizlilik Politikası</Link></li>
            <li><Link href="/terms-of-service" className="text-sp-graphite no-underline hover:text-sp-caramel dark:text-zinc-400">Hizmet Şartları</Link></li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-sp-graphite dark:text-zinc-500">© {new Date().getFullYear()} StokPro. Tüm hakları saklıdır.</p>
    </footer>
  );
}

export function RelatedLinks({ current }) {
  return (
    <section aria-labelledby="diger">
      <h2 id="diger" className="text-2xl font-extrabold tracking-tight text-sp-obsidian dark:text-sp-canvas">StokPro ile bunları da yapın</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {NAV_LINKS.filter((l) => l.href !== `/${current}`).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-2 rounded-xl border border-sp-border bg-white px-4 py-2.5 font-semibold text-sp-obsidian no-underline hover:border-sp-caramel dark:border-white/10 dark:bg-sp-cardDark dark:text-sp-canvas"
          >
            {l.label} <FiArrowRight aria-hidden="true" className="text-sp-caramel" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CheckList({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-base text-sp-graphite dark:text-zinc-300">
          <FiCheck aria-hidden="true" className="mt-1 shrink-0 text-sp-caramel" /> <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
