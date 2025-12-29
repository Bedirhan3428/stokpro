import React, { useState, useEffect } from 'react';
import { 
  FaEye, 
  FaBone, 
  FaDna, 
  FaEarListen, 
  FaDroplet, 
  FaArrowRight, 
  FaArrowLeft, 
  FaBacteria, 
  FaStethoscope,
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa6';

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage]);

  const Section = ({ title, icon: Icon, children, color = "blue" }) => (
    <div className={`bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 mb-6 shadow-xl animate-in fade-in zoom-in duration-500`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500`}>
          <Icon size={24} />
        </div>
        <h3 className={`text-xl font-bold text-white tracking-tight`}>{title}</h3>
      </div>
      <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6">1. Gözün Yapısı</h2>
            <Section title="Sert Tabaka (Sklera)" icon={FaEye} color="blue">
              <p>Gözü dıştan sarar, korur ve şekil verir. Bağ doku yapılıdır.</p>
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <span className="text-blue-400 font-bold">Kornea (Saydam Tabaka):</span> Ön tarafta ışığın ilk kırıldığı yerdir. Kan damarı bulunmaz, lenf sıvısı ile beslenir.
              </div>
            </Section>
            <Section title="Damar Tabaka (Koroit)" icon={FaEye} color="blue">
              <p>Besleyen damarlar buradadır. <span className="text-white font-bold">İris, Göz Bebeği ve Mercek</span> bu tabakada yer alır.</p>
              <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                <h4 className="font-bold text-white mb-2 underline">Göz Uyumu (Netleme)</h4>
                <ul className="space-y-2">
                  <li>• <span className="text-blue-300 font-bold">Yakın:</span> Kirpiksi kaslar KASILIR, asıcı bağlar GEVŞER, mercek kalınlaşır (küreleşir).</li>
                  <li>• <span className="text-zinc-400 font-bold">Uzak:</span> Kirpiksi kaslar GEVŞER, asıcı bağlar KASILIR, mercek incelir.</li>
                </ul>
              </div>
            </Section>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 text-green-500">2. Kas Kasılma Mekanizması</h2>
            <Section title="Kimyasal Süreç" icon={FaDna} color="green">
              <div className="space-y-4">
                {[
                  "Motor uç plaktan Asetilkolin salgılanır.",
                  "Sarkolemma (kas zarı) uyarılır ve depolarizasyon başlar.",
                  "Uyarı T-tüpleriyle Sarkoplazmik Retikulum'a (SR) iletilir.",
                  "SR'den sitoplazmaya Ca2+ (Kalsiyum) iyonları dökülür.",
                  "Ca2+, aktin üzerindeki engelleyici proteini çekerek yolu açar.",
                  "ATPaz enzimi aktifleşir, ATP parçalanır ve Aktinler Miyozin üzerinde kayar."
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <span className="text-2xl font-black text-green-500/30">0{i+1}</span>
                    <p className="font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 text-red-500">3. Göz Kusurları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-[2rem] shadow-xl">
                <h3 className="text-2xl font-bold text-red-400 mb-2">Miyopi</h3>
                <p className="text-sm text-zinc-400 mb-4 italic">Uzağı net göremez. Görüntü retinanın önüne düşer.</p>
                <div className="bg-black p-4 rounded-2xl text-center font-black text-3xl tracking-widest text-red-500 shadow-inner border border-red-500/20 uppercase">
                  K U M
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 text-center font-bold">KALIN MERCEK • UZAK • MİYOP</p>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-[2rem] shadow-xl">
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Hipermetropi</h3>
                <p className="text-sm text-zinc-400 mb-4 italic">Yakını net göremez. Görüntü arkaya düşer.</p>
                <div className="bg-black p-4 rounded-2xl text-center font-black text-xl text-emerald-500 shadow-inner border border-emerald-500/20">
                  İNCE MERCEK
                </div>
              </div>
            </div>
            <Section title="Diğer Kusurlar" icon={FaStethoscope} color="zinc">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p><strong>Astigmat:</strong> Silindirik Mercek.</p>
                <p><strong>Presbitlik:</strong> İnce Mercek (Yaşlılık).</p>
                <p><strong>Şaşılık:</strong> Kas uyumsuzluğu.</p>
                <p><strong>Katarakt:</strong> Mercek bulanıklaşması.</p>
              </div>
            </Section>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 text-amber-500">4. Kemik Dokusu</h2>
            <Section title="Hücreler ve Yapı" icon={FaBone} color="amber">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800">
                  <span className="font-black text-amber-500">OSTEOSİT</span>
                  <p className="text-[10px] text-zinc-500 uppercase">Hücre</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800">
                  <span className="font-black text-amber-500">OSEİN</span>
                  <p className="text-[10px] text-zinc-500 uppercase">Ara Madde</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800">
                  <span className="font-black text-emerald-500">OSTEOBLAST</span>
                  <p className="text-[10px] text-zinc-500 uppercase">Yapıcı</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800">
                  <span className="font-black text-red-500">OSTEOKLAST</span>
                  <p className="text-[10px] text-zinc-500 uppercase">Yıkıcı</p>
                </div>
              </div>
              <p className="text-sm"><strong>Havers:</strong> Boyuna kanallar. <br/> <strong>Volkman:</strong> Enine kanallar.</p>
              <div className="mt-4 p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl">
                <p className="text-xs font-bold text-white italic">"Periost: Kemik zarı; kemiği besler, onarır ve ENİNE büyütür."</p>
              </div>
            </Section>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6">5. Kas Tipleri Tablosu</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-800/50 text-blue-400">
                  <tr>
                    <th className="p-5">Özellik</th>
                    <th className="p-5">Düz Kas</th>
                    <th className="p-5">Çizgili Kas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr><td className="p-5 font-bold text-zinc-500">Görünüm</td><td className="p-5">Mekik şekilli</td><td className="p-5">Silindirik</td></tr>
                  <tr><td className="p-5 font-bold text-zinc-500">Çalışma</td><td className="p-5 text-emerald-400">İstemsiz</td><td className="p-5 text-blue-400">İstemli</td></tr>
                  <tr><td className="p-5 font-bold text-zinc-500">Hız</td><td className="p-5">Yavaş / Yorulmaz</td><td className="p-5">Hızlı / Yorulur</td></tr>
                  <tr><td className="p-5 font-bold text-zinc-500">Bulunduğu Yer</td><td className="p-5">İç Organlar</td><td className="p-5">İskelet Sistemi</td></tr>
                </tbody>
              </table>
              <div className="p-5 bg-purple-950/20 text-purple-400 text-xs font-bold border-t border-purple-900/30">
                NOT: Kalp Kası yapısal olarak çizgili, çalışma olarak düz kasa benzer.
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 text-indigo-400">6. İşitme ve Duyular</h2>
            <Section title="Kulak Yapısı" icon={FaEarListen} color="indigo">
              <div className="space-y-3">
                <p><strong>Orta Kulak:</strong> Çekiç, Örs, Üzengi kemikleri (Ses şiddetini artırır) ve Östaki borusu.</p>
                <p><strong>İç Kulak:</strong> Salyangoz (İşitme), Yarım Daire Kanalları (Denge).</p>
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs">
                  <span className="font-black text-indigo-300">Corti Organı:</span> Reseptörlerin bulunduğu asıl işitme merkezi.
                </div>
              </div>
            </Section>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                <h4 className="font-bold text-emerald-400 mb-1">Burun</h4>
                <p className="text-[11px] text-zinc-500">Kemoreseptörler mukus içinde çözünmeli. Çabuk yorulur.</p>
              </div>
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                <h4 className="font-bold text-yellow-400 mb-1">Dil</h4>
                <p className="text-[11px] text-zinc-500">Tadı Papilla (Tat Tomurcuğu) alır. Tükürükte çözünme şart.</p>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 text-pink-500">7. Sindirim Hormonları</h2>
            <div className="space-y-4">
              {[
                { name: "Gastrin", source: "Mide", target: "Mide", job: "Mide özsuyu salgısını artırır.", color: "blue" },
                { name: "Sekretin", source: "Onikiparmak", target: "Pankreas/Karaciğer", job: "Pankreastan HCO3- salgılatır. Safrayı ürettirir.", color: "emerald" },
                { name: "Kolesistokinin", source: "İnce Bağırsak", target: "Pankreas/Safra Kesesi", job: "Pankreas enzimi salgılatır. Safrayı boşalttırır.", color: "pink" }
              ].map((h, i) => (
                <div key={i} className={`bg-zinc-900 p-6 rounded-[2rem] border-l-[12px] border-${h.color}-500 shadow-2xl transition-transform hover:scale-[1.02]`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-2xl font-black tracking-tight">{h.name}</h4>
                    <span className="text-[10px] bg-zinc-800 px-3 py-1 rounded-full text-zinc-500 font-bold uppercase">{h.source}</span>
                  </div>
                  <p className="text-zinc-300 text-sm font-medium">{h.job}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10">
            <h2 className="text-3xl font-black mb-6 text-cyan-400">8. Besinlerin Emilim Yolları</h2>
            
            <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <FaDroplet className="text-blue-500" size={28} />
                <h4 className="text-xl font-black text-blue-400 underline decoration-blue-500/50 underline-offset-8 uppercase">1. Kan Yolu</h4>
              </div>
              <p className="text-[10px] text-zinc-500 mb-6 font-bold uppercase tracking-widest">Glikoz, Aminoasit, B-C Vitamini, Su, Mineraller</p>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-500"></span> İnce Bağırsak Kılcalları</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> <span className="text-white font-bold">Kapı Toplardamarı</span></div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> Karaciğer</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> Karaciğer Üstü Toplardamarı</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> Alt Ana Toplardamar</div>
                <div className="flex items-center gap-3 pl-4 text-white font-black"><FaArrowRight size={10} className="text-blue-500" /> SAĞ KULAKÇIK</div>
              </div>
            </div>

            <div className="bg-amber-600/10 border border-amber-500/20 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <FaBacteria className="text-amber-500" size={28} />
                <h4 className="text-xl font-black text-amber-400 underline decoration-amber-500/50 underline-offset-8 uppercase">2. Lenf Yolu</h4>
              </div>
              <p className="text-[10px] text-zinc-500 mb-6 font-bold uppercase tracking-widest">Yağ Asidi, Gliserol, A-D-E-K Vitaminleri</p>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Lenf Kılcalları (Şilomikron)</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> <span className="text-white font-bold">Peke Sarnıcı</span></div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> Göğüs Kanalı</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> Sol Köprücük Altı Toplardamarı</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} className="text-zinc-600" /> Üst Ana Toplardamar</div>
                <div className="flex items-center gap-3 pl-4 text-white font-black"><FaArrowRight size={10} className="text-amber-500" /> SAĞ KULAKÇIK</div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* Header */}
      <header className="p-6 sticky top-0 bg-black/80 backdrop-blur-2xl border-b border-zinc-900 z-50">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <FaDna className="text-blue-500" /> Biyoloji Arşivi
            </h1>
            <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">Bedirhan İmer • 11. Sınıf</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-5 py-1.5 rounded-full text-xs font-black text-blue-400 shadow-xl">
            {currentPage} / {totalPages}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow p-4 md:p-10 max-w-3xl mx-auto w-full pb-40">
        {renderPage()}
      </main>

      {/* Giant Controls */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-50">
        <div className="max-w-3xl mx-auto flex gap-6">
          <button 
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="flex-1 h-24 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 hover:bg-zinc-800"
          >
            <FaChevronLeft size={36} />
          </button>
          <button 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex-[3] h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center gap-6 text-2xl font-black transition-all active:scale-95 disabled:opacity-20 hover:bg-blue-500 shadow-3xl shadow-blue-900/40"
          >
            {currentPage === totalPages ? 'BİTTİ' : 'SONRAKİ'}
            {currentPage !== totalPages && <FaChevronRight size={32} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;

