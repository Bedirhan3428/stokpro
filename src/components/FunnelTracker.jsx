"use client";

import { useEffect } from "react";

// data-funnel="olay" taşıyan bağlantılara tıklanınca olayı sayaca gönderir.
// sendBeacon sayfa değişse/indirme başlasa bile isteği tamamlar; kişisel veri gönderilmez.
export function sendFunnelEvent(event) {
  try {
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/olay", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/olay", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

export default function FunnelTracker() {
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target instanceof Element ? e.target.closest("[data-funnel]") : null;
      if (el) sendFunnelEvent(el.getAttribute("data-funnel"));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
