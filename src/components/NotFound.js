import React from "react";
// react-icons kütüphanesinden FontAwesome ikonlarını kullanıyoruz
import { FaArrowLeft, FaBookOpen } from "react-icons/fa";

export default function TornPage404() {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#2c241b] flex items-center justify-center p-4 overflow-hidden relative font-serif">
      {/* Arka plan için ahşap masa hissi veren gradient */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900 via-stone-900 to-black pointer-events-none" />

      {/* Sayfa Container */}
      <div className="relative w-full max-w-lg perspective-1000">
        
        {/* Kağıt Efekti */}
        <div 
          className="relative bg-[#fdfbf7] text-gray-800 p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-1 transition-transform hover:rotate-0 duration-500 ease-out"
          style={{
            clipPath: "polygon(2% 0%, 98% 1%, 100% 100%, 0% 98%)",
            backgroundImage: "linear-gradient(#e5e5e5 1px, transparent 1px)", 
            backgroundSize: "100% 2rem"
          }}
        >
          {/* Sol Kenar Yırtık Süsü - Spiral Delikleri */}
          <div className="absolute top-0 left-0 w-8 h-full flex flex-col justify-evenly items-center -translate-x-1/2">
             {[...Array(10)].map((_, i) => (
               <div key={i} className="w-4 h-4 rounded-full bg-[#2c241b] shadow-inner opacity-80" />
             ))}
          </div>

          {/* Yırtık Kenar Dokusu (Sol Taraf) */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-stone-300 opacity-50 mix-blend-multiply"></div>

          {/* İçerik Kutusu */}
          <div className="flex flex-col items-center text-center space-y-6 border-4 border-double border-stone-300 p-6 bg-[#fffef0]">
            
            {/* Üst Kısım */}
            <div className="w-full flex justify-between items-center border-b border-stone-300 pb-2 text-stone-500 text-sm uppercase tracking-widest">
              <span>Bölüm ??</span>
              <span>Kayıp Sayfa</span>
            </div>

            {/* Büyük 404 */}
            <div className="relative">
              <h1 className="text-8xl md:text-9xl font-black text-stone-800 tracking-tighter opacity-90 select-none" style={{ fontFamily: '"Playfair Display", serif' }}>
                404
              </h1>
              {/* Altı çizili kırmızı kalem efekti */}
              <div className="absolute -bottom-2 w-full h-1 bg-red-800 opacity-60 transform -rotate-2 rounded-full"></div>
            </div>

            {/* Metinler */}
            <div className="space-y-3">
              <h2 id="nf-title" className="text-2xl md:text-3xl font-bold text-stone-900">
                Sayfa Bulunamadı
              </h2>
              <p className="nf-alt text-lg text-stone-600 italic leading-relaxed max-w-xs mx-auto">
                "Aradığınız sayfa bu hikayenin bir parçası değil... Belki de rüzgar onu alıp götürmüştür."
              </p>
              <p className="text-sm text-stone-400 mt-2 font-sans not-italic">
                (Hata Kodu: Sayfa mevcut değil veya taşınmış)
              </p>
            </div>

            {/* Kitap İkonu (React Icons) */}
            <div className="text-stone-300 my-4">
              <FaBookOpen size={48} />
            </div>

            {/* Buton (React Icons) */}
            <button
              onClick={handleGoHome}
              className="mt-4 flex items-center gap-2 px-6 py-2 bg-stone-800 text-[#fffef0] text-sm tracking-wide font-medium hover:bg-stone-700 transition-colors shadow-md border border-stone-600"
            >
              <FaArrowLeft size={16} />
              Ana Sayfaya Dön
            </button>
          </div>

          {/* Alt Sayfa Numarası */}
          <div className="absolute bottom-4 right-8 text-stone-400 font-serif italic text-sm">
            Sayfa 404
          </div>
        </div>

        {/* Arka Gölge */}
        <div className="absolute top-4 left-4 w-full h-full bg-black opacity-40 blur-lg -z-10 rounded-sm transform rotate-2"></div>
      </div>
    </div>
  );
}


