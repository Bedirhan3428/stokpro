"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { initTheme, toggleTheme } from "../utils/theme";
import { FaMoon } from "react-icons/fa6";
import { IoSunny } from "react-icons/io5";
import {
  FiSettings,
  FiLogOut,
  FiActivity,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiFileText,
  FiArrowRight,
  FiDownload,
} from "react-icons/fi";
import { getMasterStoreSnapshot, subscribeToMasterStore } from "../utils/masterDataCache";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/privacy-policy",
  "/terms-of-service",
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    const updateThemeFromDOM = () => {
      const current = document.documentElement.getAttribute("data-theme") || initTheme();
      setTheme(current);
    };

    updateThemeFromDOM();
    window.addEventListener("themeChange", updateThemeFromDOM);

    const observer = new MutationObserver(() => {
      updateThemeFromDOM();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const snap = getMasterStoreSnapshot();
    if (snap?.profile?.logoUrl) {
      setLogoUrl(snap.profile.logoUrl);
    }

    const unsub = subscribeToMasterStore((store) => {
      if (store?.profile?.logoUrl) {
        setLogoUrl(store.profile.logoUrl);
      }
    });

    return () => {
      window.removeEventListener("themeChange", updateThemeFromDOM);
      observer.disconnect();
      unsub();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Masaüstü terminal yetkilendirme ekranında (/auth) üst gezinme çubuğu gizlenir
  if (pathname === "/auth") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  const handleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || theme || "light";
    toggleTheme(current);
  };

  const isPublicRoute = PUBLIC_PATHS.includes(pathname);

  // DIŞA AÇIK EKRANLAR İÇİN STOKPRO MASAÜSTÜ (POS) TASARIM DİLİ ÜST ÇUBUĞU
  if (isPublicRoute && !user) {
    return (
      <header className="sticky top-0 z-40 h-16 w-full bg-white/95 dark:bg-[#16161B]/95 backdrop-blur-md border-b border-[#E8E8E4] dark:border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-full flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 no-underline">
            <img
              src={theme === "dark" ? "/HeaderName2.png" : "/HeaderName.png"}
              alt="StokPro Logo"
              className="h-7 max-w-[140px] object-contain shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/browserlogo.svg";
              }}
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <a
              href="/downloads/StokPro-Setup.exe"
              download="StokPro-Setup.exe"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#71717A] hover:text-[#18181B] dark:text-zinc-400 dark:hover:text-white hover:bg-[#F7F7F5] dark:hover:bg-white/5 transition no-underline"
            >
              <FiDownload size={14} className="text-[#A66B49]" />
              <span>Masaüstü İndir</span>
            </a>

            <button
              type="button"
              onClick={handleTheme}
              className="w-9 h-9 rounded-lg bg-[#F7F7F5] dark:bg-white/5 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-zinc-300 hover:border-[#A66B49]/50 flex items-center justify-center transition cursor-pointer"
              title="Temayı Değiştir"
            >
              {theme === "dark" ? <IoSunny size={16} /> : <FaMoon size={15} />}
            </button>

            {pathname !== "/login" && (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold text-[#18181B] dark:text-zinc-200 hover:bg-[#F7F7F5] dark:hover:bg-white/5 transition no-underline"
              >
                Giriş Yap
              </Link>
            )}

            {pathname !== "/register" && (
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white text-xs sm:text-sm font-bold transition no-underline shadow-sm"
              >
                <span>Kayıt Ol</span>
                <FiArrowRight size={14} className="text-[#A66B49] dark:text-white" />
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  const NavLinks = ({ mobile = false }) => (
    <div className={mobile ? "nb-mobil-list" : "nb-masaustu-list"}>
      <Link href="/dashboard" className={`nb-link ${pathname === "/dashboard" ? "aktif" : ""}`}>
        <FiActivity size={16} /> Dashboard
      </Link>
      <Link href="/products" className={`nb-link ${pathname === "/products" ? "aktif" : ""}`}>
        <FiPackage size={16} /> Ürünler
      </Link>
      <Link href="/sales" className={`nb-link ${pathname === "/sales" ? "aktif" : ""}`}>
        <FiShoppingCart size={16} /> Satış
      </Link>
      <Link href="/customers" className={`nb-link ${pathname === "/customers" ? "aktif" : ""}`}>
        <FiUsers size={16} /> Müşteriler
      </Link>
      <Link href="/accounting" className={`nb-link ${pathname === "/accounting" ? "aktif" : ""}`}>
        <FiFileText size={16} /> Muhasebe
      </Link>
    </div>
  );

  const MobileMenuOverlay = () => (
    <div className="nb-mobil-portal">
      <div className="nb-overlay" onClick={() => setMobileOpen(false)} />
      <div className="nb-mobil-menu">
        <div className="nb-mobil-header">
          <div className="nb-logo-bolumu" style={{ display: "flex", alignItems: "center" }}>
            <img
              src={theme === "dark" ? "/HeaderName2.png" : "/HeaderName.png"}
              alt="StokPro Logo"
              style={{ height: "24px", maxWidth: "120px", objectFit: "contain", flexShrink: 0 }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/browserlogo.svg";
              }}
            />
          </div>
          <button onClick={() => setMobileOpen(false)} className="nb-kapat-btn">
            ×
          </button>
        </div>

        <div className="nb-mobil-body">
          <NavLinks mobile />
        </div>

        <div className="nb-mobil-footer">
          {user && (
            <div className="nb-mobil-user">
              <div className="nb-avatar small" style={{ overflow: "hidden", padding: 0 }}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="İşletme Logosu"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : user.email ? (
                  user.email[0].toUpperCase()
                ) : (
                  "U"
                )}
              </div>
              <div className="nb-user-info">
                <span>{user.email}</span>
                <small>Aktif Oturum</small>
              </div>
            </div>
          )}
          <div className="nb-mobil-aksiyonlar">
            <button
              onClick={() => {
                setMobileOpen(false);
                router.push("/settings");
              }}
              className="modern-btn secondary"
            >
              <FiSettings size={16} /> Ayarlar
            </button>
            <button onClick={handleLogout} className="modern-btn danger">
              <FiLogOut size={16} /> Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="nb-header">
        <div className="nb-container">
          <div
            className="nb-logo-bolumu"
            onClick={() => router.push("/")}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <img
              src={theme === "dark" ? "/HeaderName2.png" : "/HeaderName.png"}
              alt="StokPro Logo"
              style={{ height: "28px", maxWidth: "140px", objectFit: "contain", flexShrink: 0 }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/browserlogo.svg";
              }}
            />
          </div>

          {user && (
            <nav className="nb-nav-masaustu">
              <NavLinks />
            </nav>
          )}

          <div className="nb-aksiyonlar">
            <button onClick={handleTheme} className="nb-icon-btn theme-toggle" title="Temayı Değiştir">
              {theme === "dark" ? <IoSunny size={18} /> : <FaMoon size={18} />}
            </button>

            {user && (
              <>
                <div className="nb-profil-wrapper" ref={menuRef}>
                  <button className={`nb-profil-btn ${open ? "acik" : ""}`} onClick={() => setOpen(!open)}>
                    <div className="nb-avatar" style={{ overflow: "hidden", padding: 0 }}>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="İşletme Logosu"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : user.email ? (
                        user.email[0].toUpperCase()
                      ) : (
                        "U"
                      )}
                    </div>
                    <span className="nb-kullanici-adi">Hesabım</span>
                  </button>

                  {open && (
                    <div className="nb-dropdown">
                      <div className="nb-dropdown-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {logoUrl && (
                          <img
                            src={logoUrl}
                            alt="İşletme Logosu"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              objectFit: "cover",
                              border: "1px solid var(--border-main)",
                            }}
                          />
                        )}
                        <div>
                          <strong style={{ fontSize: "0.85rem" }}>{user.email}</strong>
                          <small style={{ display: "block", color: "var(--text-muted)" }}>
                            Aktif Oturum Hesabı
                          </small>
                        </div>
                      </div>
                      <div className="nb-dropdown-items">
                        <button
                          onClick={() => {
                            setOpen(false);
                            router.push("/settings");
                          }}
                        >
                          <FiSettings size={16} style={{ color: "var(--primary)" }} /> Profil & Ayarlar
                        </button>
                        <button onClick={handleLogout} className="nb-danger">
                          <FiLogOut size={16} /> Oturumu Kapat
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className={`nb-hamburger ${mobileOpen ? "aktif" : ""}`}
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  <div className="nb-bar bar1"></div>
                  <div className="nb-bar bar2"></div>
                  <div className="nb-bar bar3"></div>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {mounted && mobileOpen && ReactDOM.createPortal(<MobileMenuOverlay />, document.body)}
    </>
  );
}
