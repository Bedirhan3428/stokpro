import { Suspense } from "react";
import VerifyEmail from "../../src/components/VerifyEmail";

export const metadata = {
  title: "E-posta Doğrulama",
  description: "StokPro hesabınızın e-posta doğrulamasını tamamlayın.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="ra-yukleme"><div className="spinner" /><p>Yükleniyor...</p></div>}>
      <VerifyEmail />
    </Suspense>
  );
}
