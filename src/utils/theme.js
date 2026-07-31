export function initTheme() {
  if (typeof window === "undefined") return "light";
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