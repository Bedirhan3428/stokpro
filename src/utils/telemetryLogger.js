// src/utils/telemetryLogger.js
// Kapsamlı Kullanıcı Telemetrisi, Cihaz Profilleme, Oturum Süresi & Süreklilik (Streak) ve Olay Loglama

import { db, auth } from "../firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from "firebase/firestore";

const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

/**
 * Cihaz ve çevre telemetri bilgilerini toplar.
 */
export function getClientTelemetry() {
  if (typeof window === "undefined") {
    return { isServer: true };
  }

  const nav = window.navigator || {};
  const scr = window.screen || {};

  // Tarayıcı tespiti
  const ua = nav.userAgent || "";
  let browser = "Bilinmiyor";
  if (/edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/opr\//i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Apple Safari";

  // İşletim Sistemi tespiti
  let os = "Bilinmiyor";
  if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Cihaz türü
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) || window.innerWidth < 768;
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua) || (window.innerWidth >= 768 && window.innerWidth <= 1024);
  const deviceType = isTablet ? "Tablet" : isMobile ? "Mobil" : "Masaüstü";

  // PWA Standalone Kontrolü
  const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  // Çözünürlük & Ekran
  const screenResolution = `${scr.width || 0}x${scr.height || 0}`;
  const windowSize = `${window.innerWidth || 0}x${window.innerHeight || 0}`;

  return {
    browser,
    os,
    deviceType,
    isPWA,
    screenResolution,
    windowSize,
    language: nav.language || "tr-TR",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul",
    hardwareConcurrency: nav.hardwareConcurrency || null,
    deviceMemory: nav.deviceMemory || null,
    connectionType: nav.connection?.effectiveType || null,
    referrer: document.referrer || "Doğrudan",
    userAgentSnippet: ua.slice(0, 150)
  };
}

/**
 * Kullanıcı kimliğini güvenli getirir
 */
function getCurrentUid(explicitUid) {
  if (explicitUid) return explicitUid;
  return auth?.currentUser?.uid || null;
}

/**
 * Genel Olay Loglama (Non-blocking, hataya dayanıklı)
 * artifacts/{ARTIFACT_DOC_ID}/users/{uid}/activity_logs altına yazar.
 */
export async function logUserActivity(eventType, title, details = {}, options = {}) {
  try {
    const uid = getCurrentUid(options.uid);
    if (!uid || !db) return;

    const userEmail = options.email || auth?.currentUser?.email || null;
    const clientInfo = options.clientInfo || getClientTelemetry();
    const nowIso = new Date().toISOString();

    const logPayload = {
      uid,
      userEmail,
      type: eventType,
      title: String(title || eventType),
      details: details || {},
      path: typeof window !== "undefined" ? window.location.pathname : null,
      clientInfo,
      createdAt: nowIso,
      timestamp: serverTimestamp()
    };

    // 1. activity_logs alt koleksiyonuna ekle
    const logsCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "activity_logs");
    addDoc(logsCol, logPayload).catch((e) => console.warn("activity_log kaydedilemedi:", e?.message));

    // 2. Kullanıcı profil özetindeki son aktiflik ve sayaçları güncelle
    const userDocRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid);
    const updates = {
      lastActiveAt: nowIso,
      updatedAt: nowIso
    };

    if (userEmail) updates.email = userEmail;

    // Spesifik sayaç güncellemeleri
    if (eventType === "PRODUCT_CREATE") updates.productsCount = increment(1);
    if (eventType === "PRODUCT_DELETE") updates.productsCount = increment(-1);
    if (eventType === "SALE_CREATE") {
      updates.salesCount = increment(1);
      if (details.total && !isNaN(Number(details.total))) {
        updates.totalSalesVolume = increment(Number(details.total));
      }
    }
    if (eventType === "CUSTOMER_CREATE") updates.customersCount = increment(1);
    if (eventType === "EXPENSE_CREATE" || eventType === "INCOME_CREATE") updates.transactionsCount = increment(1);

    setDoc(userDocRef, updates, { merge: true }).catch(() => {});

  } catch (err) {
    console.warn("logUserActivity non-blocking catch:", err?.message);
  }
}

