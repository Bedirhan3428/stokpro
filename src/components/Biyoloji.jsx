import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Dna, Eye, Activity, Bone, FlaskConical, Ear, Droplets, ArrowRight } from 'lucide-react';

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Klavye ok tuşları desteği
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const PageIndicator = () => (
    <div className="flex gap-1 mb-4">
      {[...Array(totalPages)].map((_, i) => (
        <div 
          key={i} 
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i + 1 === currentPage ? 'bg-blue-500 w-4' : 'bg-zinc-800'}`}
        />
      ))}
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="text-blue-500" size={32} />
              <h2 className="text-3xl font-bold">Gözün Yapısı</h2>
            </div>
            <div className="space-y-6">
              <section className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-xl font-bold text-blue-400 mb-3 underline">1. Sert Tabaka (Sklera)</h3>
                <p className="text-zinc-300 leading-relaxed">Bağ dokudan oluşur. Gözü dıştan sarar ve korur. Ön tarafta kubbeleşerek <span className="text-white font-bold">Kornea (Saydam Tabaka)</span>'yı oluşturur. Işık ilk burada kırılır.</p>
              </section>
              <section className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-xl font-bold text-blue-400 mb-3 underline">2. Damar Tabaka (Koroit)</h3>
                <p className="text-zinc-300 mb-4">Besleyen damarlar buradadır. İris, Göz Bebeği ve Mercek bu tabakada yer alır.</p>
                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                  <p className="font-bold text-white mb-2 underline">Göz Uyumu:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <li><span className="text-blue-400 font-bold">YAKIN:</span> Kirpiksi kaslar KASILIR, asıcı bağlar GEVŞER, mercek kalınlaşır.</li>
                    <li><span className="text-zinc-400 font-bold">UZAK:</span> Kirpiksi kaslar GEVŞER, asıcı bağlar KASILIR, mercek incelir.</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-green-500" size={32} />
              <h2 className="text-3xl font-bold">Kas Kasılması</h2>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
              <p className="text-zinc-400 italic mb-4">Kimyasal kasılma sırası (Eksiksiz):</p>
              {[
                "Motor uç plaktan Asetilkolin salgılanır.",
                "Kas hücresi zarında (Sarkolemma) depolarizasyon başlar.",
                "Uyarı T-tüplerle Sarkoplazmik Retikulum'a (SR) iletilir.",
                "SR'den sitoplazmaya Ca2+ (Kalsiyum) iyonları dökülür.",
                "Ca2+, aktin üzerindeki proteini çekerek miyozinin bağlanma yerini açar.",
                "ATP harcanarak aktin iplikleri miyozin üzerinde kayar (Kasılma)."
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">{idx + 1}</span>
                  <p className="text-zinc-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="text-red-500" size={32} />
              <h2 className="text-3xl font-bold">Göz Kusurları</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-900/10 border border-red-500/20 p-5 rounded-2xl">
                <h3 className="text-xl font-bold text-red-400 mb-2">Miyopi</h3>
                <p className="text-sm text-zinc-400 mb-4">Göz küresi uzun, görüntü retinanın önüne düşer.</p>
                <div className="bg-black p-3 rounded-lg text-center font-black text-red-500 tracking-widest border border-red-500/30">K - U - M</div>
                <p className="text-[10px] text-zinc-500 mt-1 text-center font-bold">Kalın Mercek - Uzak - Miyop</p>
              </div>
              <div className="bg-green-900/10 border border-green-500/20 p-5 rounded-2xl">
                <h3 className="text-xl font-bold text-green-400 mb-2">Hipermetropi</h3>
                <p className="text-sm text-zinc-400 mb-4">Göz küresi kısa, görüntü retinanın arkasına düşer.</p>
                <div className="bg-black p-3 rounded-lg text-center font-black text-green-500 border border-green-500/30 italic">İNCE KENARLI MERCEK</div>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl col-span-1 md:col-span-2 space-y-2">
                <p><strong>Astigmatizm:</strong> Silindirik Mercek kullanılır.</p>
                <p><strong>Presbitlik:</strong> İnce Kenarlı Mercek kullanılır.</p>
                <p><strong>Şaşılık:</strong> Ameliyatla düzeltilir.</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Bone className="text-amber-500" size={32} />
              <h2 className="text-3xl font-bold">Kemik Dokusu</h2>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-zinc-800 rounded-xl">
                  <h4 className="font-bold text-amber-400">Osteosit</h4>
                  <p className="text-xs text-zinc-400">Canlı Kemik Hücresi</p>
                </div>
                <div className="p-4 bg-zinc-800 rounded-xl">
                  <h4 className="font-bold text-amber-400">Osein</h4>
                  <p className="text-xs text-zinc-400">Ara Madde</p>
                </div>
                <div className="p-4 bg-zinc-800 rounded-xl">
                  <h4 className="font-bold text-green-400">Osteoblast</h4>
                  <p className="text-xs text-zinc-400">Kemik Yapıcı Hücre</p>
                </div>
                <div className="p-4 bg-zinc-800 rounded-xl">
                  <h4 className="font-bold text-red-400">Osteoklast</h4>
                  <p className="text-xs text-zinc-400">Kemik Yıkıcı Hücre</p>
                </div>
              </div>
              <div className="space-y-3 text-sm border-t border-zinc-800 pt-4">
                <p><strong>Havers:</strong> Boyuna dikey kanallar.</p>
                <p><strong>Volkman:</strong> Enine yatay kanallar.</p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                   <p className="text-amber-500 font-bold">Periost (Kemik Zarı):</p>
                   <p className="text-xs">Besler, onarır ve ENİNE büyüme sağlar.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold mb-6">Kas Tipleri Tablosu</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-zinc-800 text-blue-400">
                  <tr>
                    <th className="p-4 border-b border-zinc-700">Özellik</th>
                    <th className="p-4 border-b border-zinc-700">Düz Kas</th>
                    <th className="p-4 border-b border-zinc-700">Çizgili Kas</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-800">
                  <tr><td className="p-4 font-bold text-zinc-500">Çekirdek</td><td className="p-4 text-zinc-300">Tek (Merkez)</td><td className="p-4 text-zinc-300">Çok (Kenar)</td></tr>
                  <tr><td className="p-4 font-bold text-zinc-500">Çalışma</td><td className="p-4 text-zinc-300">İstemsiz</td><td className="p-4 text-zinc-300">İstemli</td></tr>
                  <tr><td className="p-4 font-bold text-zinc-500">Hız</td><td className="p-4 text-zinc-300">Yavaş</td><td className="p-4 text-zinc-300">Hızlı / Yorulur</td></tr>
                  <tr><td className="p-4 font-bold text-zinc-500">Yer</td><td className="p-4 text-zinc-300">İç Organlar</td><td className="p-4 text-zinc-300">İskelet Kasları</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Ear className="text-indigo-500" size={32} />
              <h2 className="text-3xl font-bold">İşitme ve Denge</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
                <h3 className="font-bold text-indigo-400 mb-3 underline">Kulak Kısımları</h3>
                <ul className="text-sm space-y-2 text-zinc-300">
                  <li><strong>Dış:</strong> Kepçe, Yol, Zar.</li>
                  <li><strong>Orta:</strong> Çekiç-Örs-Üzengi, Östaki Borusu.</li>
                  <li><strong>İç:</strong> Dalız, Salyangoz (İşitme), Yarım Daire Kanalları (Denge).</li>
                </ul>
              </div>
              <div className="bg-indigo-900/10 p-5 rounded-2xl border border-indigo-500/20">
                 <h4 className="font-bold text-white mb-2 underline">Önemli!</h4>
                 <p className="text-sm text-zinc-300">İşitme reseptörleri <strong>Corti Organı</strong>'ndadır. Dengeyi <strong>Yarım Daire Kanalları</strong> ve <strong>Otolit Taşları</strong> sağlar.</p>
              </div>
              <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 col-span-1 md:col-span-2">
                 <p className="text-sm"><strong>Dil:</strong> Papilla (tat tomurcuğu). <br/> <strong>Burun:</strong> Kemoreseptörler çabuk yorulur.</p>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <FlaskConical className="text-pink-500" size={32} />
              <h2 className="text-3xl font-bold">Sindirim Hormonları</h2>
            </div>
            <div className="space-y-4">
              {[
                { name: "Gastrin", from: "Mide", to: "Mide", effect: "Mide özsuyu salgısını artırır.", color: "border-blue-500" },
                { name: "Sekretin", from: "Onikiparmak", to: "Pankreas/Karaciğer", effect: "Pankreastan HCO3- salgılatır. Safrayı ürettirir.", color: "border-green-500" },
                { name: "Kolesistokinin", from: "İnce Bağırsak", to: "Pankreas/Safra Kesesi", effect: "Pankreas enzimi salgılatır. Safrayı boşalttırır.", color: "border-pink-500" }
              ].map((h, i) => (
                <div key={i} className={`bg-zinc-900 p-5 rounded-2xl border-l-8 ${h.color} shadow-lg`}>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xl font-bold">{h.name}</h4>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">{h.from}</span>
                  </div>
                  <p className="text-sm text-zinc-300 italic">{h.effect}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Droplets className="text-cyan-500" size={32} />
              <h2 className="text-3xl font-bold">Emilim Yolları</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-3xl">
                <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2 underline uppercase tracking-widest text-sm">1. Kan Yolu</h4>
                <p className="text-[10px] text-zinc-500 mb-4">Glikoz, Aminoasit, B-C Vit., Su, Mineraller.</p>
                <div className="space-y-2 text-[10px] font-mono text-zinc-300">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> İnce Bağırsak Kılcalları</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> Kapı Toplardamarı</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> KARACİĞER</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> Karaciğer Üstü Toplardamarı</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> Alt Ana Toplardamar</div>
                  <div className="flex items-center gap-2 pl-4 font-bold text-white"><ArrowRight size={10}/> SAĞ KULAKÇIK</div>
                </div>
              </div>
              <div className="bg-yellow-900/10 border border-yellow-500/20 p-6 rounded-3xl">
                <h4 className="font-bold text-yellow-400 mb-4 flex items-center gap-2 underline uppercase tracking-widest text-sm">2. Lenf Yolu</h4>
                <p className="text-[10px] text-zinc-500 mb-4">Yağ Asidi, Gliserol, A-D-E-K Vitaminleri.</p>
                <div className="space-y-2 text-[10px] font-mono text-zinc-300">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Lenf Kılcalları (Şilomikron)</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> Peke Sarnıcı</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> Göğüs Kanalı</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> Sol Köprücük Altı Toplardamarı</div>
                  <div className="flex items-center gap-2 pl-4"><ArrowRight size={10}/> Üst Ana Toplardamar</div>
                  <div className="flex items-center gap-2 pl-4 font-bold text-white"><ArrowRight size={10}/> SAĞ KULAKÇIK</div>
                </div>
              </div>
            </div>
            <div className="mt-8 p-6 bg-zinc-900 rounded-2xl border border-zinc-800 text-center">
              <p className="text-zinc-500 italic text-sm">Notların Sonu. Başarılar Bedirhan!</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white pb-32">
      {/* Header */}
      <header className="p-6 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-zinc-900 z-50">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Dna size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none uppercase">Biyoloji Notları</h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Bedirhan İmer Arşivi</p>
            </div>
          </div>
          <div className="bg-zinc-900 px-4 py-1 rounded-full text-xs font-mono font-bold text-blue-400 border border-zinc-800 shadow-xl">
            {currentPage} / {totalPages}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-6 md:p-8 overflow-x-hidden">
        <PageIndicator />
        {renderPage()}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button 
            onClick={prevPage}
            disabled={currentPage === 1}
            className="flex-1 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-20 hover:bg-zinc-800"
          >
            <ChevronLeft size={36} />
          </button>
          <button 
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="flex-[3] h-20 bg-blue-600 rounded-3xl flex items-center justify-center gap-4 text-xl font-black active:scale-95 transition-all disabled:opacity-20 hover:bg-blue-500 shadow-2xl shadow-blue-900/30"
          >
            {currentPage === totalPages ? 'BİTTİ' : 'SONRAKİ SAYFA'}
            {currentPage !== totalPages && <ChevronRight size={32} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;

