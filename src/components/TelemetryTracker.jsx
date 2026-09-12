"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { recordPageView, recordSessionTick, recordUserLogin } from "../utils/telemetryLogger";

const TICK_INTERVAL_MS = 30000; // Her 30 saniyede bir oturum süresi güncellemesi
const IDLE_TIMEOUT_MS = 120000; // 2 dakika boyunca etkileşim olmazsa boşa al (idle)

export default function TelemetryTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const initialLoggedRef = useRef(false);

  // 1. Sayfa geçişlerini takip et
  useEffect(() => {
    if (!user || !pathname) return;
    recordPageView(pathname, typeof document !== "undefined" ? document.title : "");
    lastActivityRef.current = Date.now();
  }, [pathname, user]);

  // 2. İlk açılışta cihaz ve oturum kaydını garantiye al
  useEffect(() => {
    if (user && !initialLoggedRef.current) {
      initialLoggedRef.current = true;
      recordUserLogin(user, "session_resume").catch(() => {});
    }
  }, [user]);

  // 3. Kullanıcı etkileşimi dinleyicileri (Mouse, Klavye, Dokunma, Kaydırma)
  useEffect(() => {
    if (!user) return;

    const onUserInteraction = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, onUserInteraction, { passive: true }));

    // 4. Aktif Kullanım Süresi Ticker'ı
    const interval = setInterval(() => {
      // Eğer sekme gizliyse veya 2 dakikadan uzun süredir etkileşim yoksa sayma
      if (document.hidden) return;
      const isIdle = Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS;
      if (isIdle) return;

      // Kullanıcı aktif -> 30 saniye aktiflik süresi ekle
      recordSessionTick(30);
    }, TICK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      events.forEach((ev) => window.removeEventListener(ev, onUserInteraction));
    };
  }, [user]);

  return null; // Arayüzde yer kaplamaz, tamamen arka planda çalışır
}
