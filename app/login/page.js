import Login from "../../src/components/Login";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Giriş Yap",
  description: "StokPro hesabınıza giriş yaparak stok takibi ve ön muhasebe işlemlerinizi yönetmeye başlayın.",
};

export default function LoginPage() {
  return <Login />;
}
