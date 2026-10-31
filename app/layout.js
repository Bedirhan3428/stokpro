import "../src/styles/global.css";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AuthProvider } from "../src/contexts/AuthContext";
import Navbar from "../src/components/Navbar";
import TermsModal from "../src/components/TermsModal";
import DesktopMigrationModal from "../src/components/DesktopMigrationModal";
import TelemetryTracker from "../src/components/TelemetryTracker";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://www.stokpro.shop"),
  title: {
    default: "StokPro | Barkodlu Stok Takip Sistemi ve Ön Muhasebe Programı",
    template: "%s | StokPro",
  },
  description:
    "StokPro ile barkodlu stok takibi, satış yönetimi ve ön muhasebe işlemlerinizi tek yerden kolayca yönetin. Küçük işletmeler için dijital çözüm.",
  keywords: [
    "stok takip",
    "muhasebe sistemi",
    "stok takip programı",
    "barkodlu satış",
    "envanter yönetimi",
    "StokPro",
    "ön muhasebe",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "StokPro | Barkodlu Stok Takip Sistemi ve Ön Muhasebe Programı",
    description:
      "Barkodlu stok takibi, satış yönetimi ve ön muhasebe işlemlerinizi tek yerden kolayca yönetin.",
    url: "https://www.stokpro.shop",
    siteName: "StokPro",
    locale: "tr_TR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#18181B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <TelemetryTracker />
          <TermsModal />
          <DesktopMigrationModal />
          <Navbar />
          <main className="app-container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
