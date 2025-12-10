const THEME_KEY = "stokpro-theme";

export function getStoredTheme() {
  if (typeof localStorage === "undefined") return "light";
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme = "light") {
  if (typeof document === "undefined") return theme;
  const t = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch (e) {
    console.warn("Theme persist failed", e);
  }
  return t;
}

export function initTheme() {
  const stored = getStoredTheme();
  return applyTheme(stored);
}

export function toggleTheme(current) {
  const next = current === "dark" ? "light" : "dark";
  return applyTheme(next);
}