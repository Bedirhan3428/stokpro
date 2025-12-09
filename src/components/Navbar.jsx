import "../styles/global.css";
import "../styles/Navbar.css";

import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false); // profile menu
  const [mobileOpen, setMobileOpen] = useState(false); // mobile panel

  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const menuRef = useRef(null);
  const mobileRef = useRef(null);

  // Close menus on outside click or Escape
  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target) && !e.target.closest(".hamburger-button"))
        setMobileOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setOpen(false);
    setMobileOpen(false);
  }, [loc.pathname]);

  async function handleLogout() {
    try {
      await logout();
      nav("/");
    } catch (e) {
      console.error("Çıkış yapılamadı", e);
    }
  }

  const NavLinks = ({ className = "" }) => (
    <div className={`nav-links ${className}`}>
      <Link to="/dashboard" className={`btn ${loc.pathname === "/dashboard" ? "btn-primary" : "btn-ghost"}`}>Dashboard</Link>
      <Link to="/products" className={`btn ${loc.pathname === "/products" ? "btn-primary" : "btn-ghost"}`}>Ürünler</Link>
      <Link to="/sales" className={`btn ${loc.pathname === "/sales" ? "btn-primary" : "btn-ghost"}`}>Satış</Link>
      <Link to="/customers" className={`btn ${loc.pathname === "/customers" ? "btn-primary" : "btn-ghost"}`}>Müşteriler</Link>
      <Link to="/accounting" className={`btn ${loc.pathname === "/accounting" ? "btn-primary" : "btn-ghost"}`}>Muhasebe</Link>
    </div>
  );

  return (
    <header className="app-header card navbar" role="banner" aria-label="Main navigation">
      <div className="navbar-left">
        <div className="brand" aria-hidden={false}>
          <div className="logo" aria-hidden> S </div>
          <div className="brand-text">
            <div className="brand-name">StokPro</div>
            <small className="brand-tag">Hızlı · Güvenilir · Modern</small>
          </div>
        </div>
      </div>

      <nav className="navbar-right" aria-label="Site navigation">
        <div className="nav-row">
          {/* Desktop: show full nav inline. Mobile/tablet: hidden via CSS. */}
          {user && <NavLinks className="desktop-only" />}

          {/* Mobile hamburger: shown only on phone/tablet via CSS */}
          {user && (
            <button
              className={`hamburger-button ${mobileOpen ? "is-open" : ""}`}
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={mobileOpen}
              onClick={() => {
                setMobileOpen((s) => !s);
                setOpen(false);
              }}
            >
              <span className="hamburger-box">
                <span className="hamburger-inner" />
              </span>
            </button>
          )}

          {/* Profile dropdown (desktop/tablet) */}
          {user ? (
            <div ref={menuRef} className="profile-container">
              <button
                className="btn btn-ghost profile-button"
                onClick={() => {
                  setOpen((s) => !s);
                  setMobileOpen(false);
                }}
                aria-expanded={open}
                aria-controls="profile-menu"
                title="Profil"
              >
                Profil
              </button>

              {open && (
                <div id="profile-menu" className="profile-menu-outer" role="menu" aria-label="Profil menüsü">
                  <div className="card profile-card">
                    <div className="profile-email" title={user.email}>{user.email}</div>
                    <div className="profile-sub muted">Hesap</div>
                    <div className="profile-actions">
                      <button className="btn btn-ghost" onClick={() => { setOpen(false); nav("/settings"); }}>Ayarlar</button>
                      <button className="btn btn-danger" onClick={handleLogout}>Çıkış</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div aria-hidden className="visually-hidden-placeholder" />
          )}
        </div>
      </nav>

      {/* Mobile panel: contains all links (visible only on small screens) */}
      {user && (
        <div className={`mobile-backdrop ${mobileOpen ? "visible" : ""}`} aria-hidden={!mobileOpen}>
          <div ref={mobileRef} className={`mobile-nav ${mobileOpen ? "open" : ""}`} role="dialog" aria-label="Mobil menü" tabIndex={-1}>
            <div className="mobile-nav-header">
              <div className="brand mobile-brand">
                <div className="logo">S</div>
                <div className="brand-text">
                  <div className="brand-name">StokPro</div>
                  <small className="brand-tag">Hızlı · Güvenilir</small>
                </div>
              </div>
              <button className="btn btn-ghost mobile-close" onClick={() => setMobileOpen(false)} aria-label="Kapat">Kapat</button>
            </div>

            <div className="mobile-links">
              <NavLinks className="mobile" />
            </div>

            <div className="mobile-profile">
              <div className="profile-email" title={user.email}>{user.email}</div>
              <div className="profile-sub muted">Hesap</div>
              <div className="profile-actions mobile">
                <button className="btn btn-ghost" onClick={() => { setMobileOpen(false); nav("/settings"); }}>Ayarlar</button>
                <button className="btn btn-danger" onClick={handleLogout}>Çıkış</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}