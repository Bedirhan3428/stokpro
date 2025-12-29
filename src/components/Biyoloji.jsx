import React, { useState, useEffect } from 'react';
import { 
  FaEye, FaBone, FaDna, FaEar, FaDroplet, 
  FaArrowRight, FaArrowLeft, FaStethoscope,
  FaChevronRight, FaChevronLeft, FaLungs, FaMicroscope
} from 'react-icons/fa6';

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  // Gönderdiğin profesyonel stilleri buraya entegre ettim
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

      /* KARANLIK MOD (Bedirhan'ın Tercihi) */
      [data-theme="dark"] {
        --adv-bg-page: #000000;
        --adv-bg-card: #111111;
        --adv-text-main: #f3f4f6;
        --adv-text-sub: #9ca3af;
        --adv-border: #333333;
        --adv-border-light: #222222;
        --adv-red: #f87171;
        --adv-red-bg: #450a0a;
        --adv-green: #34d399;
        --adv-green-bg: #064e3b;
        --adv-blue: #60a5fa;
        --adv-blue-bg: #1e3a8a;
        --adv-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
      }

      .adv-container {
        padding: 24px;
        background-color: var(--adv-bg-page);
        min-height: 100vh;
        font-family: 'Inter', system-ui, sans-serif;
        color: var(--adv-text-main);
        transition: all 0.3s;
        padding-bottom: 140px;
      }

      .adv-card {
        background: var(--adv-bg-card);
        border-radius: 16px;
        padding: 24px;
        box-shadow: var(--adv-shadow);
        border: 1px solid var(--adv-border);
        margin-bottom: 20px;
        animation: slideIn 0.4s ease-out;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .adv-big-number { font-size: 1.75rem; font-weight: 900; color: var(--adv-blue); }
      .list-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--adv-border-light); }
      .good-val { color: var(--adv-green); background: var(--adv-green-bg); padding: 4px 10px; border-radius: 8px; font-weight: bold; }
      .bad-val { color: var(--adv-red); background: var(--adv-red-bg); padding: 4px 10px; border-radius: 8px; font-weight: bold; }
      
      /* Dev Butonlar */
      .nav-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20px; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; gap: 15px; max-width: 800px; margin: 0 auto; }
      .btn-nav { flex: 1; height: 80px; border-radius: 20px; border: none; font-size: 1.2rem; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .btn-prev { background: var(--adv-border); color: var(--adv-text-main); }
      .btn-next { background: var(--adv-blue); color: white; }
      .btn-nav:active { transform: scale(0.95); }
      .btn-nav:disabled { opacity: 0.2; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
    document.documentElement.setAttribute('data-theme', 'dark'); // Karanlık mod aktif
  }, []);

  const next = () => { if(currentPage < totalPages) { setCurrentPage(c => c+1); window.scrollTo(0,0); } };
  const prev = () => { if(currentPage > 1) { setCurrentPage(c => c-1); window.scrollTo(0,0); } };

  return (
    <div className="adv-container">
      {/* Header */}
      <div className="adv-header max-w-3xl mx-auto">
        <div>
          <h1 className="adv-title flex items-center gap-2">
            <FaLungs style={{color: 'var(--adv-blue)'}} /> BİYOLOJİ MASTER
          </h1>
          <p className="adv-subtitle">Bedirhan İmer Not Arşivi</p>
        </div>
        <div className="rank-badge" style={{width: '60px', height: '30px', borderRadius: '20px'}}>
          {currentPage}/{totalPages}
        </div>
      </div>

      <main className="max-w-3xl mx-auto">
        
        {currentPage === 1 && (
          <div>
            <div className="adv-card">
              <div className="adv-card-header"><h4><FaEye /> 1. Gözün Tabakaları</h4><small>Duyu Organları</small></div>
              <div className="list-group">
                <div className="list-row"><span className="row-name">Sert Tabaka</span><span className="good-val">Koruyucu</span></div>
                <p className="adv-alt mt-2">Ön tarafta saydamlaşarak <b>Kornea</b>'yı oluşturur. Işığın ilk kırıldığı yerdir.</p>
                <div className="list-row"><span className="row-name">Damar Tabaka</span><span className="strong-val font-bold">Besleyici</span></div>
                <p className="adv-alt mt-2">İris, göz bebeği ve mercek buradadır. Pigmentler sayesinde içini karanlık tutar.</p>
                <div className="list-row"><span className="row-name">Ağ Tabaka (Retina)</span><span className="good-val">Reseptörler</span></div>
              </div>
            </div>
            <div className="adv-card highlight-blue">
              <div className="adv-card-label">Göz Uyumu (Netleme)</div>
              <div className="adv-big-number">Mercek Değişimi</div>
              <p className="text-sm mt-2 opacity-90">• <b>Yakın:</b> Kirpiksi kaslar KASILIR, asıcı bağlar GEVŞER, mercek kalınlaşır.</p>
              <p className="text-sm opacity-90">• <b>Uzak:</b> Kirpiksi kaslar GEVŞER, asıcı bağlar KASILIR, mercek incelir.</p>
            </div>
          </div>
        )}

        {currentPage === 2 && (
          <div className="adv-card">
            <div className="adv-card-header"><h4><FaDna /> 2. Kas Kasılma Mekanizması</h4></div>
            <div className="list-group">
              {[
                "Motor uç plaktan Asetilkolin salınır.",
                "Kas zarı uyarılır, Na+ kanalları açılır.",
                "T-tüpleriyle uyarı içeri iletilir.",
                "Sarkoplazmik Retikulum'dan Ca2+ dökülür.",
                "Ca2+, aktin üzerindeki yolu açar.",
                "ATP parçalanır ve Aktinler Miyozin üzerinde kayar."
              ].map((step, i) => (
                <div key={i} className="list-row trend-row">
                  <span className="row-name"><span className="rank-badge">{i+1}</span> {step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 3 && (
          <div className="adv-grid-2">
            <div className="adv-card" style={{borderColor: 'var(--adv-red)'}}>
              <div className="adv-card-label" style={{color: 'var(--adv-red)'}}>MİYOPI</div>
              <div className="adv-big-number">K U M</div>
              <p className="adv-alt"><b>Kalın Mercek - Uzak - Miyop</b></p>
              <p className="adv-alt mt-2 text-xs">Görüntü retinanın önüne düşer. Göz küresi uzundur.</p>
            </div>
            <div className="adv-card" style={{borderColor: 'var(--adv-green)'}}>
              <div className="adv-card-label" style={{color: 'var(--adv-green)'}}>HİPERMETROPİ</div>
              <div className="adv-big-number">İNCE M.</div>
              <p className="adv-alt">Görüntü arkaya düşer. Yakını göremez.</p>
            </div>
            <div className="adv-card col-span-2">
              <div className="list-row"><span className="row-name">Astigmat</span><span className="strong-val">Silindirik Mercek</span></div>
              <div className="list-row"><span className="row-name">Presbitlik</span><span className="strong-val">İnce Mercek (Yaş)</span></div>
            </div>
          </div>
        )}

        {currentPage === 4 && (
          <div className="adv-card">
            <div className="adv-card-header"><h4><FaBone /> 4. Kemik Yapısı</h4></div>
            <div className="adv-grid-2 mb-4">
              <div className="adv-mini-kart"><b>Osteosit:</b> Hücre</div>
              <div className="adv-mini-kart"><b>Osein:</b> Ara Madde</div>
              <div className="adv-mini-kart"><b>Osteoblast:</b> Yapıcı</div>
              <div className="adv-mini-kart"><b>Osteoklast:</b> Yıkıcı</div>
            </div>
            <div className="list-group">
              <div className="list-row"><span className="row-name">Havers Kanalları</span><span>Boyuna (Dikey)</span></div>
              <div className="list-row"><span className="row-name">Volkman Kanalları</span><span>Enine (Yatay)</span></div>
              <div className="list-row critical-row" style={{background: 'var(--adv-orange)', color: 'white', padding: '10px', borderRadius: '8px', marginTop: '10px'}}>
                <span className="row-name" style={{color: 'white'}}>PERİOST (Kemik Zarı)</span>
                <span style={{fontSize: '0.8rem'}}>Besler, Onarır, Enine Büyütür.</span>
              </div>
            </div>
          </div>
        )}

        {currentPage === 5 && (
          <div className="adv-card">
             <div className="adv-card-header"><h4>Kas Tipleri</h4></div>
             <div className="list-row"><span className="row-name">Düz Kas</span><span className="bad-val">İstemsiz / Otonom</span></div>
             <p className="adv-alt mb-2">Yavaş çalışır, yorulmaz. İç organlarda bulunur.</p>
             <div className="list-row"><span className="row-name">Çizgili Kas</span><span className="good-val">İstemli / Somatik</span></div>
             <p className="adv-alt">Hızlı çalışır, çabuk yorulur. Kol ve bacaklarda bulunur.</p>
          </div>
        )}

        {currentPage === 6 && (
          <div className="adv-card">
            <div className="adv-card-header"><h4><FaEar /> 6. İşitme ve Duyular</h4></div>
            <div className="list-group">
              <div className="list-row"><span className="row-name">Orta Kulak</span><span>Çekiç, Örs, Üzengi</span></div>
              <div className="list-row"><span className="row-name">İç Kulak (İşitme)</span><span>Salyangoz / Corti</span></div>
              <div className="list-row"><span className="row-name">İç Kulak (Denge)</span><span>Yarım Daire Kanalları</span></div>
            </div>
            <div className="empty-state mt-4">Burun ve dildeki reseptörler (kemoreseptörler) maddeyi çözünmüş halde algılar.</div>
          </div>
        )}

        {currentPage === 7 && (
          <div className="space-y-4">
            <div className="adv-card border-l-4" style={{borderColor: 'var(--adv-blue)'}}>
              <h4 className="adv-card-label">GASTRİN</h4>
              <p className="adv-deger">Mideyi Uyarır</p>
              <p className="adv-alt">Mide özsuyu salgısını başlatır.</p>
            </div>
            <div className="adv-card border-l-4" style={{borderColor: 'var(--adv-green)'}}>
              <h4 className="adv-card-label">SEKRETİN</h4>
              <p className="adv-deger">Pankreas / Karaciğer</p>
              <p className="adv-alt">HCO3- salgılatır, safra üretimini sağlar.</p>
            </div>
            <div className="adv-card border-l-4" style={{borderColor: 'var(--adv-red)'}}>
              <h4 className="adv-card-label">KOLESİSTOKİNİN</h4>
              <p className="adv-deger">Safra Kesesi / Pankreas</p>
              <p className="adv-alt">Enzim salgılatır, safra kesesini boşalttırır.</p>
            </div>
          </div>
        )}

        {currentPage === 8 && (
          <div className="space-y-4">
            <div className="adv-card">
              <div className="adv-card-label" style={{color: 'var(--adv-blue)'}}>1. YOL (KAN YOLU)</div>
              <div className="adv-alt font-bold mb-2">Glikoz, Aminoasit, B-C Vitaminleri</div>
              <p className="text-xs">İnce Bağırsak → Kapı Toplardamarı → Karaciğer → Karaciğer Üstü Toplardamarı → Alt Ana Toplardamar → <b>SAĞ KULAKÇIK</b></p>
            </div>
            <div className="adv-card">
              <div className="adv-card-label" style={{color: 'var(--adv-orange)'}}>2. YOL (LENF YOLU)</div>
              <div className="adv-alt font-bold mb-2">Yağ Asidi, Gliserol, A-D-E-K Vitaminleri</div>
              <p className="text-xs">Lenf Kılcalları → Peke Sarnıcı → Göğüs Kanalı → Sol Köprücük Altı Toplardamarı → Üst Ana Toplardamar → <b>SAĞ KULAKÇIK</b></p>
            </div>
          </div>
        )}

      </main>

      {/* Dev Butonlar */}
      <div className="nav-bar">
        <button className="btn-nav btn-prev" onClick={prev} disabled={currentPage === 1}>
          <FaChevronLeft /> GERİ
        </button>
        <button className="btn-nav btn-next" onClick={next} disabled={currentPage === totalPages}>
          {currentPage === totalPages ? 'BİTTİ' : 'İLERİ'} <FaChevronRight style={{marginLeft: '10px'}} />
        </button>
      </div>
    </div>
  );
};

export default App;

