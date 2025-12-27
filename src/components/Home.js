import "../styles/Home.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // v6 için useNavigate şart
import { auth } from "../firebase";
import Info from "./info"; 

export default function Home() {
  const navigate = useNavigate(); // useHistory yerine bunu kullanıyoruz
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

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
            onClick={() => navigate(user ? "/dashboard" : "/register")}
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


