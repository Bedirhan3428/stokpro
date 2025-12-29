import React, { useState, useEffect } from 'react';

// Saf SVG İkonları (React Icons veya Lucide gerektirmez)
const Icons = {
  Eye: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Dna: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 8 8 8m-8 0 8-8m-2-3a5 5 0 1 1-5 5"/><path d="M12 12h.01"/><path d="m19 19-2-2m-8-8-2-2"/></svg>,
  Bone: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 10c.7-.7 1.69-1 2.5-1a2.5 2.5 0 1 1 0 5c-.81 0-1.8-.3-2.5-1L7 14c-.7.7-1.69 1-2.5 1a2.5 2.5 0 1 1 0-5c.81 0 1.8.3 2.5 1L17 10Z"/></svg>,
  Ear: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3 3 0 1 1-6 0"/><path d="M11 13a2.5 2.5 0 1 0 4 0"/></svg>,
  Organ: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Droplets: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4-6.3-4-6.3S3 9 3 12.3c0 2.2 1.8 4 4 4z"/><path d="M17 18.5c1.7 0 3-1.3 3-3 0-2.5-3-4.8-3-4.8S14 13 14 15.5c0 1.7 1.3 3 3 3z"/></svg>,
  ChevronLeft: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 9;

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --adv-bg-page: #f8f9fa;
        --adv-bg-card: #ffffff;
        --adv-text-main: #202124;
        --adv-text-sub: #5f6368;
        --adv-border: #e0e0e0;
        --adv-border-light: #f1f3f4;
        --adv-red: #d93025;
        --adv-red-bg: #fce8e6;
        --adv-green: #137333;
        --adv-green-bg: #e6f4ea;
        --adv-blue: #1a73e8;
        --adv-blue-bg: #e8f0fe;
        --adv-orange: #e37400;
        --adv-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      [data-theme="dark"] {
        --adv-bg-page: #000000;
        --adv-bg-card: #0d0d0d;
        --adv-text-main: #f3f4f6;
        --adv-text-sub: #9ca3af;
        --adv-border: #1f1f1f;
        --adv-border-light: #181818;
        --adv-blue: #3b82f6;
        --adv-blue-bg: #1e3a8a;
        --adv-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
      }

      .adv-container {
        padding: 20px;
        background-color: var(--adv-bg-page);
        min-height: 100vh;
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: var(--adv-text-main);
        padding-bottom: 140px;
      }

      .adv-card {
        background: var(--adv-bg-card);
        border-radius: 20px;
        padding: 24px;
        box-shadow: var(--adv-shadow);
        border: 1px solid var(--adv-border);
        margin-bottom: 20px;
        animation: fadeIn 0.4s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .adv-big-number { font-size: 1.5rem; font-weight: 800; color: var(--adv-blue); }
      .list-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--adv-border-light); font-size: 0.9rem; }
      .good-val { color: var(--adv-green); background: var(--adv-green-bg); padding: 4px 10px; border-radius: 8px; font-weight: 600; font-size: 0.75rem; }
      .bad-val { color: var(--adv-red); background: var(--adv-red-bg); padding: 4px 10px; border-radius: 8px; font-weight: 600; font-size: 0.75rem; }
      
      .nav-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20px; background: rgba(0,0,0,0.9); backdrop-filter: blur(15px); display: flex; gap: 15px; max-width: 600px; margin: 0 auto; border-top: 1px solid #222; }
      .btn-nav { flex: 1; height: 75px; border-radius: 20px; border: none; font-size: 1.1rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .btn-prev { background: #1a1a1a; color: #666; }
      .btn-next { background: var(--adv-blue); color: white; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3); }
      .btn-nav:active { transform: scale(0.94); }
      .btn-nav:disabled { opacity: 0.15; pointer-events: none; }
    `;
    document.head.appendChild(style);
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const handleNext = () => { if(currentPage < totalPages) { setCurrentPage(c => c+1); window.scrollTo(0,0); } };
  const handlePrev = () => { if(currentPage > 1) { setCurrentPage(c => c-1); window.scrollTo(0,0); } };

  return (
    <div className="adv-container">
      <header className="flex justify-between items-center max-w-2xl mx-auto mb-8">
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white">BİYO MASTER</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Bedirhan İmer Paneli</p>
        </div>
        <div className="bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-xs font-black border border-blue-500/20">
          {currentPage} / {totalPages}
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        
        {currentPage === 1 && (
          <div>
            <div className="adv-card">
              <div className="flex items-center gap-3 mb-4 text-blue-500"><Icons.Eye /> <h4 className="font-bold text-white">1. Gözün Tabakaları</h4></div>
              <div className="list-group">
                <div className="list-row"><span className="row-name">Sert Tabaka</span><span className="good-val">Koruyucu</span></div>
                <p className="text-xs text-zinc-400 mt-2">Gözü dış etkilere karşı korur. Kan damarı yoktur, ön kısmı <b>Kornea</b>'dır. Işığın ilk kırıldığı yer burasıdır.</p>
                <div className="list-row"><span className="row-name">Damar Tabaka</span><span className="good-val">Besleyici</span></div>
                <p className="text-xs text-zinc-400 mt-2">Gözü besleyen damarlar burada. İris (renkli kısım) ve Göz Bebeği ışığı ayarlar.</p>
                <div className="list-row"><span className="row-name">Ağ Tabaka (Retina)</span><span className="good-val">Görüntü Merkezi</span></div>
              </div>
            </div>
            <div className="adv-card highlight-blue" style={{background: 'var(--adv-blue-bg)', border: 'none'}}>
               <p className="text-sm font-bold">Uzak/Yakın Uyumu:</p>
               <p className="text-xs mt-2 italic">• Yakın: Kaslar kasılır, mercek küreleşir (kalınlaşır).</p>
               <p className="text-xs italic">• Uzak: Kaslar gevşer, mercek yassılaşır (incelir).</p>
            </div>
          </div>
        )}

        {currentPage === 2 && (
          <div className="adv-card">
            <div className="flex items-center gap-3 mb-6 text-green-500"><Icons.Dna /> <h4 className="font-bold text-white">2. Kas Kasılma Sırası</h4></div>
            <div className="space-y-3">
              {[
                "Akson ucundan Asetilkolin salınır.",
                "Kas zarı uyarılır, depolarizasyon başlar.",
                "Uyarı T-tüpleriyle Sarkoplazmik Retikulum'a gider.",
                "Ca2+ (Kalsiyum) iyonları sitoplazmaya dökülür.",
                "Ca2+ sayesinde aktin-miyozin yolu açılır.",
                "ATP harcanır, aktinler miyozin üzerinde kayar."
              ].map((s, i) => (
                <div key={i} className="list-row"><span className="flex items-center gap-3 font-medium text-zinc-300"><span className="w-5 h-5 bg-zinc-800 rounded text-[10px] flex items-center justify-center font-bold">{i+1}</span> {s}</span></div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 3 && (
          <div className="space-y-4">
            <div className="adv-card" style={{borderLeft: '6px solid var(--adv-red)'}}>
              <h4 className="text-red-500 font-black text-sm uppercase">Miyopi (Uzağı Göremez)</h4>
              <div className="adv-big-number my-2 tracking-[0.2em]">K U M</div>
              <p className="text-xs text-zinc-500"><b>Kalın Mercek • Uzak • Miyop</b></p>
              <p className="text-xs text-zinc-400 mt-2">Göz küresi uzundur, görüntü retinanın <b>önüne</b> düşer.</p>
            </div>
            <div className="adv-card" style={{borderLeft: '6px solid var(--adv-green)'}}>
              <h4 className="text-green-500 font-black text-sm uppercase">Hipermetropi (Yakını Göremez)</h4>
              <p className="text-sm font-bold text-white mt-1">İnce Mercek Kullanılır</p>
              <p className="text-xs text-zinc-400 mt-1">Göz küresi kısadır, görüntü retinanın <b>arkasına</b> düşer.</p>
            </div>
          </div>
        )}

        {currentPage === 4 && (
          <div className="adv-card">
            <div className="flex items-center gap-3 mb-6 text-amber-500"><Icons.Bone /> <h4 className="font-bold text-white">4. Kemik Dokusu</h4></div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osteosit:</b> Hücre</div>
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osein:</b> Ara Madde</div>
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osteoblast:</b> Yapıcı</div>
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osteoklast:</b> Yıkıcı</div>
            </div>
            <p className="text-xs border-b border-zinc-800 pb-2"><b>Havers:</b> Dikey kanallar. / <b>Volkman:</b> Yatay kanallar.</p>
            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/20 rounded-2xl">
              <p className="text-xs font-bold text-white underline">PERİOST (Kemik Zarı)</p>
              <p className="text-[10px] text-zinc-400 mt-1">Kemiği besler, onarır ve enine büyümesini sağlar. Canlılık verir.</p>
            </div>
          </div>
        )}

        {currentPage === 5 && (
          <div className="adv-card p-0 overflow-hidden">
            <div className="p-6 bg-zinc-900/50"><h4 className="font-bold">Kas Tipleri</h4></div>
            <table className="w-full text-xs">
              <thead className="text-zinc-500 border-b border-zinc-800">
                <tr><th className="p-4 text-left">Özellik</th><th className="p-4 text-left">Düz</th><th className="p-4 text-left">Çizgili</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr><td className="p-4 font-bold">Çalışma</td><td className="p-4 text-emerald-500">İstemsiz</td><td className="p-4 text-blue-500">İstemli</td></tr>
                <tr><td className="p-4 font-bold">Kasılma</td><td className="p-4">Yavaş / Yorulmaz</td><td className="p-4">Hızlı / Yorulur</td></tr>
              </tbody>
            </table>
            <div className="p-4 text-[10px] text-zinc-500 italic italic">Kalp Kası: İstemsiz çalışır ama yapı olarak çizgili kasa benzer.</div>
          </div>
        )}

        {currentPage === 6 && (
          <div className="adv-card">
            <div className="flex items-center gap-3 mb-6 text-indigo-500"><Icons.Ear /> <h4 className="font-bold text-white">6. İşitme ve Denge</h4></div>
            <div className="space-y-4 text-sm">
              <p><b>Orta Kulak:</b> Kemikler (Çekiç-Örs-Üzengi) titreşimi 20 kat artırır.</p>
              <p><b>İç Kulak:</b> Salyangoz (işitme), Yarım daire kanalları (denge).</p>
              <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
                 <p className="font-bold text-xs">Corti Organı:</p>
                 <p className="text-[10px]">İşitmenin asıl merkezi buradaki tüy hücreleridir.</p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 7 && (
          <div className="space-y-4">
             <h2 className="text-2xl font-black mb-2">Sindirim Hormonları</h2>
            <div className="adv-card border-l-4 border-blue-500">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Gastrin (Mide)</h4>
              <p className="font-bold text-white mt-1">Mideyi uyararak asit (HCL) salgılatır.</p>
            </div>
            <div className="adv-card border-l-4 border-green-500">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Sekretin (İnce B.)</h4>
              <p className="font-bold text-white mt-1">Pankreastan bikarbonat salgılatır, karaciğerde safra üretimini başlatır.</p>
            </div>
            <div className="adv-card border-l-4 border-red-500">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Kolesistokinin (İnce B.)</h4>
              <p className="font-bold text-white mt-1">Safra kesesini kasar, pankreasın enzim salgılamasını sağlar.</p>
            </div>
          </div>
        )}

        {currentPage === 8 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black mb-2">Besinlerin Emilimi</h2>
            <div className="adv-card">
              <div className="flex items-center gap-2 text-blue-400 mb-3"><Icons.Droplets /> <h4 className="font-bold">1. KAN YOLU (Suda Çözünenler)</h4></div>
              <p className="text-[10px] text-zinc-400">Glikoz, Aminoasit, B-C Vit., Su, Mineraller.</p>
              <p className="text-xs mt-2 font-mono">İ.B. → Kapı Toplardamarı → Karaciğer → Alt Ana T.Damar → Sağ Kulakçık.</p>
            </div>
            <div className="adv-card">
              <div className="flex items-center gap-2 text-orange-400 mb-3"><Icons.Droplets /> <h4 className="font-bold">2. LENF YOLU (Yağda Çözünenler)</h4></div>
              <p className="text-[10px] text-zinc-400">A-D-E-K Vit., Yağ asidi, Gliserol (Şilomikron).</p>
              <p className="text-xs mt-2 font-mono">İ.B. → Peke Sarnıcı → Göğüs Kanalı → Sol Köprücük Altı T.D. → Sağ Kulakçık.</p>
            </div>
          </div>
        )}

        {currentPage === 9 && (
          <div className="space-y-4 animate-in">
            <h2 className="text-2xl font-black mb-2">Karaciğer ve Sindirim Organları</h2>
            <div className="adv-card">
              <div className="flex items-center gap-2 text-red-500 mb-3"><Icons.Organ /> <h4 className="font-bold">Karaciğerin Görevleri</h4></div>
              <ul className="text-xs space-y-3">
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span> <b>Safra Üretimi:</b> Yağların mekanik sindirimini sağlar. Safra enzim değildir!</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span> <b>Detoks (Zehir Temizleme):</b> Amonyak gibi zehirli maddeleri Üre'ye çevirir.</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span> <b>Glikojen Deposu:</b> Kan şekerini ayarlamak için fazla glikozu depo eder.</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span> <b>Kupffer Hücreleri:</b> Yaşlanmış alyuvarları parçalar.</li>
              </ul>
            </div>
            <div className="adv-card">
              <div className="flex items-center gap-2 text-emerald-500 mb-3"><Icons.Organ /> <h4 className="font-bold text-white">Bağırsak ve Pankreas</h4></div>
              <p className="text-xs leading-relaxed">
                <b>İnce Bağırsak:</b> Villuslar sayesinde emilim yüzeyi 600m²'ye kadar çıkar. Sindirim burada biter.<br/><br/>
                <b>Pankreas:</b> Karma bir bezdir. Wirsung kanalı ile enzimlerini <b>Vater Kabarcığına</b> döker.
              </p>
              <div className="p-3 bg-zinc-900 rounded-xl mt-3 text-[10px] text-zinc-500 italic">
                Kimus (mideden gelen asidik bulamaç) ince bağırsağa gelince bikarbonat ile bazikleşir.
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="nav-bar">
        <button className="btn-nav btn-prev" onClick={handlePrev} disabled={currentPage === 1}>
          <Icons.ChevronLeft />
        </button>
        <button className="btn-nav btn-next" onClick={handleNext} disabled={currentPage === totalPages}>
          {currentPage === totalPages ? 'BİTTİ' : 'İLERİ'} <Icons.ChevronRight style={{marginLeft: '10px'}} />
        </button>
      </footer>
    </div>
  );
};

export default App;