/**
 * Kullanıcı giriş yaptığında oturumu ve cihaz profilini başlatır
 */
export async function recordUserLogin(user, loginMethod = "email_password") {
  if (!user || !user.uid) return;
  try {
    const uid = user.uid;
    const email = user.email || "";
    const clientInfo = getClientTelemetry();
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10); // YYYY-MM-DD

    const userDocRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid);
    const userSnap = await getDoc(userDocRef).catch(() => null);

    let streakDays = 1;
    let activeDaysMap = {};

    if (userSnap && userSnap.exists()) {
      const data = userSnap.data();
      const lastDate = data.lastActiveDate;
      activeDaysMap = data.activeDays || {};

      if (lastDate && lastDate !== todayStr) {
        // Dün mü aktif oldu?
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastDate === yesterday) {
          streakDays = (data.continuityStreakDays || 1) + 1;
        } else {
          streakDays = 1; // seri bozuldu
        }
      } else if (lastDate === todayStr) {
        streakDays = data.continuityStreakDays || 1;
      }
    }

    activeDaysMap[todayStr] = (activeDaysMap[todayStr] || 0) + 1;

    const profileData = {
      uid,
      email,
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      lastActiveDate: todayStr,
      continuityStreakDays: streakDays,
      activeDays: activeDaysMap,
      loginCount: increment(1),
      deviceInfo: clientInfo,
      updatedAt: nowIso
    };

    await setDoc(userDocRef, profileData, { merge: true });

    // Olay logu yaz
    await logUserActivity("AUTH_LOGIN", `Giriş Yapıldı (${loginMethod})`, {
      method: loginMethod,
      device: clientInfo.deviceType,
      browser: clientInfo.browser,
      os: clientInfo.os,
      screen: clientInfo.screenResolution
    }, { uid, email, clientInfo });

  } catch (err) {
    console.warn("recordUserLogin hatası:", err);
  }
}

/**
 * Aktif Kullanım Süresi Ticker'ı (Heartbeat)
 * Kullanıcı aktifken periyodik olarak çağrılır (Örn: her 30 saniyede bir 30 sn ekler)
 */
export async function recordSessionTick(activeDurationSeconds = 30) {
  const uid = auth?.currentUser?.uid;
  if (!uid || !db) return;

  try {
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);
    const userDocRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid);

    await setDoc(userDocRef, {
      totalActiveSeconds: increment(activeDurationSeconds),
      lastActiveAt: nowIso,
      lastActiveDate: todayStr,
      [`activeDays.${todayStr}`]: increment(1)
    }, { merge: true });

  } catch (e) {
    // Silent fail to preserve smooth UI performance
  }
}

/**
 * Sayfa Görüntüleme Logu
 */
export async function recordPageView(pathname, pageTitle = "") {
  const uid = auth?.currentUser?.uid;
  if (!uid || !db) return;

  try {
    const pathKey = pathname.replace(/\//g, "_").slice(0, 40) || "home";
    const nowIso = new Date().toISOString();
    const userDocRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid);

    // Profildeki sayfa sayaçlarını güncelle
    setDoc(userDocRef, {
      lastActiveAt: nowIso,
      [`pageViews.${pathKey}`]: increment(1)
    }, { merge: true }).catch(() => {});

    // Activity log ekle
    const logsCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "activity_logs");
    addDoc(logsCol, {
      uid,
      userEmail: auth?.currentUser?.email || null,
      type: "PAGE_VIEW",
      title: `Sayfa Ziyareti: ${pathname}`,
      details: { pathname, pageTitle },
      path: pathname,
      clientInfo: getClientTelemetry(),
      createdAt: nowIso,
      timestamp: serverTimestamp()
    }).catch(() => {});

  } catch (err) {
    console.warn("recordPageView hatası:", err);
  }
}
