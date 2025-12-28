import "../styles/Navbar.css";
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { initTheme, toggleTheme } from "../utils/theme";
import { FaMoon } from "react-icons/fa6";
import { IoSunny } from "react-icons/io5";
import { TbCircleLetterSFilled } from "react-icons/tb";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const menuRef = useRef(null);

  // Tema Başlangıcı
  useEffect(() => { setTheme(initTheme()); }, []);

  // Profil menüsü dışına tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sayfa değişince her şeyi kapat
  useEffect(() => {
    setOpen(false);
    setMobileOpen(false);
  }, [loc.pathname]);

  // Mobil menü açıldığında sayfa kaydırmayı engelle
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [mobileOpen]);

  const handleLogout = async () => {
    try { await logout(); nav("/"); } catch (e) { console.error(e); }
  };

  const handleTheme = () => setTheme(prev => toggleTheme(prev));

  const NavLinks = ({ mobile = false }) => (
    <div className={mobile ? "nb-mobil-list" : "nb-masaustu-list"}>
      <Link to="/dashboard" className={`nb-link ${loc.pathname === "/dashboard" ? "aktif" : ""}`}>Dashboard</Link>
      <Link to="/products" className={`nb-link ${loc.pathname === "/products" ? "aktif" : ""}`}>Ürünler</Link>
      <Link to="/sales" className={`nb-link ${loc.pathname === "/sales" ? "aktif" : ""}`}>Satış</Link>
      <Link to="/customers" className={`nb-link ${loc.pathname === "/customers" ? "aktif" : ""}`}>Müşteriler</Link>
      <Link to="/accounting" className={`nb-link ${loc.pathname === "/accounting" ? "aktif" : ""}`}>Muhasebe</Link>
    </div>
  );

  return (
    <header className="nb-header">
      <div className="nb-container">

        {/* SOL: LOGO */}
        <div className="nb-logo-bolumu" onClick={() => nav("/")} style={{cursor: 'pointer'}}>
          <div className="nb-logo-ikon"><TbCircleLetterSFilled /></div>
          <div className="nb-logo-yazi">
            <span className="nb-marka">StokPro</span>
            <span className="nb-slogan">Hızlı & Güvenilir</span>
          </div>
        </div>

        {/* ORTA: MASAÜSTÜ LİNKLER */}
        {user && <nav className="nb-nav-masaustu"><NavLinks /></nav>}

        {/* SAG: AKSİYONLAR */}
        <div className="nb-aksiyonlar">
          <button onClick={handleTheme} className="nb-icon-btn theme-toggle" title="Temayı Değiştir">
            {theme === "dark" ? <IoSunny /> : <FaMoon />}
          </button>

          {user && (
            <>
              {/* Profil Menüsü (Masaüstü) */}
              <div className="nb-profil-wrapper" ref={menuRef}>
                <button 
                  className={`nb-profil-btn ${open ? "acik" : ""}`} 
                  onClick={() => setOpen(!open)}
                >
                  <div className="nb-avatar">{user.email[0].toUpperCase()}</div>
                  <span className="nb-kullanici-adi">Hesabım</span>
                </button>

                {open && (
                  <div className="nb-dropdown">
                    <div className="nb-dropdown-header">
                      <strong>{user.email}</strong>
                      <small>Kullanıcı</small>
                    </div>
                    <div className="nb-dropdown-items">
                      <button onClick={() => nav("/settings")}>Ayarlar</button>
                      <button onClick={handleLogout} className="nb-danger">Çıkış Yap</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger Butonu (Mobil) */}
              <button 
                className={`nb-hamburger ${mobileOpen ? "aktif" : ""}`} 
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menüyü Aç/Kapat"
              >
                <div className="nb-bar bar1"></div>
                <div className="nb-bar bar2"></div>
                <div className="nb-bar bar3"></div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* MOBİL MENÜ - Sadece mobileOpen true ise render edilir (DOM'a eklenir) */}
      {user && mobileOpen && (
        <div className="nb-mobil-portal">
          <div className="nb-overlay" onClick={() => setMobileOpen(false)} />
          <div className="nb-mobil-menu">
            <div className="nb-mobil-header">
              <div className="nb-logo-bolumu">
                <div className="nb-logo-ikon small"><TbCircleLetterSFilled /></div>
                <span className="nb-marka">StokPro</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="nb-kapat-btn">×</button>
            </div>

            <div className="nb-mobil-body">
              <NavLinks mobile />
            </div>

            <div className="nb-mobil-footer">
              <div className="nb-mobil-user">
                <div className="nb-avatar small">{user.email[0].toUpperCase()}</div>
                <div className="nb-user-info">
                  <span>{user.email}</span>
                  <small>Aktif Oturum</small>
                </div>
              </div>
              <div className="nb-mobil-aksiyonlar">
                <button onClick={() => nav("/settings")} className="nb-btn-outline">Ayarlar</button>
                <button onClick={handleLogout} className="nb-btn-danger">Çıkış</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

