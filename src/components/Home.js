import "../styles/Home.css";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { auth } from "../firebase";
import Info from "./info"; // Dosya adı büyük/küçük harf duyarlı olabilir

export default function Home() {
  const history = useHistory();
  const [user, setUser] = useState(null);

  // Kullanıcı durumunu dinlemek için useEffect ekledik
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
            onClick={() => history.push(user ? "/dashboard" : "/register")}
            aria-label="Hemen Başla"
          >
            {user ? "Panele Git" : "Hemen Başla"}
          </button>
        </div>

        <div className="home-info">
          {/* Info bileşeni varsa gösterir, yoksa hata vermemesi için kontrol edebilirsin */}
          <Info />
        </div>
      </div>
    </div>
  );
}