import React from "react";
import "../styles/product-key.css";

const packages = [
  {
    id: "1ay",
    title: "1 AY Lisans",
    desc: "Tek cihaz, anında teslim, otomatik aktivasyon.",
    extra: "Önemli Not: Vergi mükellefiyetimiz bulunmadığı için satışımız güvenilirliğinden emin olduğumuz hesap.com.tr üzerinden gerçekleştirilmektedir. Anahtarınız satın alımdan sonra ile size ulaştırılacaktır.",
    price: "₺199",
    oldPrice: null,
    ctaUrl: "https://hesap.com.tr/ilan/512002-stokpro-urun-anahtarilicense-key-1ay",
    tone: "mavi",
  },
  {
    id: "3ay",
    title: "3 AY Lisans",
    desc: "Yaklaşık %17 tasarruf sağlayın ve üç aylık kullanımla ek avantajları cebinize koyun!",
    extra: "Önemli Not: Vergi mükellefiyetimiz bulunmadığı için satışımız güvenilirliğinden emin olduğumuz hesap.com.tr üzerinden gerçekleştirilmektedir. Anahtarınız satın alımdan sonra ile size ulaştırılacaktır.",
    price: "₺499",
    oldPrice: "₺600",
    ctaUrl: "https://hesap.com.tr/ilan/512010-stokpro-urun-anahtarilicense-key-3ay",
    tone: "kirmizi",
  },
];

export default function ProductKeyPage() {
  return (
    <div className="page">
      <header className="hero">
        <p className="pill">Ürün Anahtarı</p>
        <h1>Hızlı Aktivasyon Paketleri</h1>
        <p className="subtitle">
          İhtiyacınıza uygun süre seçenekleriyle hemen kullanmaya başlayın. Anahtarı aktive etmek için <a href="https://www.stokpro.shop/settings" style={{color:"#1f6feb",fontWeight:"bold"}}>Ayarlar </a>sayfasını ziyaret edin.
        </p>
      </header>

      <section className="cards">
        {packages.map((p) => (
          <article key={p.id} className="card">
            <div className="card-head">
              <h2>{p.title}</h2>
              <div className={`tag ${p.tone === "mavi" ? "tag-blue" : "tag-red"}`}>
                {p.tone === "mavi" ? "Hızlı Teslim" : "İndirimli"}
              </div>
            </div>
            <p className="desc">{p.desc}</p>
            <p className="extra">{p.extra}</p>
            <div className="card-foot">
              <div className="price-wrap">
                {p.oldPrice && <span className="old-price">{p.oldPrice}</span>}
                <div className="price">{p.price}</div>
              </div>
              <a
                className={`btn ${p.tone}`}
                href={p.ctaUrl}
                target="_blank"
                rel="noopener"
              >
                Satın Al
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}