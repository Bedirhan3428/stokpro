"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiArrowRight,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { createUserProfile, getUserProfile } from "../utils/firebaseHelpers";
import OnboardingSurvey from "./OnboardingSurvey";

export default function Register() {
  const { signup, user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState("register"); // 'register' | 'onboarding'
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && step !== "onboarding") {
      let mounted = true;
      getUserProfile(user.uid)
        .then((p) => {
          if (!mounted) return;
          if (p?.onboardingCompleted) {
            router.replace("/dashboard");
          } else {
            setStep("onboarding");
          }
        })
        .catch(() => {
          if (mounted) router.replace("/dashboard");
        });

      return () => {
        mounted = false;
      };
    }
  }, [user, step, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) return setError("İşletme adı veya isim gerekli.");
    if (password !== confirm) return setError("Parolalar eşleşmiyor.");

    setLoading(true);
    try {
      await signup(email.trim(), password, displayName.trim());
      try {
        await createUserProfile({
          name: displayName.trim(),
          email: email.trim(),
          lastLogin: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn("Profil kaydı yapılamadı:", profileErr);
      }
      try {
        localStorage.setItem("user", "true");
      } catch (storageErr) {
        console.warn("localStorage yazılamadı:", storageErr);
      }

      setStep("onboarding");
    } catch (err) {
      setError(err.message || "Kayıt başarısız.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      let profile = null;
      try {
        profile = await getUserProfile(result.user.uid);
        if (!profile) {
          profile = await createUserProfile(
            { lastLogin: new Date().toISOString() },
            result.user.uid
          );
        }
      } catch (profileErr) {
        console.warn("Profil kaydı kontrolü:", profileErr);
      }

      try {
        localStorage.setItem("user", "true");
      } catch (storageErr) {
        console.warn("localStorage yazılamadı:", storageErr);
      }

      if (profile?.onboardingCompleted) {
        router.push("/dashboard");
      } else {
        setStep("onboarding");
      }
    } catch (err) {
      setError(err.message || "Google ile kayıt başarısız.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "onboarding") {
    return <OnboardingSurvey onCompleted={() => router.push("/dashboard")} />;
  }

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-[#F7F7F5] dark:bg-[#0D0D11] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans"
      role="main"
    >
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[260px] bg-[#A66B49]/8 dark:bg-[#A66B49]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[450px] bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(24,24,27,0.05)] dark:shadow-2xl z-10">
        <div className="mb-6">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#A66B49] block mb-1.5">
            YENİ İŞLETME KAYDI
          </span>
          <h1 className="text-2xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight">
            Hesap Oluşturun
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-zinc-400 mt-1">
            İşletme kaydınızı tamamlayarak StokPro'yu hemen kullanmaya başlayın.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-bold text-[#18181B] dark:text-zinc-300 mb-1.5"
            >
              İşletme Adı veya Ad Soyad
            </label>
            <div className="relative">
              <FiUser
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-zinc-500 pointer-events-none"
              />
              <input
                id="name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Örn: Yıldız Ticaret"
                required
                autoComplete="name"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F7F7F5] dark:bg-[#0D0D11] border border-[#E8E8E4] dark:border-white/10 focus:border-[#A66B49] dark:focus:border-[#A66B49] text-[#18181B] dark:text-white placeholder-[#71717A]/60 dark:placeholder-zinc-600 text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
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
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@isletme.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F7F7F5] dark:bg-[#0D0D11] border border-[#E8E8E4] dark:border-white/10 focus:border-[#A66B49] dark:focus:border-[#A66B49] text-[#18181B] dark:text-white placeholder-[#71717A]/60 dark:placeholder-zinc-600 text-sm outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#18181B] dark:text-zinc-300 mb-1.5"
              >
                Parola
              </label>
              <div className="relative">
                <FiLock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-zinc-500 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-9 py-3 rounded-xl bg-[#F7F7F5] dark:bg-[#0D0D11] border border-[#E8E8E4] dark:border-white/10 focus:border-[#A66B49] dark:focus:border-[#A66B49] text-[#18181B] dark:text-white placeholder-[#71717A]/60 dark:placeholder-zinc-600 text-sm outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#18181B] dark:text-zinc-500 dark:hover:text-zinc-300 bg-transparent border-0 p-1 cursor-pointer flex items-center"
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-xs font-bold text-[#18181B] dark:text-zinc-300 mb-1.5"
              >
                Parola (Tekrar)
              </label>
              <div className="relative">
                <FiLock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-zinc-500 pointer-events-none"
                />
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#F7F7F5] dark:bg-[#0D0D11] border border-[#E8E8E4] dark:border-white/10 focus:border-[#A66B49] dark:focus:border-[#A66B49] text-[#18181B] dark:text-white placeholder-[#71717A]/60 dark:placeholder-zinc-600 text-sm outline-none transition"
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5"
            >
              <FiAlertTriangle className="text-rose-500 shrink-0" size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3 pt-1.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <span>{loading ? "Kaydediliyor..." : "Kayıt Ol"}</span>
              {!loading && <FiArrowRight size={16} className="text-[#A66B49] dark:text-white" />}
            </button>

            <div className="flex items-center gap-3 py-0.5">
              <div className="flex-1 h-px bg-[#E8E8E4] dark:bg-white/10" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-zinc-500">
                veya
              </span>
              <div className="flex-1 h-px bg-[#E8E8E4] dark:bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#F7F7F5] hover:bg-[#ECECE8] dark:bg-white/5 dark:hover:bg-white/10 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#F7F7F5] font-bold text-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google ile devam et</span>
            </button>
          </div>

          <p className="text-center text-xs text-[#71717A] dark:text-zinc-400 pt-2">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-bold text-[#A66B49] hover:underline no-underline">
              Giriş Yap
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
