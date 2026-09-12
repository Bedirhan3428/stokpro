export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/anket",
        "/anket/",
        "/verify-email"
      ],
    },
    sitemap: "https://www.stokpro.shop/sitemap.xml",
  };
}
