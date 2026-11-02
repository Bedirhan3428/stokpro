import { LANDING_PAGES, LAST_UPDATED, SITE_URL } from "../src/marketing/content";

// Yalnızca aranmasını istediğimiz herkese açık sayfalar. Giriş gerektiren sayfalar burada olmamalı.
export default function sitemap() {
  const entry = (path, priority) => ({
    url: `${SITE_URL}${path}`,
    lastModified: LAST_UPDATED,
    changeFrequency: "monthly",
    priority,
  });
  return [
    entry("", 1),
    ...Object.keys(LANDING_PAGES).map((slug) => entry(`/${slug}`, 0.9)),
    entry("/indir", 0.8),
    entry("/privacy-policy", 0.2),
    entry("/terms-of-service", 0.2),
  ];
}
