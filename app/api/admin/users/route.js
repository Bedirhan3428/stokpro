import { NextResponse } from "next/server";
import { db } from "../../../../src/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";

const AUTHORIZED_EMAIL = "abimer2350@gmail.com";
const MASTER_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";
const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

function isAuthorized(email, uid) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return (
    normalizedEmail === AUTHORIZED_EMAIL.toLowerCase() ||
    uid === MASTER_ADMIN_UID
  );
}

function parseToDate(val) {
  if (!val) return null;
  try {
    if (typeof val === "object" && typeof val.toDate === "function") {
      return val.toDate();
    }
    if (typeof val === "object" && typeof val.seconds === "number") {
      return new Date(val.seconds * 1000);
    }
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {}
  return null;
}

function parseToIso(val) {
  const d = parseToDate(val);
  return d ? d.toISOString() : null;
}

function parseToTime(val) {
  const d = parseToDate(val);
  return d ? d.getTime() : 0;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { requesterEmail, requesterUid, targetUid } = body;

    // GÜVENLİK PROTOKOLÜ: Sadece yetkili kullanıcı erişebilir, diğerlerine 404
    if (!isAuthorized(requesterEmail, requesterUid)) {
      return new NextResponse(JSON.stringify({ error: "Sayfa bulunamadı." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!db) {
      return new NextResponse(JSON.stringify({ error: "Veritabanı bağlantısı yok." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // TEK KULLANICI DERİNLEMESİNE İNCELEME (DEEP DIVE)
    if (targetUid) {
      const userRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // Profil belgesini de kontrol et
      const profRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "profile", "user_doc");
      const profSnap = await getDoc(profRef).catch(() => null);
      const profData = profSnap?.exists() ? profSnap.data() : {};

      // Anket belgesini de kontrol et
      const surveyRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "surveys", targetUid);
      const surveySnap = await getDoc(surveyRef).catch(() => null);
      const surveyData = surveySnap?.exists() ? surveySnap.data() : {};

      // Activity Logs (Son 100 işlem)
      let logs = [];
      try {
        const logsCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "activity_logs");
        const logsQuery = query(logsCol, orderBy("createdAt", "desc"), limit(100));
        const logsSnap = await getDocs(logsQuery);
        logs = logsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (logErr) {
        // İndeks yoksa fallback basit getDocs
        try {
          const fallbackCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "activity_logs");
          const fallbackSnap = await getDocs(fallbackCol);
          logs = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          logs.sort((a, b) => parseToTime(b.createdAt) - parseToTime(a.createdAt));
          logs = logs.slice(0, 100);
        } catch {}
      }

      // Kullanıcının Ürünleri (Son 50 ürün)
      let products = [];
      try {
        const prodCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "products");
        const prodSnap = await getDocs(prodCol);
        products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {}

      // Kullanıcının Satışları (Son 50 satış)
      let sales = [];
      try {
        const salesCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "sales");
        const salesSnap = await getDocs(salesCol);
        sales = salesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        sales.sort((a, b) => parseToTime(b.createdAt) - parseToTime(a.createdAt));
      } catch {}

      // Kullanıcının Müşterileri (Cariler)
      let customers = [];
      try {
        const custCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "customers");
        const custSnap = await getDocs(custCol);
        customers = custSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {}

      // Kullanıcının Kasa/Muhasebe Hareketleri
      let ledger = [];
      try {
        const ledgerCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users", targetUid, "ledger");
        const ledgerSnap = await getDocs(ledgerCol);
        ledger = ledgerSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ledger.sort((a, b) => parseToTime(b.createdAt) - parseToTime(a.createdAt));
      } catch {}

      return NextResponse.json({
        success: true,
        user: {
          uid: targetUid,
          ...userData,
          profile: profData,
          survey: {
            sector: surveyData.sector || profData.sector || userData.sector || "Genel",
            primaryNeed: surveyData.primaryNeed || profData.primaryNeed || userData.primaryNeed || "Genel",
            customSector: surveyData.customSector || profData.customSector || "",
            skipped: Boolean(surveyData.skipped ?? profData.onboardingSkipped),
            completedAt: surveyData.completedAt || profData.onboardingCompletedAt || null
          },
          logs,
          products,
          sales,
          customers,
          ledger
        }
      });
    }

    // TÜM KULLANICILARIN LİSTESİ VE ÖZET İSTATİSTİKLER
    const usersCol = collection(db, "artifacts", ARTIFACT_DOC_ID, "users");
    const usersSnap = await getDocs(usersCol);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    let totalProductsCount = 0;
    let totalSalesCount = 0;
    let totalSalesVolume = 0;
    let activeTodayCount = 0;
    let activeThisWeekCount = 0;
    let surveyCompletedCount = 0;
    let totalActiveSecondsSum = 0;

    const list = await Promise.all(
      usersSnap.docs.map(async (uDoc) => {
        const uData = uDoc.data() || {};
        const uid = uDoc.id;

        // Profil detayını çek
        let prof = {};
        try {
          const profRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
          const pSnap = await getDoc(profRef);
          if (pSnap.exists()) prof = pSnap.data();
        } catch {}

        // Anket detayını çek
        let survey = {};
        try {
          const sRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "surveys", uid);
          const sSnap = await getDoc(sRef);
          if (sSnap.exists()) survey = sSnap.data();
        } catch {}

        const email = uData.email || prof.email || "E-posta Yok";
        const displayName = prof.displayName || prof.name || uData.displayName || "İsimsiz";
        const companyTitle = prof.companyTitle || prof.storeName || "—";
        const sector = survey.sector || prof.sector || uData.sector || "Genel";
        const primaryNeed = survey.primaryNeed || prof.primaryNeed || uData.primaryNeed || "Genel";
        const onboardingCompleted = Boolean(prof.onboardingCompleted || survey.completedAt);
        const onboardingSkipped = Boolean(prof.onboardingSkipped || survey.skipped);

        const lastLoginAt = uData.lastLoginAt || null;
        const lastActiveAt = uData.lastActiveAt || uData.lastLoginAt || uData.createdAt || null;
        const totalActiveSeconds = Number(uData.totalActiveSeconds || 0);
        const streakDays = Number(uData.continuityStreakDays || (uData.lastActiveDate === todayStr ? 1 : 0));
        const activeDaysCount = Object.keys(uData.activeDays || {}).length;

        // Veri sayıları (eğer profilde yoksa mevcut alt koleksiyon boyutu)
        const productsCount = Number(uData.productsCount || 0);
        const salesCount = Number(uData.salesCount || 0);
        const salesVolume = Number(uData.totalSalesVolume || 0);
        const customersCount = Number(uData.customersCount || 0);

        // İstatistik kümülatifi
        totalProductsCount += productsCount;
        totalSalesCount += salesCount;
        totalSalesVolume += salesVolume;
        totalActiveSecondsSum += totalActiveSeconds;

        const lastActiveIso = parseToIso(lastActiveAt);
        const lastActiveDate = parseToDate(lastActiveAt);
        const isToday = uData.lastActiveDate === todayStr || (lastActiveIso && lastActiveIso.slice(0, 10) === todayStr);
        if (isToday) {
          activeTodayCount++;
        }
        if (lastActiveDate && lastActiveDate >= sevenDaysAgo) {
          activeThisWeekCount++;
        }
        if (onboardingCompleted && !onboardingSkipped) {
          surveyCompletedCount++;
        }

        return {
          uid,
          email,
          displayName,
          companyTitle,
          createdAt: parseToIso(uData.createdAt || prof.createdAt),
          lastLoginAt: parseToIso(uData.lastLoginAt),
          lastActiveAt: lastActiveIso,
          totalActiveSeconds,
          streakDays,
          activeDaysCount,
          loginCount: Number(uData.loginCount || 1),
          deviceInfo: uData.deviceInfo || {},
          pageViews: uData.pageViews || {},
          sector,
          primaryNeed,
          onboardingCompleted,
          onboardingSkipped,
          productsCount,
          salesCount,
          totalSalesVolume: salesVolume,
          customersCount
        };
      })
    );

    // Son aktif olanlar en üstte
    list.sort((a, b) => {
      const timeA = parseToTime(a.lastActiveAt || a.lastLoginAt || a.createdAt);
      const timeB = parseToTime(b.lastActiveAt || b.lastLoginAt || b.createdAt);
      return timeB - timeA;
    });

    const totalUsers = list.length;
    const avgActiveSeconds = totalUsers > 0 ? Math.round(totalActiveSecondsSum / totalUsers) : 0;
    const surveyRate = totalUsers > 0 ? Math.round((surveyCompletedCount / totalUsers) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeTodayCount,
        activeThisWeekCount,
        totalProductsCount,
        totalSalesCount,
        totalSalesVolume,
        surveyCompletedCount,
        surveyRate,
        avgActiveSeconds
      },
      users: list
    });

  } catch (err) {
    console.error("API /api/admin/users hatası:", err);
    return new NextResponse(JSON.stringify({ error: "Sunucu hatası: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function GET() {
  return new NextResponse(JSON.stringify({ error: "Sayfa bulunamadı." }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}
