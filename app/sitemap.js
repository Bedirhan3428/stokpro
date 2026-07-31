export default function sitemap() {
  const baseUrl = "https://www.stokpro.shop";
  
  const routes = [
    "",
    "/login",
    "/register",
    "/forgot-password",
    "/product-key",
    "/privacy-policy",
    "/terms-of-service",
    "/dashboard",
    "/products",
    "/sales",
    "/customers",
    "/accounting",
    "/settings",
    "/admin"
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
