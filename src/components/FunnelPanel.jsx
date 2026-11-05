"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { FiDownload, FiMonitor, FiLogIn, FiActivity, FiRefreshCw } from "react-icons/fi";

const STEPS = [
  { key: "indirme_tik", label: "İndirme tıklaması", hint: "Sitede indir butonuna basıldı", icon: FiDownload },
  { key: "ilk_acilis", label: "İlk açılış", hint: "Program kurulup ilk kez açıldı (v1.0.5+)", icon: FiMonitor },
  { key: "giris", label: "Giriş", hint: "Programdan webe giriş tamamlandı (v1.0.5+)", icon: FiLogIn },
  { key: "gunluk_acilis", label: "Günlük açılış", hint: "Her kurulumda günde en fazla 1 (v1.0.5+)", icon: FiActivity },
];

function dayStr(offset = 0) {
  return new Date(Date.now() + 3 * 3600 * 1000 - offset * 86400000).toISOString().slice(0, 10);
}

const card = { padding: "1.1rem", borderRadius: "0.75rem", background: "var(--card-bg)", border: "1px solid var(--border-color)" };

// Kullanıcı hunisi: son 30 günün günlük sayaçları + masaüstünde son 7 günde görülen kullanıcılar
export default function FunnelPanel({ users = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState(30);

  const load = async () => {
    if (!db) return;
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(query(collection(db, "funnel_daily"), where("day", ">=", dayStr(89))));
      setRows(snap.docs.map((d) => ({ day: d.id, ...d.data() })));
    } catch (err) {
      setError(err?.code === "permission-denied" ? "Sayaçlar okunamadı: Firestore kuralları henüz yüklenmemiş olabilir." : "Sayaçlar okunamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const days = useMemo(() => {
    const byDay = Object.fromEntries(rows.map((r) => [r.day, r]));
    return Array.from({ length: range }, (_, i) => {
      const d = dayStr(i);
      return { day: d, ...(byDay[d] || {}) };
    });
  }, [rows, range]);

  const totals = useMemo(
    () => Object.fromEntries(STEPS.map((s) => [s.key, days.reduce((sum, d) => sum + Number(d[s.key] || 0), 0)])),
    [days]
  );

  const weekAgo = Date.now() - 7 * 86400000;
  const desktopActive = users
    .filter((u) => u.desktopLastSeenAt && new Date(u.desktopLastSeenAt).getTime() >= weekAgo)
    .sort((a, b) => new Date(b.desktopLastSeenAt) - new Date(a.desktopLastSeenAt));

  const rate = (a, b) => (totals[b] > 0 ? `%${Math.round((totals[a] / totals[b]) * 100)}` : "—");

  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Kullanıcı Hunisi</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.2rem 0 0" }}>
            Siteden indirme → kurulum → giriş → düzenli kullanım. Kişisel veri tutulmaz, yalnızca günlük toplamlar.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {[7, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{ padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: range === r ? "#3b82f6" : "var(--card-bg)", color: range === r ? "#fff" : "var(--text-main)", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}
            >
              {r} gün
            </button>
          ))}
          <button onClick={load} title="Yenile" style={{ padding: "0.4rem 0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", cursor: "pointer" }}>
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} />
          </button>
        </div>
      </div>

      {error && <div style={{ ...card, color: "#e11d48", marginBottom: "0.75rem", fontWeight: 600 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
                <span>{i + 1}. {s.label}</span>
                <Icon size={15} />
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.3rem" }}>{loading ? "…" : totals[s.key]}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{s.hint}</div>
              {i === 1 && <div style={{ fontSize: "0.75rem", fontWeight: 700, marginTop: "0.3rem" }}>İndirenin kuran oranı: {rate("ilk_acilis", "indirme_tik")}</div>}
              {i === 2 && <div style={{ fontSize: "0.75rem", fontWeight: 700, marginTop: "0.3rem" }}>Kuranın giriş oranı: {rate("giris", "ilk_acilis")}</div>}
            </div>
          );
        })}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>
            <span>Masaüstünde aktif (7 gün)</span>
            <FiMonitor size={15} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.3rem" }}>{desktopActive.length}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Lisans kontrolü yapan hesaplar</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: "0.75rem" }}>
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.4rem" }}>Gün</th>
                {STEPS.map((s) => <th key={s.key} style={{ padding: "0.4rem", textAlign: "right" }}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.filter((d) => STEPS.some((s) => d[s.key])).map((d) => (
                <tr key={d.day} style={{ borderTop: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "0.4rem", fontFamily: "monospace" }}>{d.day}</td>
                  {STEPS.map((s) => <td key={s.key} style={{ padding: "0.4rem", textAlign: "right", fontWeight: 700 }}>{d[s.key] || 0}</td>)}
                </tr>
              ))}
              {!loading && days.every((d) => !STEPS.some((s) => d[s.key])) && (
                <tr><td colSpan={STEPS.length + 1} style={{ padding: "0.8rem", color: "var(--text-muted)" }}>Bu aralıkta henüz kayıt yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.5rem" }}>Masaüstünde son görülenler</div>
          {desktopActive.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Son 7 günde kayıt yok.</div>}
          {desktopActive.map((u) => (
            <div key={u.uid} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.35rem 0", borderTop: "1px solid var(--border-color)", fontSize: "0.82rem" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
              <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {new Date(u.desktopLastSeenAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                {u.desktopVersion ? ` · v${u.desktopVersion}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
