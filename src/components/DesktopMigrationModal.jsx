"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiDownload, FiMonitor, FiX } from "react-icons/fi";

const STORAGE_KEY = "stokpro_desktop_migration_notice_closed";
const EXCLUDED_PATHS = ["/auth", "/privacy-policy", "/terms-of-service"];

export default function DesktopMigrationModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (EXCLUDED_PATHS.includes(pathname)) {
      setOpen(false);
      return;
    }

    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleClose = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  };

  if (!open || EXCLUDED_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0D0D11]/70 backdrop-blur-sm p-4 animate-fadeIn font-sans"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-migration-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-[#A66B49]" />

        <button
          type="button"
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:text-zinc-400 dark:hover:text-white hover:bg-[#F7F7F5] dark:hover:bg-white/5 transition cursor-pointer"
        >
          <FiX size={18} />
        </button>

        <div className="p-6 sm:p-7">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#A66B49]/10 border border-[#A66B49]/25 text-[#A66B49] font-mono text-[11px] font-bold tracking-wider uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A66B49]" />
            <span>ÖNEMLİ DUYURU</span>
          </div>

          <div className="flex items-center gap-3.5 mb-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#18181B] dark:bg-white/5 border border-[#18181B] dark:border-white/10 text-[#A66B49] flex items-center justify-center shrink-0">
              <FiMonitor size={20} />
            </div>
            <h2
              id="desktop-migration-title"
              className="text-lg font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight leading-snug"
            >
              Web Sitesi Yakında Kullanıma Kapatılacaktır
            </h2>
          </div>

          <p className="text-sm text-[#71717A] dark:text-zinc-400 leading-relaxed mb-6">
            Web sürümü yakında kullanılamayacaktır. Lütfen{" "}
            <strong className="text-[#18181B] dark:text-[#F7F7F5] font-bold">yeni yıla kadar</strong>{" "}
            <strong className="text-[#18181B] dark:text-[#F7F7F5] font-bold">StokPro Masaüstü</strong>{" "}
            uygulamasını bilgisayarınıza kurup verilerinizi yerele çekin.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <a
              href="/downloads/StokPro-Setup.exe"
              download="StokPro-Setup.exe"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white text-sm font-bold transition no-underline text-center shadow-sm"
            >
              <FiDownload size={16} className="text-[#A66B49] dark:text-white" />
              <span>Masaüstü Uygulamasını İndir</span>
            </a>

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 rounded-xl bg-[#F7F7F5] hover:bg-[#ECECE8] dark:bg-white/5 dark:hover:bg-white/10 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-zinc-300 text-sm font-semibold transition cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
