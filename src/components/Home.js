import "../styles/Home.css"; 
import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Info from "../components/info"; 

export default function Home() {
  const nav = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <div className="home-kapsul">
      {/* Arka Plan Efektleri */}
      <div className="home-bg-blob blob-1"></div>
      <div className="home-bg-blob blob-2"></div>

      <div className="home-kart">
        <div className="home-ikon-kutusu">🚀</div>
        <h1 className="home-baslik">StokPro</h1>
        <p className="home-alt">
          İşletmeniz için <strong>basit, hızlı ve güvenilir</strong> stok yönetimi. 
          <br />
          Satış, barkod, veresiye ve muhasebe işlemlerini tek bir yerden yönetin.
        </p>

        <div className="home-cta">
          <button 
            className="home-btn primary" 
            onClick={() => nav(user ? "/dashboard" : "/register")}
          >
            {user ? "Panele Git" : "Hemen Başla"}
          </button>
        </div>

        <div className="home-info-wrapper">
          <Info />
        </div>
      </div>
    </div>
  );
}

