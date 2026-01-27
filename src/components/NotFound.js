import React from "react";
import { FaArrowLeft, FaBookOpen } from "react-icons/fa";

export default function NotFound() {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="not-found-container">
      {/* CSS Kodlarını buraya yazdım, sen bunu NotFound.css dosyana taşıyabilirsin */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');

        /* Genel Sayfa Yapısı */
        .not-found-container {
          min-height: 100vh;
          background-color: #2c241b;
          background-image: radial-gradient(circle at center, #433022, #1a1612);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Playfair Display', serif;
          overflow: hidden;
        }

        /* Sayfa Perspektif Alanı */
        .page-wrapper {
          position: relative;
          width: 100%;
          max-width: 500px;
          perspective: 1000px;
        }

        /* Yırtık Kağıt Efekti */
        .torn-paper {
          position: relative;
          background-color: #fdfbf7;
          color: #333;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          transform: rotate(-2deg);
          transition: transform 0.5s ease-out;
          
          /* Yırtık Kenar Oluşturma (CSS Clip-path) */
          clip-path: polygon(
            2% 0%, 98% 1%, 100% 100%, 0% 98%
          );
          
          /* Hafif Satır Çizgileri */
          background-image: linear-gradient(#e5e5e5 1px, transparent 1px);
          background-size: 100% 2rem;
        }

        .torn-paper:hover {
          transform: rotate(0deg) scale(1.02);
        }

        /* Sol Taraftaki Spiral Delikleri */
        .holes {
          position: absolute;
          top: 0;
          left: 15px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          align-items: center;
        }

        .hole {
          width: 15px;
          height: 15px;
          background-color: #2c241b;
          border-radius: 50%;
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5);
          opacity: 0.8;
        }

        /* İçerik Kutusu (Çerçeve) */
        .content-box {
          border: 4px double #d6d3c9;
          background-color: rgba(255, 254, 240, 0.9);
          padding: 30px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* Header: Bölüm Başlığı */
        .chapter-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #d6d3c9;
          padding-bottom: 10px;
          color: #8c8880;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-family: sans-serif;
        }

        /* Büyük 404 Başlığı */
        .title-404-container {
          position: relative;
          margin: 10px 0;
        }

        .title-404 {
          font-size: 8rem;
          line-height: 1;
          font-weight: 900;
          color: #2c241b;
          margin: 0;
          letter-spacing: -5px;
        }

        /* Kırmızı Kalem Çizgisi */
        .red-line {
          position: absolute;
          bottom: 10px;
          left: 0;
          width: 100%;
          height: 5px;
          background-color: #8b0000;
          opacity: 0.6;
          border-radius: 50%;
          transform: rotate(-2deg);
        }

        /* Alt Başlık */
        .subtitle {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          color: #1a1612;
        }

        /* Açıklama Metni */
        .description {
          font-size: 1.1rem;
          color: #5d554a;
          font-style: italic;
          line-height: 1.6;
          max-width: 300px;
          margin: 0 auto;
        }

        .error-code {
          font-size: 0.8rem;
          color: #999;
          font-family: sans-serif;
          font-style: normal;
          margin-top: 5px;
        }

        /* İkonlar */
        .book-icon {
          color: #d6d3c9;
          margin: 10px 0;
        }

        /* Buton Stili */
        .home-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background-color: #2c241b;
          color: #fdfbf7;
          border: 1px solid #5d554a;
          font-family: sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }

        .home-button:hover {
          background-color: #4a3b2f;
          transform: translateY(-2px);
          box-shadow: 0 6px 10px rgba(0,0,0,0.3);
        }

        /* Sayfa Numarası */
        .page-number {
          position: absolute;
          bottom: 20px;
          right: 30px;
          font-size: 0.9rem;
          color: #8c8880;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .title-404 {
            font-size: 5rem;
          }
          .torn-paper {
            padding: 20px;
          }
        }
      `}</style>

      <div className="page-wrapper">
        <div className="torn-paper">
          {/* Sol Kenar Delikleri */}
          <div className="holes">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="hole" />
            ))}
          </div>

          <div className="content-box">
            <div className="chapter-header">
              <span>Bölüm ??</span>
              <span>Kayıp Sayfa</span>
            </div>

            <div className="title-404-container">
              <h1 className="title-404">404</h1>
              <div className="red-line"></div>
            </div>

            <div className="text-content">
              <h2 id="nf-title" className="subtitle">
                Sayfa Bulunamadı
              </h2>
              <p className="description">
                "Aradığınız sayfa bu hikayenin bir parçası değil... Belki de rüzgar onu alıp götürmüştür."
              </p>
              <p className="error-code">
                (Hata: Sayfa mevcut değil veya taşınmış olabilir)
              </p>
            </div>

            <div className="book-icon">
              <FaBookOpen size={40} />
            </div>

            <button onClick={handleGoHome} className="home-button">
              <FaArrowLeft />
              Ana Sayfaya Dön
            </button>
          </div>

          <div className="page-number">Sayfa 404</div>
        </div>
      </div>
    </div>
  );
}


