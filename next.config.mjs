/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // Next.js config settings if needed
  },
  // Web paneli kaldırıldı: eski adresler tek giriş ekranına gider
  async redirects() {
    const toAuth = ["/login", "/dashboard", "/products", "/sales", "/customers", "/accounting", "/settings", "/product-key"];
    return [
      ...toAuth.map((source) => ({ source, destination: "/auth", permanent: true })),
      { source: "/register", destination: "/auth?mod=kayit", permanent: true },
      { source: "/forgot-password", destination: "/auth?mod=sifre", permanent: true },
    ];
  },
};

export default nextConfig;
