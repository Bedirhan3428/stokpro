export function initTheme() {
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
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
  return next;
}