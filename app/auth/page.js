import React, { Suspense } from "react";
import DeviceAuth from "../../src/components/DeviceAuth";

export const metadata = {
  title: "Masaüstü Kasa Girişi | StokPro",
  description: "StokPro Masaüstü Kasa Terminali için e-posta veya Google ile güvenli yetkilendirme.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

function AuthLoadingFallback() {
  return (
    <div className="min-h-screen w-full bg-[#0D0D11] text-zinc-400 flex items-center justify-center font-sans text-sm">
      Oturum doğrulanıyor...
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingFallback />}>
      <DeviceAuth />
    </Suspense>
  );
}
