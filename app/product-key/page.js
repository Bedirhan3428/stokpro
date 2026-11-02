import ProductKeyPage from "../../src/components/ProductKey";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Ürün Anahtarı ve Lisans",
  description: "StokPro lisansınızı aktif edin; 2028'e kadar ücretsiz.",
};

export default function Page() {
  return <ProductKeyPage />;
}
