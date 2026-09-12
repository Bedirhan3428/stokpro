// src/utils/theme.js

export const ACCENT_PALETTES = {
  blue: { name: "Okyanus Mavisi", hex: "#3b82f6", hover: "#2563eb", bg: "#eff6ff" },
  emerald: { name: "Zümrüt Yeşili", hex: "#10b981", hover: "#059669", bg: "#ecfdf5" },
  purple: { name: "İndigo / Mor", hex: "#8b5cf6", hover: "#7c3aed", bg: "#f5f3ff" },
  amber: { name: "Kehribar Turuncusu", hex: "#f59e0b", hover: "#d97706", bg: "#fffbeb" },
  rose: { name: "Yakut Kırmızısı", hex: "#f43f5e", hover: "#e11d48", bg: "#fff1f2" }
};

export function initAccent() {
  if (typeof window === "undefined") return "blue";
  const saved = localStorage.getItem("accentColor") || "blue";
  document.documentElement.setAttribute("data-accent", saved);
  return saved;
}

export function setAccent(accent) {
  if (typeof window === "undefined") return "blue";
  const valid = ACCENT_PALETTES[accent] ? accent : "blue";
  localStorage.setItem("accentColor", valid);
  document.documentElement.setAttribute("data-accent", valid);
  window.dispatchEvent(new CustomEvent("accentChange", { detail: valid }));
  return valid;
}

export function initTheme() {
  if (typeof window === "undefined") return "light";
  initAccent();
  const saved = localStorage.getItem("theme");
  if (saved) {
    document.documentElement.setAttribute("data-theme", saved);
    return saved;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const t = prefersDark ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", t);
  return t;
}

export function toggleTheme(current) {
  const next = current === "light" ? "dark" : "light";
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new CustomEvent("themeChange", { detail: next }));
  }
  return next;
}