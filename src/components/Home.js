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

  // Yeni özellikler listesi için basit stil objesi
  const featureStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
    margin: '20px 0',
    padding: '0 10px'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.95rem',
    color: '#444'
  };

  return (
    <div className="home-kapsul">
      <div className="home-kart">

        {/* 1. VURUCU BAŞLIK (Problem-Çözüm) */}
        <h1 className="home-baslik" style={{ fontSize: '2rem', lineHeight: '1.2', marginBottom: '10px' }}>
          Karmaşık Defterlere Son: <br />
          <span style={{ color: '#2563eb' }}>Stoklarını ve Veresiyelerini Dijitalde Yönetin.</span>
        </h1>

        {/* 2. KISA VE ÖZ MADDELER (Neden Kullanayım?) */}
        <div style={featureStyle}>
          <div style={itemStyle}>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
            <div>
              <strong>Hızlı Stok Girişi:</strong> Saniyeler içinde ürün ekle.
            </div>
          </div>
          <div style={itemStyle}>
            <span style={{ fontSize: '1.2rem' }}>💰</span>
            <div>
              <strong>Veresiye Takibi:</strong> Kimin ne kadar borcu var unutma.
            </div>
          </div>
          <div style={itemStyle}>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <div>
              <strong>Anlık Rapor:</strong> Ay sonu hesabını tek tıkla gör.
            </div>
          </div>
        </div>

        {/* CTA BÖLÜMÜ */}
        <div className="home-cta" style={{ marginTop: '20px' }}>
          <button 
            className="home-btn" 
            onClick={() => navigate(user ? "/dashboard" : "/register")}
            aria-label="Hemen Başla"
            style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            {user ? "Panele Git" : "Hemen Başla"}
          </button>

          {/* 3. GÜVEN NOTU */}
          {!user && (
            <p className="no-card-note" style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666' }}>
              Ücretsizdir ve kurulum gerektirmez.
            </p>
          )}
        </div>

        {/* YASAL UYARI METNİ */}
        <div className="home-yasal" style={{ marginTop: '30px' }}>
          Uygulamayı kullanarak veya kayıt olarak <Link to="/terms-of-service">Hizmet Şartları</Link>'nı ve <Link to="/privacy-policy">Gizlilik Politikası</Link>'nı kabul etmiş sayılırsınız.
        </div>

        <div className="home-info">
          <Info />
        </div>
      </div>
    </div>
  );
}

