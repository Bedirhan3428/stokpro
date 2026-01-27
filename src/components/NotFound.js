import "../styles/NotFound.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiAlertTriangle } from "react-icons/fi";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="nf-container">
      <div className="nf-content">
        
        {/* Animasyonlu Kablo Alanı */}
        <div className="cable-scene">
          <div className="cable cable-left">
            <div className="wire"></div>
            <div className="plug">
              <div className="prong"></div>
              <div className="prong"></div>
            </div>
          </div>
          
          <div className="sparks">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="cable cable-right">
            <div className="socket">
              <div className="slot"></div>
              <div className="slot"></div>
            </div>
            <div className="wire"></div>
          </div>
        </div>

        {/* Metin Alanı */}
        <div className="nf-text-area">
          <h1 className="nf-code">404</h1>
          <h2 className="nf-title">Bağlantı Koptu!</h2>
          <p className="nf-desc">
            Aradığın sayfa depoda kaybolmuş veya raflardan kaldırılmış olabilir. 
            Kabloları kontrol ettik ama burası karanlık.
          </p>
          
          <button onClick={() => navigate("/")} className="nf-btn">
            <FiHome size={18} />
            Ana Sayfaya Dön
          </button>
        </div>

      </div>
      
      <div className="nf-footer">
        <FiAlertTriangle className="nf-icon-f" />
        <span>Sistem Hatası: Yol bulunamadı</span>
      </div>
    </div>
  );
}

