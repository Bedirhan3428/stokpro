import React, { useState, useEffect } from 'react';

// Saf SVG İkonları (Bağımlılık Gerektirmez)
const Icons = {
  Eye: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  Dna: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 8 8 8m-8 0 8-8m-2-3a5 5 0 1 1-5 5"/><path d="M12 12h.01"/><path d="m19 19-2-2m-8-8-2-2"/></svg>,
  Bone: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 10c.7-.7 1.69-1 2.5-1a2.5 2.5 0 1 1 0 5c-.81 0-1.8-.3-2.5-1L7 14c-.7.7-1.69 1-2.5 1a2.5 2.5 0 1 1 0-5c.81 0 1.8.3 2.5 1L17 10Z"/></svg>,
  Ear: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3 3 0 1 1-6 0"/><path d="M11 13a2.5 2.5 0 1 0 4 0"/></svg>,
  Flask: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M8 3v12"/><path d="M16 3v12"/><path d="m16 15-2 6H10l-2-6"/></svg>,
  Droplets: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4-6.3-4-6.3S3 9 3 12.3c0 2.2 1.8 4 4 4z"/><path d="M17 18.5c1.7 0 3-1.3 3-3 0-2.5-3-4.8-3-4.8S14 13 14 15.5c0 1.7 1.3 3 3 3z"/></svg>,
  ChevronLeft: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

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
      .good-val { color: var(--adv-green); background: var(--adv-green-bg); padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; }
      
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
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Bedirhan İmer Arşivi</p>
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
                <p className="text-xs text-zinc-500 mt-2 italic">Ön tarafta saydamlaşarak Kornea'yı oluşturur. Işık ilk burada kırılır.</p>
                <div className="list-row"><span className="row-name">Damar Tabaka</span><span className="good-val">Besleyici</span></div>
                <p className="text-xs text-zinc-500 mt-2 italic">İris, göz bebeği ve mercek buradadır. Gözün içini karanlık bir oda yapar.</p>
                <div className="list-row"><span className="row-name">Ağ Tabaka (Retina)</span><span className="good-val">Reseptör</span></div>
              </div>
            </div>
            <div className="adv-card" style={{background: 'linear-gradient(135deg, #1e3a8a, #1e1b4b)', borderColor: 'transparent'}}>
              <h4 className="text-xs font-bold text-blue-300 uppercase mb-2">Göz Uyumu (Netleme)</h4>
              <div className="text-white space-y-2 text-sm">
                <p>• <b>Yakın:</b> Kirpiksi kas KASILIR, asıcı bağ GEVŞER, mercek kalınlaşır.</p>
                <p>• <b>Uzak:</b> Kirpiksi kas GEVŞER, asıcı bağ KASILIR, mercek incelir.</p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 2 && (
          <div className="adv-card">
            <div className="flex items-center gap-3 mb-6 text-green-500"><Icons.Dna /> <h4 className="font-bold text-white">2. Kas Kasılması Sırası</h4></div>
            <div className="space-y-3">
              {[
                "Motor uç plaktan Asetilkolin salgılanır.",
                "Kas zarı uyarılır, depolarizasyon başlar.",
                "Uyarı T-tüplerle SR'ye iletilir.",
                "Sarkoplazmik Retikulum'dan Ca2+ dökülür.",
                "Ca2+, aktin üzerindeki yolu açar.",
                "ATP parçalanır ve Aktinler Miyozin üzerinde kayar."
              ].map((s, i) => (
                <div key={i} className="list-row"><span className="flex items-center gap-3 font-medium text-zinc-300"><span className="w-5 h-5 bg-zinc-800 rounded text-[10px] flex items-center justify-center font-bold">{i+1}</span> {s}</span></div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black mb-4">Göz Kusurları</h2>
            <div className="adv-card" style={{borderLeft: '6px solid var(--adv-red)'}}>
              <h4 className="text-red-500 font-black text-sm uppercase">Miyopi</h4>
              <div className="adv-big-number my-2 tracking-[0.3em]">K U M</div>
              <p className="text-xs text-zinc-500 italic">Kalın Mercek • Uzak • Miyop</p>
              <p className="text-xs text-zinc-400 mt-2">Göz küresi uzun, görüntü retinanın önüne düşer.</p>
            </div>
            <div className="adv-card" style={{borderLeft: '6px solid var(--adv-green)'}}>
              <h4 className="text-green-500 font-black text-sm uppercase">Hipermetropi</h4>
              <p className="text-sm font-bold text-white mt-1">İnce Mercek Kullanılır</p>
              <p className="text-xs text-zinc-400 mt-1">Göz küresi kısa, görüntü retinanın arkasına düşer.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 p-4 rounded-2xl text-[10px]"><b>Astigmat:</b> Silindirik M.</div>
              <div className="bg-zinc-900 p-4 rounded-2xl text-[10px]"><b>Presbitlik:</b> İnce M.</div>
            </div>
          </div>
        )}

        {currentPage === 4 && (
          <div className="adv-card">
            <div className="flex items-center gap-3 mb-6 text-amber-500"><Icons.Bone /> <h4 className="font-bold text-white">4. Kemik Dokusu</h4></div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osteosit</b><br/><small className="text-zinc-500">Hücre</small></div>
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osein</b><br/><small className="text-zinc-500">Ara Madde</small></div>
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osteoblast</b><br/><small className="text-emerald-500">Yapıcı</small></div>
              <div className="p-3 bg-zinc-900 rounded-xl"><b>Osteoklast</b><br/><small className="text-red-500">Yıkıcı</small></div>
            </div>
            <p className="text-xs border-b border-zinc-800 pb-2"><b>Havers:</b> Boyuna kanallar. <br/> <b>Volkman:</b> Enine kanallar.</p>
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <p className="text-xs font-bold text-white">PERİOST (Kemik Zarı):</p>
              <p className="text-[10px] text-zinc-400">Besler, onarır, ENİNE büyütür.</p>
            </div>
          </div>
        )}

        {currentPage === 5 && (
          <div className="adv-card p-0 overflow-hidden">
            <div className="p-6 bg-zinc-900/50"><h4 className="font-bold">Kas Tipleri Karşılaştırması</h4></div>
            <table className="w-full text-xs">
              <thead className="text-zinc-500 border-b border-zinc-800">
                <tr><th className="p-4 text-left">Özellik</th><th className="p-4 text-left">Düz</th><th className="p-4 text-left">Çizgili</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr><td className="p-4 font-bold">Çalışma</td><td className="p-4 text-emerald-500">İstemsiz</td><td className="p-4 text-blue-500">İstemli</td></tr>
                <tr><td className="p-4 font-bold">Hız</td><td className="p-4">Yavaş</td><td className="p-4">Hızlı</td></tr>
                <tr><td className="p-4 font-bold">Örnek</td><td className="p-4">Organlar</td><td className="p-4">İskelet</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {currentPage === 6 && (
          <div className="adv-card">
            <div className="flex items-center gap-3 mb-6 text-indigo-500"><Icons.Ear /> <h4 className="font-bold text-white">6. İşitme ve Denge</h4></div>
            <div className="space-y-4 text-sm">
              <p><b>Orta Kulak:</b> Çekiç, Örs, Üzengi (sesi artırır), Östaki (basınç).</p>
              <p><b>İç Kulak:</b> Salyangoz (İşitme-Corti), Yarım Daire Kanalları (Denge).</p>
              <div className="empty-state">Dengeyi Yarım Daire Kanalları içindeki endolenf sıvısı ve otolit taşları sağlar.</div>
            </div>
          </div>
        )}

        {currentPage === 7 && (
          <div className="space-y-4">
            <div className="adv-card" style={{borderLeft: '4px solid #3b82f6'}}>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Gastrin (Mide)</h4>
              <p className="font-bold text-white mt-1">Mide özsuyu salgılatır.</p>
            </div>
            <div className="adv-card" style={{borderLeft: '4px solid #10b981'}}>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Sekretin (İ.B.)</h4>
              <p className="font-bold text-white mt-1">Pankreastan HCO3- salgılatır.</p>
            </div>
            <div className="adv-card" style={{borderLeft: '4px solid #ef4444'}}>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Kolesistokinin (İ.B.)</h4>
              <p className="font-bold text-white mt-1">Safra kesesini kasar.</p>
            </div>
          </div>
        )}

        {currentPage === 8 && (
          <div className="space-y-6">
            <div className="adv-card" style={{borderColor: 'var(--adv-blue)'}}>
              <div className="flex items-center gap-2 text-blue-400 mb-3"><Icons.Droplets /> <h4 className="font-bold">1. YOL (KAN)</h4></div>
              <p className="text-[11px] font-mono leading-relaxed text-zinc-400">İnce B. → Kapı Toplardamarı → Karaciğer → Karaciğer Üstü Topl. → Alt Ana Toplardamar → <b>SAĞ KULAKÇIK</b></p>
            </div>
            <div className="adv-card" style={{borderColor: 'var(--adv-orange)'}}>
              <div className="flex items-center gap-2 text-orange-400 mb-3"><Icons.Droplets /> <h4 className="font-bold">2. YOL (LENF)</h4></div>
              <p className="text-[11px] font-mono leading-relaxed text-zinc-400">Lenf Kılcalları → Peke Sarnıcı → Göğüs Kanalı → Sol Köprücük Altı Toplardamarı → Üst Ana Toplardamar → <b>SAĞ KULAKÇIK</b></p>
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

