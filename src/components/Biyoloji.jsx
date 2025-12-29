import React, { useState, useEffect } from 'react';

// İkonlar (Zero-Dependency Inline SVGs)
const Icons = {
  Eye: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Bone: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 10c.7-.7 1.69-1 2.5-1a2.5 2.5 0 1 1 0 5c-.81 0-1.8-.3-2.5-1L7 14c-.7.7-1.69 1-2.5 1a2.5 2.5 0 1 1 0-5c.81 0 1.8.3 2.5 1L17 10Z"/></svg>
  ),
  Activity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  Flask: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M8 3v12"/><path d="M16 3v12"/><path d="M5 21h14"/><path d="M5 15h14"/><path d="M8 3h8"/><path d="m16 15-2 6H10l-2-6"/></svg>
  ),
  Droplet: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
  ),
  Ear: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3 3 0 1 1-6 0"/><path d="M11 13a2.5 2.5 0 1 0 4 0"/></svg>
  ),
  ChevronLeft: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
  ),
  ChevronRight: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  )
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  const navigate = (dir) => {
    const next = currentPage + dir;
    if (next >= 1 && next <= totalPages) {
      setCurrentPage(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage]);

  const Card = ({ title, icon: Icon, children, colorClass = "blue" }) => (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 mb-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        {Icon && <div className={`text-${colorClass}-500`}><Icon /></div>}
        <h3 className={`text-xl font-bold text-${colorClass}-400`}>{title}</h3>
      </div>
      <div className="text-zinc-300 space-y-3 leading-relaxed">
        {children}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6">1. Gözün Yapısı</h2>
            <Card title="Sert Tabaka (Sklera)" icon={Icons.Eye} colorClass="blue">
              <p>Gözü dıştan sarar, iç kısımları korur. Bağ doku yapılıdır.</p>
              <p className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <strong className="text-blue-300">Kornea:</strong> Ön tarafta saydamlaşan kısımdır. Işığın ilk kırıldığı yerdir. Kan damarı bulunmaz.
              </p>
            </Card>
            <Card title="Damar Tabaka (Koroit)" icon={Icons.Eye} colorClass="blue">
              <p>Besleyen damarlar buradadır. <span className="text-white font-bold">İris</span> (renkli kısım), <span className="text-white font-bold">Göz Bebeği</span> ve <span className="text-white font-bold">Mercek</span> buradadır.</p>
              <div className="p-3 bg-zinc-800 rounded-xl mt-2">
                <h4 className="font-bold text-white mb-2 text-sm underline">Göz Uyumu (Netleme)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <p><strong>YAKIN:</strong> Kaslar kasılır, bağlar gevşer, mercek kalınlaşır.</p>
                  <p><strong>UZAK:</strong> Kaslar gevşer, bağlar kasılır, mercek incelir.</p>
                </div>
              </div>
            </Card>
            <Card title="Ağ Tabaka (Retina)" icon={Icons.Eye} colorClass="blue">
              <p>Reseptörlerin (Çubuk/Koni) bulunduğu yerdir.</p>
              <ul className="list-disc list-inside text-sm">
                <li><strong>Sarı Benek:</strong> En net görüntü.</li>
                <li><strong>Kör Nokta:</strong> Sinir çıkışı, görüntü yok.</li>
              </ul>
            </Card>
          </div>
        );
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6 text-green-500">2. Kas Kasılma Sırası</h2>
            <div className="space-y-4">
              {[
                { t: "Uyarı", d: "Motor uç plaktan Asetilkolin salgılanır." },
                { t: "Depolarizasyon", d: "Kas zarı uyarılır, Na+ kanalları açılır." },
                { t: "İletim", d: "T-tüpleri uyarısı Sarkoplazmik Retikulum'a (SR) iletir." },
                { t: "Kalsiyum", d: "SR'den sitoplazmaya Ca2+ dökülür." },
                { t: "Kayma", d: "Aktin üzerindeki bölgeler açılır, miyozin bağlanır ve aktinler miyozin üzerinde kayar." }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-bold shrink-0">{i+1}</div>
                  <div>
                    <h4 className="font-bold text-green-400">{step.t}</h4>
                    <p className="text-sm text-zinc-400">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6 text-red-500">3. Göz Kusurları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-3xl">
                <h3 className="text-xl font-bold text-red-400 mb-2">Miyopi</h3>
                <p className="text-sm text-zinc-400 mb-4">Uzağı göremez. Görüntü retinanın önüne düşer. Göz küresi uzundur.</p>
                <div className="bg-black p-4 rounded-xl text-center font-black text-2xl tracking-[0.3em] text-red-500 border border-red-500/30">K U M</div>
                <p className="text-[10px] text-center mt-2 text-zinc-500 font-bold uppercase">Kalın Mercek - Uzak - Miyop</p>
              </div>
              <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-3xl">
                <h3 className="text-xl font-bold text-green-400 mb-2">Hipermetropi</h3>
                <p className="text-sm text-zinc-400 mb-4">Yakını göremez. Görüntü retinanın arkasına düşer. Göz küresi kısadır.</p>
                <div className="bg-black p-4 rounded-xl text-center font-black text-lg text-green-500 border border-green-500/30">İNCE MERCEK</div>
              </div>
              <div className="col-span-1 md:col-span-2 bg-zinc-900 p-5 rounded-3xl border border-zinc-800 grid grid-cols-2 gap-4 text-xs">
                <p><strong>Astigmat:</strong> Silindirik Mercek.</p>
                <p><strong>Presbitlik:</strong> Yaşlılıkta mercek esnekliği kaybı.</p>
                <p><strong>Şaşılık:</strong> Kas uyumsuzluğu.</p>
                <p><strong>Katarakt:</strong> Mercek saydamlık kaybı.</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6 text-amber-500">4. Kemik Dokusu</h2>
            <Card title="Hücresel Yapı" icon={Icons.Bone} colorClass="amber">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-amber-400">Osteosit:</span><br/><span className="text-xs">Hücre</span>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-amber-400">Osein:</span><br/><span className="text-xs">Ara Madde</span>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-green-500">Osteoblast:</span><br/><span className="text-xs">Yapıcı</span>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-red-500">Osteoklast:</span><br/><span className="text-xs">Yıkıcı</span>
                </div>
              </div>
            </Card>
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
               <h4 className="font-bold mb-4 text-amber-300">Kanallar ve Zar</h4>
               <p className="text-sm mb-3"><strong>Havers:</strong> Boyuna uzanan kanallar.</p>
               <p className="text-sm mb-3"><strong>Volkman:</strong> Haversleri birbirine bağlayan enine kanallar.</p>
               <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                 <p className="text-xs font-bold text-white italic">"Periost: Kemik zarıdır. Besler, onarır ve enine büyüme sağlar."</p>
               </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6">5. Kas Tipleri Karşılaştırması</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-800 text-blue-400">
                  <tr>
                    <th className="p-4">Özellik</th>
                    <th className="p-4">Düz Kas</th>
                    <th className="p-4">Çizgili Kas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr><td className="p-4 font-bold text-zinc-500">Yapı</td><td className="p-4">Mekik</td><td className="p-4">Silindirik</td></tr>
                  <tr><td className="p-4 font-bold text-zinc-500">Çekirdek</td><td className="p-4">Tek (Merkez)</td><td className="p-4">Çok (Kenar)</td></tr>
                  <tr><td className="p-4 font-bold text-zinc-500">Çalışma</td><td className="p-4 text-green-400">İstemsiz</td><td className="p-4 text-blue-400">İstemli</td></tr>
                  <tr><td className="p-4 font-bold text-zinc-500">Hız</td><td className="p-4">Yavaş</td><td className="p-4">Hızlı / Yorulur</td></tr>
                </tbody>
              </table>
              <div className="p-4 bg-purple-900/10 text-xs text-purple-300 italic border-t border-purple-800/30">
                Kalp Kası: Yapısal olarak çizgili, çalışma olarak düz kasa benzer.
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6 text-indigo-400">6. İşitme ve Diğer Duyular</h2>
            <Card title="Kulak" icon={Icons.Ear} colorClass="indigo">
              <p className="text-sm"><strong>Dış:</strong> Kepçe, Yol, Zar.</p>
              <p className="text-sm"><strong>Orta:</strong> Çekiç-Örs-Üzengi (Sesi 20 kat artırır), Östaki (Basınç).</p>
              <p className="text-sm"><strong>İç:</strong> Salyangoz (İşitme), Yarım Daire Kanalları (Denge).</p>
              <div className="mt-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs italic">
                Corti Organı: İşitme reseptörleri buradadır.
              </div>
            </Card>
            <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-green-400 mb-1 text-sm">Burun</h4>
                <p className="text-[11px]">Reseptörler mukusta çözünmeli. Çabuk yorulur.</p>
              </div>
              <div>
                <h4 className="font-bold text-yellow-400 mb-1 text-sm">Dil</h4>
                <p className="text-[11px]">Papilla. Besin tükürükte çözünmeli.</p>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6 text-pink-500">7. Sindirim Hormonları</h2>
            <div className="space-y-4">
              <div className="bg-zinc-900 p-5 rounded-3xl border-l-8 border-blue-500 shadow-xl">
                <h4 className="text-xl font-bold mb-1 underline">Gastrin</h4>
                <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Mideden Salgılanır</p>
                <p className="text-sm">Mideyi uyarır. Mide özsuyu salgısını (HCL + Pepsinojen) artırır.</p>
              </div>
              <div className="bg-zinc-900 p-5 rounded-3xl border-l-8 border-green-500 shadow-xl">
                <h4 className="text-xl font-bold mb-1 underline text-green-400">Sekretin</h4>
                <p className="text-xs text-zinc-500 uppercase font-bold mb-2">İnce Bağırsaktan Salgılanır</p>
                <p className="text-sm">Pankreastan bikarbonat (HCO3-) salgılatır. Karaciğerde safra üretimini sağlar.</p>
              </div>
              <div className="bg-zinc-900 p-5 rounded-3xl border-l-8 border-pink-500 shadow-xl">
                <h4 className="text-xl font-bold mb-1 underline text-pink-400">Kolesistokinin</h4>
                <p className="text-xs text-zinc-500 uppercase font-bold mb-2">İnce Bağırsaktan Salgılanır</p>
                <p className="text-sm">Pankreas enzimlerinin salgılanmasını sağlar. Safra kesesini kasar, safra boşaltılır.</p>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black mb-6 text-cyan-500">8. Emilim Yolları</h2>
            <div className="space-y-6">
              <div className="bg-blue-900/10 p-6 rounded-3xl border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Icons.Droplet />
                  <h4 className="font-bold text-blue-400 text-lg uppercase underline">1. Kan Yolu</h4>
                </div>
                <p className="text-[10px] text-zinc-500 mb-4">Besinler: Glikoz, Aminoasit, B-C Vit., Su, Mineraller.</p>
                <div className="text-[11px] font-mono space-y-1">
                  <p>İnce Bağırsak → Kan Kılcalları</p>
                  <p>→ <span className="text-white font-bold">Kapı Toplardamarı</span></p>
                  <p>→ Karaciğer → Karaciğer Üstü Topl.</p>
                  <p>→ Alt Ana Toplardamar</p>
                  <p className="text-white font-bold pt-2">→ SAĞ KULAKÇIK</p>
                </div>
              </div>
              <div className="bg-yellow-900/10 p-6 rounded-3xl border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <Icons.Droplet />
                  <h4 className="font-bold text-yellow-400 text-lg uppercase underline">2. Lenf Yolu</h4>
                </div>
                <p className="text-[10px] text-zinc-500 mb-4">Besinler: Yağ Asidi, Gliserol, A-D-E-K Vit.</p>
                <div className="text-[11px] font-mono space-y-1">
                  <p>İnce Bağırsak → Lenf Kılcalları (Şilomikron)</p>
                  <p>→ <span className="text-white font-bold">Peke Sarnıcı</span> → Göğüs Kanalı</p>
                  <p>→ Sol Köprücük Altı Toplardamarı</p>
                  <p>→ Üst Ana Toplardamar</p>
                  <p className="text-white font-bold pt-2">→ SAĞ KULAKÇIK</p>
                </div>
              </div>
              <div className="text-center p-4 border-t border-zinc-800 text-zinc-600 text-xs italic">
                Bedirhan İmer Biyoloji Notları - Son Sayfa
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-blue-600">
      {/* Üst Bar */}
      <header className="p-6 sticky top-0 bg-black/90 backdrop-blur-xl border-b border-zinc-900 z-50 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <span className="text-blue-500"><Icons.Activity /></span> BİYOLOJİ
          </h1>
          <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">Eksiksiz Notlar • Bedirhan</p>
        </div>
        <div className="bg-zinc-900 px-4 py-1 rounded-full text-xs font-mono font-bold text-blue-400 border border-zinc-800">
          {currentPage} / {totalPages}
        </div>
      </header>

      {/* İçerik */}
      <main className="flex-grow p-4 md:p-10 max-w-2xl mx-auto w-full pb-32">
        {renderContent()}
      </main>

      {/* Navigasyon Butonları */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-50">
        <div className="max-w-2xl mx-auto flex gap-4">
          <button 
            onClick={() => navigate(-1)}
            disabled={currentPage === 1}
            className="flex-1 h-20 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-3xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-10"
          >
            <Icons.ChevronLeft />
          </button>
          <button 
            onClick={() => navigate(1)}
            disabled={currentPage === totalPages}
            className="flex-[3] h-20 bg-blue-600 hover:bg-blue-500 rounded-3xl flex items-center justify-center gap-4 text-xl font-black transition-all active:scale-95 disabled:opacity-10 shadow-2xl shadow-blue-900/40"
          >
            {currentPage === totalPages ? 'BİTTİ' : 'İLERİ'}
            {currentPage !== totalPages && <Icons.ChevronRight />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;