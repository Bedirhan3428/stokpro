import React, { Suspense } from "react";
import DeviceAuth from "../../src/components/DeviceAuth";

export const metadata = {
  title: "Masaüstü Kasa Girişi | StokPro",
  description: "StokPro Masaüstü Kasa Terminali için hızlı ve güvenli Google yetkilendirmesi.",
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

function AuthLoadingFallback() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-app)",
      color: "var(--text-muted)",
      fontSize: "0.9rem"
    }}>
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
