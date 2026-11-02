import { SITE_URL } from "../src/marketing/content";

// Uygulama sayfaları burada engellenmez: noindex etiketlerini Google'ın görebilmesi gerekir.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/anket"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
