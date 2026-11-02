import Register from "../../src/components/Register";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Kayıt Ol",
  description: "StokPro'ya ücretsiz kayıt olun, 2028'e kadar ücretsiz stok takibi ve ön muhasebe yapın.",
};

export default function RegisterPage() {
  return <Register />;
}
