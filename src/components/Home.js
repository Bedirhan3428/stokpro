import "../styles/Home.css"; // Yeni CSS dosyasını import ediyoruz
import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Info from "./info";

export default function Home() {
  const nav = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <div className="home-kapsul">
      <div className="home-kart">
        <h1 className="home-baslik">StokPro</h1>
        <p className="home-alt">
          İşletmeniz için basit, hızlı ve güvenilir stok yönetimi. 
          Satış, barkod, veresiye ve muhasebe işlemlerini tek bir yerden yönetin.
        </p>

        <div className="home-cta">
          <button 
            className="home-btn" 
            onClick={() => nav(user ? "/dashboard" : "/register")}
            aria-label="Hemen Başla"
          >
            {user ? "Panele Git" : "Hemen Başla"}
          </button>
        </div>

        <div className="home-info">
          <Info />
        </div>
      </div>
    </div>
  );
}