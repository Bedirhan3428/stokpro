import "../styles/Navbar.css";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { initTheme, toggleTheme } from "../utils/theme";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const menuRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    setTheme(initTheme());
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target) && !e.target.closest(".nb-hamburger"))
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

  function handleToggleTheme() {
    setTheme((prev) => toggleTheme(prev));
  }

  const NavLinks = ({ className = "" }) => (
    <div className={`nb-linkler ${className}`}>
      <Link to="/dashboard" className={`nb-link ${loc.pathname === "/dashboard" ? "secili" : ""}`}>Dashboard</Link>
      <Link to="/products" className={`nb-link ${loc.pathname === "/products" ? "secili" : ""}`}>Ürünler</Link>
      <Link to="/sales" className={`nb-link ${loc.pathname === "/sales" ? "secili" : ""}`}>Satış</Link>
      <Link to="/customers" className={`nb-link ${loc.pathname === "/customers" ? "secili" : ""}`}>Müşteriler</Link>
      <Link to="/accounting" className={`nb-link ${loc.pathname === "/accounting" ? "secili" : ""}`}>Muhasebe</Link>
    </div>
  );

  return (
    <header className="nb-ust" role="banner" aria-label="Ana gezinme">
      <div className="nb-sol">
        <div className="nb-marka" aria-hidden={false}>
          <div className="nb-logo" aria-hidden> S </div>
          <div className="nb-metin">
            <div className="nb-ad">StokPro</div>
            <small className="nb-alt">Hızlı · Güvenilir · Modern</small>
          </div>
        </div>
      </div>

      <nav className="nb-sag" aria-label="Site navigation">
        <div className="nb-satir">
          {user && <NavLinks className="nb-masaustu" />}

          {/* Tema anahtarı */}
          <button
            className="nb-profil-btn"
            onClick={handleToggleTheme}
            aria-label={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
            title={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
            style={{ marginRight: "6px" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {user && (
            <button
              className={`nb-hamburger ${mobileOpen ? "acik" : ""}`}
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={mobileOpen}
              onClick={() => {
                setMobileOpen((s) => !s);
                setOpen(false);
              }}
            >
              <span className="nb-hamburger-ic" />
            </button>
          )}

          {user ? (
            <div ref={menuRef} className="nb-profil">
              <button
                className="nb-profil-btn"
                onClick={() => {
                  setOpen((s) => !s);
                  setMobileOpen(false);
                }}
                aria-expanded={open}
                aria-controls="profil-menu"
                title="Profil"
              >
                Profil
              </button>

                {open && (
                  <div id="profil-menu" className="nb-profil-menu" role="menu" aria-label="Profil menüsü">
                    <div className="nb-profil-kart">
                      <div className="nb-mail" title={user.email}>{user.email}</div>
                      <div className="nb-alt">Hesap</div>
                      <div className="nb-profil-aks">
                        <button className="nb-profil-link" onClick={() => { setOpen(false); nav("/settings"); }}>Ayarlar</button>
                        <button className="nb-cikis" onClick={handleLogout}>Çıkış</button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div aria-hidden className="nb-bos" />
          )}
        </div>
      </nav>

      {user && (
        <div className={`nb-mobil-arka ${mobileOpen ? "gorunur" : ""}`} aria-hidden={!mobileOpen}>
          <div ref={mobileRef} className={`nb-mobil ${mobileOpen ? "acik" : ""}`} role="dialog" aria-label="Mobil menü" tabIndex={-1}>
            <div className="nb-mobil-ust">
              <div className="nb-marka">
                <div className="nb-logo">S</div>
                <div className="nb-metin">
                  <div className="nb-ad">StokPro</div>
                  <small className="nb-alt">Hızlı · Güvenilir</small>
                </div>
              </div>
              <button className="nb-profil-link" onClick={() => setMobileOpen(false)} aria-label="Kapat">
                Kapat
              </button>
            </div>

            <div className="nb-mobil-linkler">
              <NavLinks className="nb-mobil-list" />
            </div>

            <div className="nb-mobil-profil">
              <div className="nb-mail" title={user.email}>{user.email}</div>
              <div className="nb-alt">Hesap</div>
              <div className="nb-profil-aks">
                <button className="nb-profil-link" onClick={() => { setMobileOpen(false); nav("/settings"); }}>Ayarlar</button>
                <button className="nb-cikis" onClick={handleLogout}>Çıkış</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}