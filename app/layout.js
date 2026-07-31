import "../src/styles/global.css";

import { AuthProvider } from "../src/contexts/AuthContext";
import Navbar from "../src/components/Navbar";
import TermsModal from "../src/components/TermsModal";

export const metadata = {
  metadataBase: new URL("https://www.stokpro.shop"),
  title: {
    default: "StokPro | Ücretsiz Stok Takip Sistemi ve Ön Muhasebe Programı",
    template: "%s | StokPro"
  },
  description: "StokPro ile barkodlu stok takibi, satış yönetimi ve ön muhasebe işlemlerinizi tek yerden kolayca yönetin. Küçük işletmeler için dijital çözüm.",
  keywords: ["stok takip", "muhasebe sistemi", "stok takip programı", "barkodlu satış", "envanter yönetimi", "StokPro", "ön muhasebe"],
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "StokPro | Ücretsiz Stok Takip Sistemi ve Ön Muhasebe Programı",
    description: "Barkodlu stok takibi, satış yönetimi ve ön muhasebe işlemlerinizi tek yerden kolayca yönetin.",
    url: "https://www.stokpro.shop",
    siteName: "StokPro",
    locale: "tr_TR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export const viewport = {
  themeColor: "#1f6feb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          <TermsModal />
          <Navbar />
          <main className="app-container">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
