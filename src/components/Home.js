import "../styles/global.css";
import "../styles/Home.css";

import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import Info from "./info";

export default function Home() {
  const nav = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <div className="page-home container">
      <div className="card card-home">
        <h1 className="home-title">StokPro</h1>
        <p className="home-sub">
          Basit, hızlı ve güvenilir stok yönetimi — satış, barkod, veresiye ve muhasebe entegrasyonu.
        </p>

        <div className="home-cta-row">
          <button className="btn btn-primary home-cta-button" onClick={() => nav("/register")}>
            Hemen Başla
          </button>
        </div>

        <div className="home-info">
          <Info />
        </div>
      </div>
    </div>
  );
}