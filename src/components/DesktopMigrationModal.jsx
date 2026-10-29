"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiAlertTriangle, FiDownload, FiMonitor, FiX } from "react-icons/fi";

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-migration-title"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600" />

        <button
          type="button"
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <FiX size={18} />
        </button>

        <div className="p-6 sm:p-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-extrabold mb-4">
            <FiAlertTriangle className="shrink-0" size={14} />
            <span>ÖNEMLİ DUYURU</span>
          </div>

          <div className="flex items-start gap-3.5 mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FiMonitor size={22} />
            </div>
            <div>
              <h2
                id="desktop-migration-title"
                className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug"
              >
                Web Sitesi Yakında Kullanıma Kapatılacaktır
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-6">
            Web sürümü yakında kullanılamayacaktır. Lütfen <strong>yeni yıla kadar</strong>{" "}
            <strong>StokPro Masaüstü</strong> uygulamasını bilgisayarınıza kurup verilerinizi yerele çekin.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <a
              href="/downloads/StokPro-Setup.exe"
              download="StokPro-Setup.exe"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition no-underline text-center"
            >
              <FiDownload size={17} />
              <span>Masaüstü Uygulamasını İndir</span>
            </a>

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

