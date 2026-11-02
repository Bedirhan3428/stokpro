import "../src/styles/global.css";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AuthProvider } from "../src/contexts/AuthContext";
import Navbar from "../src/components/Navbar";
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
  metadataBase: new URL("https://stokpro.com.tr"),
  title: {
    default: "StokPro | Stok Takip ve Ön Muhasebe Programı",
    template: "%s | StokPro",
  },
  description:
    "StokPro; stok takip, barkodlu satış, cari hesap, fatura ve kasa işlerinizi tek programda toplayan Windows programıdır.",
  applicationName: "StokPro",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    siteName: "StokPro",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/og-stokpro.png", width: 1200, height: 630, alt: "StokPro: Stok takip ve ön muhasebe programı" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-stokpro.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport = {
  themeColor: "#18181B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <TelemetryTracker />
          <Navbar />
          <main className="app-container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
