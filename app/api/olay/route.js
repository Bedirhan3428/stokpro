import { NextResponse } from "next/server";
import { db } from "../../../src/firebase";
import { doc, setDoc, increment } from "firebase/firestore";

// Kullanıcı hunisi sayacı: günlük toplamlar, kişisel veri yok.
// funnel_daily/{YYYY-MM-DD} belgesindeki tek bir alanı 1 artırır.
export const FUNNEL_EVENTS = ["indirme_tik", "ilk_acilis", "gunluk_acilis", "giris"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function todayIstanbul() {
  // Türkiye saatine göre gün (UTC+3)
  return new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const raw = await req.text();
    if (raw.length > 512) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400, headers: corsHeaders });
    }
    let body = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400, headers: corsHeaders });
    }
    const event = String(body?.event || "");
    if (!FUNNEL_EVENTS.includes(event)) {
      return NextResponse.json({ error: "Bilinmeyen olay." }, { status: 400, headers: corsHeaders });
    }
    if (!db) {
      return NextResponse.json({ error: "Veritabanı bağlantısı yok." }, { status: 500, headers: corsHeaders });
    }
    const day = todayIstanbul();
    await setDoc(doc(db, "funnel_daily", day), { day, [event]: increment(1) }, { merge: true });
    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error("Olay kaydedilemedi:", err?.message);
    return NextResponse.json({ error: "Kaydedilemedi." }, { status: 500, headers: corsHeaders });
  }
}
