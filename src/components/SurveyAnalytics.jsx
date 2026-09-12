"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { 
  FiPieChart, FiUsers, FiTrendingUp, FiCheckCircle, 
  FiSearch, FiDownload, FiRefreshCw, FiShield, FiTag, 
  FiLayers, FiFilter, FiActivity, FiSkipForward, FiClock
} from "react-icons/fi";
import * as XLSX from "xlsx";

ChartJS.register(ArcElement, Tooltip, Legend);

const AUTHORIZED_EMAIL = "abimer2350@gmail.com";

export default function SurveyAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    if (!user || user.email?.toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/anket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAnalyticsData(json.data);
        }
      } else {
        console.warn("API /api/anket çağrısı başarısız:", res.status);
      }
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const surveys = analyticsData?.surveys || [];

  // FİLTRELENMİŞ KULLANICI LİSTESİ
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const email = String(s.email || "").toLowerCase();
      const name = String(s.displayName || "").toLowerCase();
      const sector = String(s.sector || "").toLowerCase();
      const custom = String(s.customSector || "").toLowerCase();
      const need = String(s.primaryNeed || "").toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !query ||
        email.includes(query) ||
        name.includes(query) ||
        sector.includes(query) ||
        custom.includes(query) ||
        need.includes(query);

      const matchesSector =
        sectorFilter === "all" ||
        s.sectorKey === sectorFilter ||
        s.sector === sectorFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && !s.skipped) ||
        (statusFilter === "skipped" && s.skipped);

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [surveys, searchTerm, sectorFilter, statusFilter]);

  // LİDER SEKTÖR VE LİDER İHTİYAÇ HESAPLAMASI
  const topSector = useMemo(() => {
    const counts = analyticsData?.sectorCounts || {};
    let max = 0;
    let topName = "—";
    Object.entries(counts).forEach(([name, count]) => {
      if (count > max && name !== "Genel" && name !== "Belirtilmedi") {
        max = count;
        topName = name;
      }
    });
    return { name: topName, count: max };
  }, [analyticsData]);

  const topNeed = useMemo(() => {
    const counts = analyticsData?.needCounts || {};
    let max = 0;
    let topName = "—";
    Object.entries(counts).forEach(([name, count]) => {
      if (count > max && name !== "Genel" && name !== "Belirtilmedi") {
        max = count;
        topName = name;
      }
    });
    return { name: topName, count: max };
  }, [analyticsData]);

  // PASTA GRAFİĞİ VERİLERİ (SEKTÖR DAĞILIMI)
  const sectorChartData = useMemo(() => {
    const counts = analyticsData?.sectorCounts || {};
    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const colors = [
      "#3b82f6", // Mavi (Tekstil)
      "#10b981", // Yeşil (Perakende)
      "#8b5cf6", // Mor (Toptan)
      "#f59e0b", // Turuncu (Diğer)
      "#64748b", // Gri (Genel / Atlanan)
      "#ec4899",
      "#06b6d4"
    ];

    return {
      labels: labels.length > 0 ? labels : ["Veri Yok"],
      datasets: [
        {
          data: data.length > 0 ? data : [1],
          backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
          borderColor: "#ffffff",
          borderWidth: 2
        }
      ]
    };
  }, [analyticsData]);

  // EXCEL / CSV İNDİRME FONKSİYONU
  const handleExportExcel = () => {
    if (filteredSurveys.length === 0) return alert("Dışa aktarılacak veri bulunamadı.");

    const rows = filteredSurveys.map((s, idx) => ({
      "No": idx + 1,
      "E-Posta": s.email || "—",
      "Yetkili / İsim": s.displayName || "—",
      "Seçilen Sektör": s.sector || "Genel",
      "Özel Sektör Açıklaması": s.customSector || "—",
      "İlk Çözmek İstediği Problem": s.primaryNeed || "Genel",
      "Durum": s.skipped ? "Şimdilik Geçti" : "Tamamlandı",
      "Kayıt Tarihi": s.completedAt ? new Date(s.completedAt).toLocaleString("tr-TR") : "—"
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Onboarding_Yanitlari");
    XLSX.writeFile(wb, `StokPro_Anket_Analizleri_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div className="page-header-bar" style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-main)' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="table-badge purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <FiShield /> Yönetici Özel Paneli
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {AUTHORIZED_EMAIL}
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiActivity style={{ color: 'var(--primary)' }} /> Onboarding & Sektör Analiz Merkezi
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Kayıt olan kullanıcıların seçtiği sektörler, acı noktaları ve canlı anket veritabanı.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={fetchData} 
            className="modern-btn secondary"
            disabled={refreshing}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            {refreshing ? "Yenileniyor..." : "Canlı Yenile"}
          </button>

          <button 
            onClick={handleExportExcel} 
            className="modern-btn primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            <FiDownload size={16} /> Excel / CSV İndir
          </button>
        </div>
      </div>

      {/* 4 TEMEL KPI ÖZET KARTI */}
      <div className="kpi-grid">
        
        {/* KART 1: TOPLAM YANIT SAYISI */}
        <div className="kpi-card">
          <div className="kpi-icon blue"><FiUsers /></div>
          <div className="kpi-info">
            <span className="kpi-label">TOPLAM ANKET YANITI</span>
            <span className="kpi-value">{analyticsData?.totalCount || 0} Kullanıcı</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kayıt anında anketi görenler
            </span>
          </div>
        </div>

        {/* KART 2: TAMAMLAMA ORANI */}
        <div className="kpi-card">
          <div className="kpi-icon green"><FiCheckCircle /></div>
          <div className="kpi-info">
            <span className="kpi-label">TAMAMLAMA ORANI</span>
            <span className="kpi-value" style={{ color: 'var(--success)' }}>
              %{analyticsData?.completionRate || 0}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {analyticsData?.completedCount || 0} Tamamlandı • {analyticsData?.skippedCount || 0} Şimdilik Geçti
            </span>
          </div>
        </div>

        {/* KART 3: LİDER SEKTÖR */}
        <div className="kpi-card">
          <div className="kpi-icon purple"><FiLayers /></div>
          <div className="kpi-info">
            <span className="kpi-label">EN ÇOK TERCİH EDİLEN SEKTÖR</span>
            <span className="kpi-value" style={{ fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topSector.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {topSector.count > 0 ? `${topSector.count} İşletme Kaydı` : "Henüz veri yok"}
            </span>
          </div>
        </div>

        {/* KART 4: EN ÇOK TALEP EDİLEN PROBLEM */}
        <div className="kpi-card">
          <div className="kpi-icon orange" style={{ color: '#f59e0b', backgroundColor: '#f59e0b15' }}><FiTag /></div>
          <div className="kpi-info">
            <span className="kpi-label">EN ÖNCELİKLİ ACI NOKTASI</span>
            <span className="kpi-value" style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topNeed.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {topNeed.count > 0 ? `${topNeed.count} Talep` : "Henüz veri yok"}
            </span>
          </div>
        </div>

      </div>

      {/* GRAFİK VE DETAYLI DAĞILIM BÖLÜMÜ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* SOL: SEKTÖR DAĞILIMI PASTA GRAFİĞİ & YÜZDELİKLER */}
        <div className="prd-card">
          <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPieChart style={{ color: 'var(--primary)' }} /> Sektör Dağılımı (Grafik)
            </h4>
          </div>

          <div style={{ height: '240px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Doughnut 
              data={sectorChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 12 } } }
                }
              }} 
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(analyticsData?.sectorCounts || {}).map(([sec, count]) => {
              const total = analyticsData?.totalCount || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={sec} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>{sec}</span>
                    <span>{count} İşletme (%{pct})</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '9999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAĞ: ÖNCELİKLİ İHTİYAÇ & MODÜL TALEBİ DAĞILIMI */}
        <div className="prd-card">
          <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiTrendingUp style={{ color: 'var(--purple)' }} /> Çözülmek İstenen Problem Talepleri
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
            {Object.entries(analyticsData?.needCounts || {}).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Henüz anket verisi kaydedilmedi.</p>
            ) : (
              Object.entries(analyticsData?.needCounts || {}).map(([need, count]) => {
                const total = analyticsData?.totalCount || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={need} style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{need}</strong>
                      <span className="table-badge purple">{count} Talep (%{pct})</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#8b5cf6', borderRadius: '9999px' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* DETAYLI VERİ TABLOSU VE ARAMA/FİLTRE */}
      <div className="prd-card">
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FiUsers style={{ color: 'var(--primary)' }} /> Kayıtlı Kullanıcı Yanıtları ({filteredSurveys.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* ARAMA KUTUSU */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="E-posta, isim veya sektör ara..."
                className="modern-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.82rem' }}
              />
            </div>

            {/* SEKTÖR FİLTRESİ */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="modern-input"
              style={{ height: '36px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
            >
              <option value="all">Tüm Sektörler</option>
              <option value="tekstil">🧵 Tekstil / İmalat</option>
              <option value="perakende">🛍️ Perakende / Mağaza</option>
              <option value="toptan">📦 Toptan / Dağıtım</option>
              <option value="diger">🔧 Diğer</option>
            </select>

            {/* DURUM FİLTRESİ */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="modern-input"
              style={{ height: '36px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="completed">✓ Tamamlandı</option>
              <option value="skipped">⏭️ Şimdilik Geçti</option>
            </select>
          </div>
        </div>

        {filteredSurveys.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiSearch size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Aranan kriterlere uygun anket kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kullanıcı (E-Posta / İsim)</th>
                  <th>Seçilen Sektör</th>
                  <th>Özel Açıklama</th>
                  <th>İlk Çözmek İstediği Problem</th>
                  <th style={{ textAlign: 'center' }}>Durum</th>
                  <th style={{ textAlign: 'center' }}>Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((s, idx) => (
                  <tr key={s.id || s.uid || idx}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{s.email || "—"}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.displayName || "İşletme Yetkilisi"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`table-badge ${s.sectorKey === 'tekstil' ? 'blue' : s.sectorKey === 'perakende' ? 'green' : s.sectorKey === 'toptan' ? 'purple' : 'gray'}`}>
                        {s.sector || "Genel"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: s.customSector ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {s.customSector || "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {s.primaryNeed || "Genel"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {s.skipped ? (
                        <span className="table-badge gray" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <FiSkipForward size={12} /> Şimdilik Geçti
                        </span>
                      ) : (
                        <span className="table-badge green" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <FiCheckCircle size={12} /> Tamamlandı
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {s.completedAt ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <FiClock size={12} />
                          {new Date(s.completedAt).toLocaleDateString("tr-TR")} {new Date(s.completedAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
