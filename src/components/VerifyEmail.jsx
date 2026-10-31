"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, sendEmailVerification, applyActionCode, signOut } from "firebase/auth";
import { FiMail, FiRefreshCw, FiLogOut, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

export default function VerifyEmail() {
  const auth = getAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = auth.currentUser;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    async function handleOob() {
      if (mode !== "verifyEmail" || !oobCode) return;
      setLoading(true);
      setStatus({ type: "info", msg: "Doğrulama işleniyor..." });
      try {
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setStatus({ type: "success", msg: "E-posta doğrulandı, yönlendiriliyorsunuz..." });
            setTimeout(() => router.replace("/dashboard"), 800);
            return;
          }
        }
        setStatus({
          type: "success",
          msg: "E-posta doğrulandı. Giriş yaptıktan sonra devam edebilirsiniz.",
        });
      } catch (err) {
        setStatus({ type: "error", msg: err.message || "Doğrulama kodu işlenemedi." });
      } finally {
        setLoading(false);
      }
    }

    handleOob();
  }, [searchParams, auth, router]);

  async function resend() {
    if (!user) return;
    setStatus(null);
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: "https://www.stokpro.shop/verify-email",
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
      setStatus({ type: "success", msg: "Doğrulama e-postası tekrar gönderildi." });
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "E-posta gönderilemedi." });
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    if (!user) return;
    setLoading(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        router.replace("/dashboard");
      } else {
        setStatus({ type: "info", msg: "Henüz doğrulanmadı. Lütfen e-postanızı kontrol edin." });
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Durum yenilenemedi." });
    } finally {
      setLoading(false);
    }
  }

  async function cikisVeYonlendir() {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace("/register");
    } catch (err) {
      console.error("Çıkış hatası:", err);
      router.replace("/register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F7F5] dark:bg-[#0D0D11] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(24,24,27,0.05)] dark:shadow-2xl text-center space-y-6">
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F7F7F5] dark:bg-white/5 border border-[#E8E8E4] dark:border-white/10 text-[#A66B49] flex items-center justify-center">
            <FiMail size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight pt-1">
            E-posta Doğrulama
          </h1>
          <p className="font-mono text-xs text-[#71717A] dark:text-zinc-400">
            {user?.email ? user.email : "Oturum bulunamadı. Lütfen tekrar giriş yapın."}
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={resend}
            disabled={loading || !user}
            className="w-full py-3.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white font-bold text-sm transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Gönderiliyor..." : "Doğrulama E-postasını Gönder"}
          </button>

          <button
            type="button"
            onClick={refreshStatus}
            disabled={loading || !user}
            className="w-full py-3 rounded-xl bg-[#F7F7F5] hover:bg-[#ECECE8] dark:bg-white/5 dark:hover:bg-white/10 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#F7F7F5] font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <FiRefreshCw size={15} />
            <span>{loading ? "Yenileniyor..." : "Doğrulama Durumunu Yenile"}</span>
          </button>

          <button
            type="button"
            onClick={cikisVeYonlendir}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <FiLogOut size={14} />
            <span>Çıkış Yap / Kayıt Ekranına Dön</span>
          </button>

          {status && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border ${
                status.type === "error"
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300"
                  : status.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                  : "bg-[#A66B49]/10 border-[#A66B49]/25 text-[#A66B49]"
              }`}
            >
              {status.type === "error" ? (
                <FiAlertTriangle className="shrink-0" size={15} />
              ) : (
                <FiCheckCircle className="shrink-0" size={15} />
              )}
              <span>{status.msg}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#71717A] dark:text-zinc-500">
          E-posta ulaşmadıysa gereksiz (spam) klasörünü kontrol edin.
        </p>
      </div>
    </div>
  );
}
