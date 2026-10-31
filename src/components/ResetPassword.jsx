"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { FiLock, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

export default function ResetPassword() {
  const auth = getAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [oobCode, setOobCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get("oobCode");

    if (!code) {
      setStatus({ type: "error", msg: "Geçersiz bağlantı." });
      setLoading(false);
      return;
    }

    setOobCode(code);

    verifyPasswordResetCode(auth, code)
      .then((mail) => {
        setEmail(mail);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ type: "error", msg: "Bağlantı geçersiz veya süresi dolmuş." });
        setLoading(false);
      });
  }, [auth, searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      setStatus({ type: "error", msg: "Parola en az 6 karakter olmalı." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus({ type: "success", msg: "Parola güncellendi! Yönlendiriliyorsunuz..." });
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      let message = "Parola güncellenemedi.";
      if (err.code === "auth/weak-password") message = "Parola çok zayıf.";
      if (err.code === "auth/expired-action-code") message = "Bağlantı süresi dolmuş.";
      if (err.code === "auth/invalid-action-code") message = "Geçersiz bağlantı.";
      setStatus({ type: "error", msg: message });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F7F5] dark:bg-[#0D0D11] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(24,24,27,0.05)] dark:shadow-2xl">
        {loading && !email ? (
          <div className="text-center py-6 space-y-2">
            <h1 className="text-xl font-extrabold text-[#18181B] dark:text-[#F7F7F5]">
              Şifre Sıfırlama
            </h1>
            <p className="text-xs text-[#71717A] dark:text-zinc-400">Doğrulanıyor...</p>
          </div>
        ) : status?.type === "error" && !email ? (
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-extrabold text-[#18181B] dark:text-[#F7F7F5]">
              Şifre Sıfırlama
            </h1>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2">
              <FiAlertTriangle className="text-rose-500 shrink-0" size={15} />
              <span>{status.msg}</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="w-full py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white font-bold text-sm transition cursor-pointer"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#A66B49] block mb-1.5">
                YENİ PAROLA
              </span>
              <h1 className="text-2xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight">
                Yeni Şifre Belirle
              </h1>
              <p className="font-mono text-xs text-[#71717A] dark:text-zinc-400 mt-1 truncate">
                {email}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold text-[#18181B] dark:text-zinc-300 mb-1.5"
                >
                  Yeni Parola (En az 6 karakter)
                </label>
                <div className="relative">
                  <FiLock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-zinc-500 pointer-events-none"
                  />
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F7F7F5] dark:bg-[#0D0D11] border border-[#E8E8E4] dark:border-white/10 focus:border-[#A66B49] text-[#18181B] dark:text-white placeholder-[#71717A]/60 dark:placeholder-zinc-600 text-sm outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white font-bold text-sm transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "İşleniyor..." : "Parolayı Güncelle"}
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
          </>
        )}
      </div>
    </div>
  );
}
