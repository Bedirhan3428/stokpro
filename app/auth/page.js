import React, { Suspense } from "react";
import AuthScreen from "../../src/components/AuthScreen";

export const metadata = {
  title: "Giriş Yap veya Kayıt Ol",
  description: "StokPro hesabınıza giriş yapın veya ücretsiz hesap oluşturun.",
  alternates: { canonical: "/auth" },
  robots: { index: false, follow: true },
};

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sp-canvas dark:bg-sp-deep" />}>
      <AuthScreen />
    </Suspense>
  );
}
