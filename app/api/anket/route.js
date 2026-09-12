import { NextResponse } from "next/server";
import { db } from "../../../src/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const AUTHORIZED_EMAIL = "abimer2350@gmail.com";
const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

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
    const email = body?.email ? String(body.email).trim().toLowerCase() : "";

    // SUNUCU TARAFI GÜVENLİK KONTROLÜ: E-posta abimer2350@gmail.com değilse 404 DÖN VE VERİYİ ASLA ÇEKME
    if (!email || email !== AUTHORIZED_EMAIL.toLowerCase()) {
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

    // 1. Surveys koleksiyonundan tüm anket yanıtlarını çek
    let list = [];
    try {
      const surveysRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "surveys");
      const surveysSnap = await getDocs(surveysRef);
      list = surveysSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Surveys okuma uyarısı:", err);
    }

    // 2. Eksik veya users altında kalmış anket kayıtlarını da tara
    try {
      const usersRef = collection(db, "artifacts", ARTIFACT_DOC_ID, "users");
      const usersSnap = await getDocs(usersRef);
      const existingUids = new Set(list.map((s) => s.uid || s.id));

      for (const uDoc of usersSnap.docs) {
        if (!existingUids.has(uDoc.id)) {
          try {
            const pRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uDoc.id, "profile", "user_doc");
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              if (pData.sector || pData.onboardingCompleted || pData.primaryNeed) {
                list.push({
                  id: uDoc.id,
                  uid: uDoc.id,
                  email: pData.email || uDoc.data()?.email || "—",
                  displayName: pData.name || pData.displayName || "—",
                  sector: pData.sector || "Genel",
                  sectorKey: pData.sectorKey || "genel",
                  customSector: pData.customSector || "",
                  primaryNeed: pData.primaryNeed || "Genel",
                  needKey: pData.needKey || "genel",
                  skipped: Boolean(pData.onboardingSkipped),
                  completedAt: pData.onboardingCompletedAt || pData.createdAt || new Date().toISOString()
                });
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn("Users tarama uyarısı:", err);
    }

    // Tarihe göre sırala
    list.sort((a, b) => parseToTime(b.completedAt || b.createdAt) - parseToTime(a.completedAt || a.createdAt));

    // Analitik Metrikleri Hesapla
    const totalCount = list.length;
    const completedCount = list.filter((s) => !s.skipped).length;
    const skippedCount = list.filter((s) => s.skipped).length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Sektör İstatistikleri
    const sectorCounts = {};
    list.forEach((s) => {
      const sec = s.sector || "Belirtilmedi";
      sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
    });

    // İhtiyaç İstatistikleri
    const needCounts = {};
    list.forEach((s) => {
      const nd = s.primaryNeed || "Belirtilmedi";
      needCounts[nd] = (needCounts[nd] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        completedCount,
        skippedCount,
        completionRate,
        sectorCounts,
        needCounts,
        surveys: list
      }
    });
  } catch (error) {
    console.error("API /api/anket hatası:", error);
    return new NextResponse(JSON.stringify({ error: "Sunucu hatası." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// GET isteği doğrudan çağrılırsa 404 döner (güvenlik için)
export async function GET() {
  return new NextResponse(JSON.stringify({ error: "Sayfa bulunamadı." }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}
