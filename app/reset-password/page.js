import { Suspense } from "react";
import ResetPassword from "../../src/components/ResetPassword";

export const metadata = {
  title: "Şifre Sıfırla",
  description: "StokPro hesabınız için yeni şifrenizi belirleyin.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="ra-yukleme"><div className="spinner" /><p>Yükleniyor...</p></div>}>
      <ResetPassword />
    </Suspense>
  );
}
