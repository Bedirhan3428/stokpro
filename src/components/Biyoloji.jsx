import React, { useState, useEffect } from 'react';
import { 
  FaEye, FaBone, FaDna, FaEarListen, FaDroplet, 
  FaArrowRight, FaArrowLeft, FaBacteria, FaStethoscope,
  FaChevronRight, FaChevronLeft, FaLungs
} from 'react-icons/fa6';

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  // Global CSS Enjeksiyonu (Scrollbar ve Animasyonlar için)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      body { 
        margin: 0; 
        background-color: #000000; 
        font-family: 'Inter', sans-serif;
        color: white;
      }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #000; }
      ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #444; }
      .fade-in { animation: fadeIn 0.5s ease-out; }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const Card = ({ title, icon: Icon, children, color = "blue" }) => (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2rem] p-6 mb-6 shadow-2xl fade-in">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500`}>
          <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      </div>
      <div className="text-zinc-300 space-y-4 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-blue-600 pl-4">1. Gözün Yapısı</h2>
            <Card title="Sert Tabaka (Sklera)" icon={FaEye} color="blue">
              <p>Gözü en dıştan saran koruyucu tabakadır. Beyaz kısımdır ve bağ dokudan oluşur.</p>
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 italic">
                <span className="text-blue-400 font-bold">Kornea (Saydam Tabaka):</span> Sert tabakanın ön tarafta saydamlaşıp kubbeleşmesiyle oluşur. Işığın ilk kırıldığı yerdir. Kan damarı yoktur, lenf sıvısı ile beslenir.
              </div>
            </Card>
            <Card title="Damar Tabaka (Koroit)" icon={FaEye} color="blue">
              <p>Kan damarları ve pigmentler bakımından zengindir. Gözü besler ve karanlık oda etkisi yaratır.</p>
              <ul className="space-y-2 text-zinc-400">
                <li>• <span className="text-white font-bold">İris:</span> Gözün renkli kısmı.</li>
                <li>• <span className="text-white font-bold">Göz Bebeği:</span> İrisin ortasındaki delik.</li>
                <li>• <span className="text-white font-bold">Göz Merceği:</span> İrisin arkasında, ışığı kıran canlı yapı.</li>
              </ul>
              <div className="mt-4 p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700">
                <h4 className="font-bold text-white mb-2 underline">Göz Uyumu (Netleme)</h4>
                <p className="text-xs mb-2"><strong>Yakın:</strong> Kirpiksi kaslar KASILIR, asıcı bağlar GEVŞER, mercek kalınlaşır.</p>
                <p className="text-xs"><strong>Uzak:</strong> Kirpiksi kaslar GEVŞER, asıcı bağlar KASILIR, mercek incelir.</p>
              </div>
            </Card>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-green-600 pl-4">2. Kasılma Mekanizması</h2>
            <Card title="Kimyasal Olaylar" icon={FaDna} color="green">
              <div className="space-y-4">
                {[
                  { t: "Uyarı", d: "Motor uç plaktan Asetilkolin (nörotransmitter) salgılanır." },
                  { t: "Hücre Zarı", d: "Sarkolemma depolarize olur, aksiyon potansiyeli başlar." },
                  { t: "T-Tüpleri", d: "Uyarı T-tüpleriyle Sarkoplazmik Retikulum'a (SR) iletilir." },
                  { t: "Kalsiyum", d: "SR'den sitoplazmaya Ca2+ dökülür." },
                  { t: "Aktin-Miyozin", d: "Ca2+, aktin üzerindeki yolu açar. ATP harcanarak Aktin iplikleri Miyozin üzerinde kayar." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800">
                    <span className="text-2xl font-black text-green-500">0{i+1}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{s.t}</p>
                      <p className="text-xs text-zinc-500">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-red-600 pl-4">3. Göz Kusurları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-600/10 border border-red-500/30 p-8 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-2xl font-bold text-red-400 mb-2">Miyopi</h3>
                <p className="text-xs text-zinc-500 mb-6 italic">Uzağı net göremez. Görüntü retinanın önüne düşer. Göz küresi uzundur.</p>
                <div className="bg-black p-6 rounded-3xl text-center font-black text-4xl tracking-[0.4em] text-red-500 shadow-xl border border-red-500/20">
                  K U M
                </div>
                <p className="text-[10px] text-zinc-600 mt-3 text-center font-bold tracking-widest">KALIN MERCEK • UZAK • MİYOP</p>
              </div>
              <div className="bg-emerald-600/10 border border-emerald-500/30 p-8 rounded-[2.5rem] shadow-2xl">
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">Hipermetropi</h3>
                <p className="text-xs text-zinc-500 mb-6 italic">Yakını net göremez. Görüntü retinanın arkasına düşer. Göz küresi kısadır.</p>
                <div className="bg-black p-6 rounded-3xl text-center font-black text-xl text-emerald-500 shadow-xl border border-emerald-500/20 uppercase">
                  İnce Mercek
                </div>
              </div>
            </div>
            <Card title="Diğer Kusurlar" icon={FaStethoscope} color="zinc">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <p><strong>Astigmatizm:</strong> Bulanık görme. Silindirik Mercek.</p>
                <p><strong>Presbitlik:</strong> Yaşlılıkta mercek esnekliği kaybı. İnce Mercek.</p>
                <p><strong>Şaşılık:</strong> Göz kaslarının uyumsuzluğu. Ameliyat.</p>
                <p><strong>Katarakt:</strong> Merceğin saydamlığını kaybetmesi.</p>
              </div>
            </Card>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-amber-600 pl-4">4. Kemik Dokusu</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 text-center">
                <span className="font-black text-amber-500 block text-lg">OSTEOSİT</span>
                <span className="text-[10px] text-zinc-500">CANLI HÜCRE</span>
              </div>
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 text-center">
                <span className="font-black text-amber-500 block text-lg">OSEİN</span>
                <span className="text-[10px] text-zinc-500">ARA MADDE</span>
              </div>
            </div>
            <Card title="Kemik Kanalları ve Zar" icon={FaBone} color="amber">
              <p><strong>Havers:</strong> Kemikte boyuna (dikey) uzanan kanallar.</p>
              <p><strong>Volkman:</strong> Haversleri birbirine bağlayan enine (yatay) kanallar.</p>
              <div className="p-5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl mt-4">
                <p className="text-sm font-bold text-white mb-1">Periost (Kemik Zarı):</p>
                <p className="text-xs text-zinc-400 italic">Kemiği besler, onarır ve ENİNE büyümesini sağlar. Tüm kemiklerde bulunur.</p>
              </div>
            </Card>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-purple-600 pl-4">5. Kas Tipleri Karşılaştırması</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-800/50 text-blue-400">
                  <tr>
                    <th className="p-5">Özellik</th>
                    <th className="p-5">Düz Kas</th>
                    <th className="p-5">Çizgili Kas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr><td className="p-5 font-bold text-zinc-500">Çekirdek</td><td className="p-5">Tek (Merkezde)</td><td className="p-5">Çok (Kenarda)</td></tr>
                  <tr><td className="p-5 font-bold text-zinc-500">Çalışma</td><td className="p-5 text-emerald-400">İstemsiz</td><td className="p-5 text-blue-400">İstemli</td></tr>
                  <tr><td className="p-5 font-bold text-zinc-500">Kasılma</td><td className="p-5">Yavaş / Düzenli</td><td className="p-5">Hızlı / Yorulur</td></tr>
                  <tr><td className="p-5 font-bold text-zinc-500">Örnek</td><td className="p-5">İç Organlar</td><td className="p-5">Kol ve Bacak</td></tr>
                </tbody>
              </table>
              <div className="p-5 bg-purple-900/10 text-purple-400 text-xs font-bold border-t border-purple-800/20">
                KALP KASI: Yapısal olarak çizgili kasa, çalışma olarak düz kasa benzer. Dallanmış yapıdadır.
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-indigo-600 pl-4">6. Kulak ve Diğer Duyular</h2>
            <Card title="Kulak ve İşitme" icon={FaEarListen} color="indigo">
              <p><strong>Orta Kulak:</strong> Çekiç-Örs-Üzengi (sesi yükseltir) ve Östaki (basınç dengeler).</p>
              <p><strong>İç Kulak:</strong> Dalız, Salyangoz ve Yarım Daire Kanalları.</p>
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <p className="text-sm font-bold text-indigo-300">Corti Organı:</p>
                <p className="text-xs">Salyangoz içinde reseptörlerin bulunduğu asıl işitme merkezi.</p>
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                <h4 className="font-bold text-emerald-400 mb-1 text-sm">Burun</h4>
                <p className="text-[11px] text-zinc-500">Koku reseptörleri mukusta çözünmeli. Çabuk yorulur.</p>
              </div>
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                <h4 className="font-bold text-yellow-400 mb-1 text-sm">Dil</h4>
                <p className="text-[11px] text-zinc-500">Tadı Papilla alır. Maddeler tükürükte çözünmeli.</p>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-pink-600 pl-4">7. Sindirim Hormonları</h2>
            <div className="space-y-4">
              {[
                { n: "Gastrin", s: "Mide", j: "Mide özsuyu salgısını (HCL ve enzim) başlatır.", c: "blue" },
                { n: "Sekretin", s: "İnce Bağırsak", j: "Pankreastan HCO3- salgılatır. Karaciğerde safra üretimini sağlar.", c: "emerald" },
                { n: "Kolesistokinin", s: "İnce Bağırsak", j: "Pankreas enzimlerini salgılatır. Safra kesesini kasar.", c: "pink" }
              ].map((h, i) => (
                <div key={i} className={`bg-zinc-900 p-6 rounded-[2.5rem] border-l-[12px] border-${h.c}-500 shadow-2xl`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-2xl font-black tracking-tighter">{h.n}</h4>
                    <span className="text-[10px] bg-zinc-800 px-3 py-1 rounded-full text-zinc-500 font-bold tracking-widest">{h.s}</span>
                  </div>
                  <p className="text-zinc-300 text-sm">{h.j}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-black mb-6 border-l-8 border-cyan-400 pl-4">8. Besinlerin Emilim Yolları</h2>
            
            <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[3rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <FaDroplet className="text-blue-500" size={30} />
                <h4 className="text-xl font-black text-blue-400 underline underline-offset-8">1. YOL (KAN YOLU)</h4>
              </div>
              <p className="text-[10px] text-zinc-500 mb-6 font-bold uppercase tracking-widest">Glikoz, Aminoasit, B-C Vitamini, Su, Mineraller</p>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500"></div> İnce Bağırsak Kılcalları</div>
                <div className="flex items-center gap-3 pl-4 text-white font-bold tracking-tighter"><FaArrowRight size={10} /> KAPI TOPLARDAMARI</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} /> KARACİĞER</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} /> Karaciğer Üstü Toplardamarı</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} /> Alt Ana Toplardamar</div>
                <div className="flex items-center gap-3 pl-4 text-white font-black animate-pulse"><FaArrowRight size={10} /> SAĞ KULAKÇIK</div>
              </div>
            </div>

            <div className="bg-amber-600/10 border border-amber-500/20 p-8 rounded-[3rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <FaBacteria className="text-amber-500" size={30} />
                <h4 className="text-xl font-black text-amber-400 underline underline-offset-8">2. YOL (LENF YOLU)</h4>
              </div>
              <p className="text-[10px] text-zinc-500 mb-6 font-bold uppercase tracking-widest">Yağ Asidi, Gliserol, A-D-E-K Vitaminleri</p>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Lenf Kılcalları (Şilomikron)</div>
                <div className="flex items-center gap-3 pl-4 text-white font-bold tracking-tighter"><FaArrowRight size={10} /> PEKE SARNICI</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} /> Göğüs Kanalı</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} /> Sol Köprücük Altı Toplardamarı</div>
                <div className="flex items-center gap-3 pl-4"><FaArrowRight size={10} /> Üst Ana Toplardamar</div>
                <div className="flex items-center gap-3 pl-4 text-white font-black animate-pulse"><FaArrowRight size={10} /> SAĞ KULAKÇIK</div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-44">
      {/* Navbar */}
      <header className="p-6 sticky top-0 bg-black/80 backdrop-blur-2xl border-b border-zinc-900 z-50">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">
              <FaLungs className="text-blue-500" /> Biyoloji Master
            </h1>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Bedirhan İmer Arşivi</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-5 py-1.5 rounded-full text-xs font-black text-blue-400 shadow-xl">
            {currentPage} / {totalPages}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-10 max-w-3xl mx-auto w-full">
        {renderPage()}
      </main>

      {/* Giant Fixed Controls */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black to-transparent z-50">
        <div className="max-w-3xl mx-auto flex gap-6">
          <button 
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="flex-1 h-24 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 hover:bg-zinc-800 shadow-2xl"
          >
            <FaChevronLeft size={40} />
          </button>
          <button 
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex-[3] h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center gap-8 text-2xl font-black transition-all active:scale-95 disabled:opacity-20 hover:bg-blue-500 shadow-2xl shadow-blue-900/40"
          >
            {currentPage === totalPages ? 'SON SAYFA' : 'İLERİ'}
            {currentPage !== totalPages && <FaChevronRight size={36} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;

