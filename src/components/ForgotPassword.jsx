"use client";

import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    if (!email || !email.includes("@")) {
      setStatus({ type: "error", msg: "Lütfen geçerli bir e-posta girin." });
      return;
    }

    setSending(true);
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatus({
        type: "success",
        msg: "Sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.",
      });
      setEmail("");
    } catch (err) {
      let message = "İşlem başarısız.";
      if (err.code === "auth/user-not-found") message = "Bu e-posta ile kayıtlı kullanıcı yok.";
      if (err.code === "auth/invalid-email") message = "Geçersiz e-posta formatı.";
      if (err.code === "auth/too-many-requests") message = "Çok fazla denediniz. Biraz bekleyin.";
      setStatus({ type: "error", msg: message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F7F5] dark:bg-[#0D0D11] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(24,24,27,0.05)] dark:shadow-2xl z-10">
        <div className="mb-6">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#A66B49] block mb-1.5">
            HESAP KURTARMA
          </span>
          <h1 className="text-2xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight">
            Şifre Sıfırlama
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400 mt-1">
            Hesabınıza ait e-posta adresini girin, size sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-bold text-[#18181B] dark:text-zinc-300 mb-1.5"
            >
              E-posta Adresi
            </label>
            <div className="relative">
              <FiMail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-zinc-500 pointer-events-none"
              />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@isletme.com"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F7F7F5] dark:bg-[#0D0D11] border border-[#E8E8E4] dark:border-white/10 focus:border-[#A66B49] dark:focus:border-[#A66B49] text-[#18181B] dark:text-white placeholder-[#71717A]/60 dark:placeholder-zinc-600 text-sm outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white font-bold text-sm transition cursor-pointer disabled:opacity-50"
          >
            {sending ? "Gönderiliyor..." : "Bağlantı Gönder"}
          </button>

          {status && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
                status.type === "error"
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {status.type === "error" ? (
                <FiAlertTriangle className="text-rose-500 shrink-0" size={15} />
              ) : (
                <FiCheckCircle className="text-emerald-500 shrink-0" size={15} />
              )}
              <span>{status.msg}</span>
            </div>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-[#E8E8E4] dark:border-white/10 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#71717A] hover:text-[#18181B] dark:text-zinc-400 dark:hover:text-white transition no-underline"
          >
            <FiArrowLeft size={14} />
            <span>Giriş ekranına dön</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
