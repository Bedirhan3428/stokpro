"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { initTheme, toggleTheme } from "../utils/theme";
import { FaMoon } from "react-icons/fa6";
import { IoSunny } from "react-icons/io5";
import { FiDownload, FiUser } from "react-icons/fi";
import { NAV_LINKS } from "../marketing/content";

export default function Navbar() {
  const [theme, setTheme] = useState("light");
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const update = () => setTheme(document.documentElement.getAttribute("data-theme") || initTheme());
    update();
    window.addEventListener("themeChange", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      window.removeEventListener("themeChange", update);
      observer.disconnect();
    };
  }, []);

  // Giriş / kayıt ekranının kendi üst alanı var
  if (pathname === "/auth") return null;

  const handleTheme = () => {
    toggleTheme(document.documentElement.getAttribute("data-theme") || theme || "light");
  };

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-[#E8E8E4] bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-[#16161B]/95">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 no-underline">
          <img
            src={theme === "dark" ? "/HeaderName2.png" : "/HeaderName.png"}
            alt="StokPro Logo"
            className="h-7 max-w-[140px] shrink-0 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/browserlogo.svg";
            }}
          />
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold no-underline transition hover:text-[#A66B49] ${pathname === link.href ? "text-[#A66B49]" : "text-[#18181B] dark:text-zinc-200"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleTheme}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E8E8E4] bg-[#F7F7F5] text-[#18181B] transition hover:border-[#A66B49]/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            title="Temayı Değiştir"
            aria-label="Temayı değiştir"
          >
            {theme === "dark" ? <IoSunny size={16} /> : <FaMoon size={15} />}
          </button>

          <Link
            href="/auth"
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold text-[#18181B] no-underline transition hover:bg-[#F7F7F5] sm:inline-flex sm:text-sm dark:text-zinc-200 dark:hover:bg-white/5"
          >
            {user ? (
              <>
                <FiUser size={14} aria-hidden="true" /> Hesabım
              </>
            ) : (
              "Giriş Yap"
            )}
          </Link>

          <Link
            href="/indir"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#18181B] px-3.5 py-2 text-xs font-bold text-white no-underline shadow-sm transition hover:bg-[#27272A] sm:text-sm dark:bg-[#A66B49] dark:hover:bg-[#8D583A]"
          >
            <FiDownload size={14} className="text-[#E0A27C] dark:text-white" />
            <span>Ücretsiz İndir</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
