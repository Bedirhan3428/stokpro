import "../styles/Home.css";
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Info from "./info"; 

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <div className="home-kapsul">
      <div className="home-kart">
        
        {/* YENİ: Ücretsiz Rozeti */}
        <div className="free-badge">✨ Artık Tamamen Ücretsiz!</div>

        <h1 className="home-baslik">StokPro</h1>
        <p className="home-alt">
          İşletmeniz için <strong>ücretsiz</strong>, basit ve güvenilir stok yönetimi. 
          Satış, barkod, veresiye ve muhasebe işlemlerini tek bir yerden, 
          hiçbir ücret ödemeden yönetin.
        </p>

        <div className="home-cta">
          <button 
            className="home-btn" 
            onClick={() => navigate(user ? "/dashboard" : "/register")}
            aria-label="Ücretsiz Başla"
          >
            {user ? "Panele Git" : "Ücretsiz Başla"}
          </button>
          
          {/* YENİ: Kredi kartı gerekmez notu */}
          {!user && <p className="no-card-note">Kredi kartı gerekmez.</p>}
        </div>

        {/* YASAL UYARI METNİ */}
        <div className="home-yasal">
          Uygulamayı kullanarak veya kayıt olarak <Link to="/terms-of-service">Hizmet Şartları</Link>'nı ve <Link to="/privacy-policy">Gizlilik Politikası</Link>'nı kabul etmiş sayılırsınız.
        </div>

        <div className="home-info">
          <Info />
        </div>
      </div>
    </div>
  );
}
