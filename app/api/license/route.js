import { NextResponse } from "next/server";
import { db, firebaseConfig } from "../../../src/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { timingSafeEqualHex } from "../../../src/utils/cryptoUtils";

const ARTIFACT_DOC_ID =
  process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION ||
  process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION ||
  "1:330292329201:web:d19827937fb863ea490750";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
};

function maskLicenseKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") return null;
  const clean = rawKey.trim().toUpperCase();
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 7)}-****-****-${clean.slice(-4)}`;
}

async function verifyUserIdToken(req, expectedUid) {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return false;
    const idToken = authHeader.slice("Bearer ".length).trim();
    if (!idToken || idToken.length < 32 || idToken.length > 8192) return false;

    const apiKey =
      firebaseConfig?.apiKey ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.REACT_APP_FIREBASE_API_KEY ||
      "";
    if (!apiKey) return false;

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      }
    );
    if (!lookupRes.ok) return false;
    const data = await lookupRes.json().catch(() => null);
    const verifiedUser = Array.isArray(data?.users) ? data.users[0] : null;
    if (!verifiedUser || verifiedUser.disabled) return false;
    return String(verifiedUser.localId || "").trim() === expectedUid;
  } catch {
    return false;
  }
}

function normalizeLicenseResponse(uid, prof = {}, policy = {}, includeFullKey = false) {
  const nowMs = Date.now();
  const statusRaw = String(prof.subscriptionStatus || "active_lifetime").toLowerCase();

  const rawEndDate = prof.subscriptionEndDate || prof.membershipEndDate || null;
  let parsedEndMs = null;
  let endYear = null;
  if (rawEndDate) {
    const d = new Date(rawEndDate);
    if (!isNaN(d.getTime())) {
      parsedEndMs = d.getTime();
      endYear = d.getUTCFullYear();
    }
  }

  // Legacy +100 yıl kayıtları (yıl >= 2090) veya açıkça isUnlimited !== false olanlar sınırsız kabul edilir
  const isExplicitlyTimed =
    prof.isUnlimited === false ||
    (parsedEndMs !== null && endYear !== null && endYear < 2090 && statusRaw !== "active_lifetime");

  const isUnlimited = !isExplicitlyTimed && statusRaw !== "expired";
  const membershipStartDate =
    prof.membershipStartDate || prof.licenseActivatedAt || prof.createdAt || null;
  const membershipEndDate = isUnlimited || !parsedEndMs ? null : new Date(parsedEndMs).toISOString();

  const isExpired =
    statusRaw === "expired" ||
    (!isUnlimited && parsedEndMs !== null && parsedEndMs < nowMs);

  const daysRemaining =
    !isUnlimited && parsedEndMs !== null
      ? Math.ceil((parsedEndMs - nowMs) / 86400000)
      : null;

  const remoteDisabled = Boolean(
    prof.remoteDisabled === true ||
      statusRaw === "suspended" ||
      statusRaw === "disabled"
  );

  const allowFreeUnlimited = policy.allowFreeUnlimited !== false;
  const hasLicenseKey = Boolean(prof.licenseKey || prof.productKey);
  const requiresLicenseKey = Boolean(
    !allowFreeUnlimited && !hasLicenseKey && prof.adminGrantedUnlimited !== true
  );
  const blockOnExpiry = Boolean(prof.blockOnExpiry ?? policy.blockOnExpiry ?? false);

  const storedKey = prof.licenseKey || prof.productKey || null;

  return {
    uid,
    subscriptionStatus: remoteDisabled
      ? "suspended"
      : isExpired
        ? "expired"
        : isUnlimited
          ? "active_lifetime"
          : "active",
    isUnlimited,
    isExpired,
    daysRemaining,
    membershipStartDate,
    membershipEndDate,
    licenseKey: includeFullKey ? storedKey : null,
    licenseKeyMasked: prof.licenseKeyMasked || maskLicenseKey(storedKey),
    hasLicenseKey,
    remoteDisabled,
    remoteDisabledReason: prof.remoteDisabledReason || null,
    requiresLicenseKey,
    blockOnExpiry,
    policy: {
      allowFreeUnlimited,
      blockOnExpiry: Boolean(policy.blockOnExpiry ?? false),
      minDesktopVersion: policy.minDesktopVersion || "1.0.0",
      forceUpdate: Boolean(policy.forceUpdate ?? false),
    },
    serverTime: new Date(nowMs).toISOString(),
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Veritabanı bağlantısı yok." },
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "check").trim().toLowerCase();
    const uid = String(body?.uid || "").trim();
    const keyHash = String(body?.keyHash || "").trim().toLowerCase();

    if (!uid || !/^[A-Za-z0-9_-]{4,128}$/.test(uid)) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı kimliği." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Genel Sistem Politikasını Oku
    let policy = {
      allowFreeUnlimited: true,
      blockOnExpiry: false,
      minDesktopVersion: "1.0.0",
      forceUpdate: false,
    };
    try {
      const policyRef = doc(db, "system_configs", "app_policy");
      const policySnap = await getDoc(policyRef);
      if (policySnap.exists()) {
        policy = { ...policy, ...policySnap.data() };
      }
    } catch {
      // Kural veya belge henüz yoksa varsayılan sınırsız politika korunur
    }

    // 2. Kullanıcı Profilini Oku
    const profRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid, "profile", "user_doc");
    const profSnap = await getDoc(profRef);
    const prof = profSnap.exists() ? profSnap.data() || {} : {};

    const storedTerminalHash = String(prof.terminalKeyHash || "").trim().toLowerCase();
    const isTerminalVerified =
      Boolean(storedTerminalHash) &&
      /^[a-f0-9]{64}$/.test(keyHash) &&
      timingSafeEqualHex(keyHash, storedTerminalHash);

    if (action === "check") {
      const tokenVerified = isTerminalVerified ? true : await verifyUserIdToken(req, uid);
      return NextResponse.json(
        {
          success: true,
          license: normalizeLicenseResponse(uid, prof, policy, tokenVerified),
        },
        { headers: corsHeaders }
      );
    }

    if (action === "activate") {
      const tokenVerified = isTerminalVerified ? true : await verifyUserIdToken(req, uid);
      if (!tokenVerified && storedTerminalHash) {
        return NextResponse.json(
          { error: "Oturum doğrulaması başarısız. Lütfen yeniden giriş yapın." },
          { status: 403, headers: corsHeaders }
        );
      }

      const rawLicenseKey = String(body?.licenseKey || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

      if (!rawLicenseKey || rawLicenseKey.length < 10 || rawLicenseKey.length > 64 || rawLicenseKey.includes("/")) {
        return NextResponse.json(
          { error: "Geçersiz lisans anahtarı biçimi." },
          { status: 400, headers: corsHeaders }
        );
      }

      const licRef = doc(db, "licenses", rawLicenseKey);
      const licSnap = await getDoc(licRef);
      if (!licSnap.exists()) {
        return NextResponse.json(
          { error: "Lisans anahtarı bulunamadı." },
          { status: 404, headers: corsHeaders }
        );
      }

      const lic = licSnap.data() || {};
      const alreadyUsed = lic.isUsed === true || lic.status === "activated";
      const usedBySameUser = lic.activatedBy === uid || lic.activatedByUid === uid;

      if (alreadyUsed && !usedBySameUser) {
        return NextResponse.json(
          { error: "Bu lisans anahtarı başka bir hesapta etkinleştirilmiş." },
          { status: 409, headers: corsHeaders }
        );
      }

      if (lic.targetUid && lic.targetUid !== uid) {
        return NextResponse.json(
          { error: "Bu lisans anahtarı farklı bir işletme hesabına tanımlanmış." },
          { status: 403, headers: corsHeaders }
        );
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const durationDays = Number(lic.durationDays || 0);
      const isUnlimitedKey = Boolean(lic.isUnlimited === true || durationDays <= 0);

      let newEndDateIso = null;
      if (!isUnlimitedKey) {
        let baseTimeMs = now.getTime();
        if (prof.isUnlimited === false && prof.subscriptionEndDate) {
          const existingEnd = new Date(prof.subscriptionEndDate).getTime();
          if (!isNaN(existingEnd) && existingEnd > baseTimeMs) {
            baseTimeMs = existingEnd;
          }
        }
        newEndDateIso = new Date(baseTimeMs + durationDays * 86400000).toISOString();
      } else {
        const lifetime = new Date(now);
        lifetime.setFullYear(lifetime.getFullYear() + 100);
        newEndDateIso = lifetime.toISOString();
      }

      if (!alreadyUsed) {
        await updateDoc(licRef, {
          status: "activated",
          isUsed: true,
          activatedBy: uid,
          activatedByUid: uid,
          activatedAt: nowIso,
          activatedEmail: String(prof.email || ""),
          hardwareId: String(body?.hardwareId || "").slice(0, 128),
        });
      }

      const startIso = prof.membershipStartDate || prof.createdAt || nowIso;
      const profileUpdates = {
        licenseKey: rawLicenseKey,
        licenseKeyMasked: maskLicenseKey(rawLicenseKey),
        licenseActivatedAt: nowIso,
        membershipStartDate: startIso,
        subscriptionStatus: isUnlimitedKey ? "active_lifetime" : "active",
        isUnlimited: isUnlimitedKey,
        subscriptionEndDate: newEndDateIso,
        remoteDisabled: false,
        remoteDisabledReason: null,
        updatedAt: nowIso,
      };

      await setDoc(profRef, profileUpdates, { merge: true });

      const mergedProf = { ...prof, ...profileUpdates };
      return NextResponse.json(
        {
          success: true,
          license: normalizeLicenseResponse(uid, mergedProf, policy, true),
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "Bilinmeyen işlem." },
      { status: 400, headers: corsHeaders }
    );
  } catch (err) {
    console.error("/api/license hatası:", err);
    return NextResponse.json(
      { error: "Lisans servisi hatası: " + (err?.message || "Bilinmeyen hata") },
      { status: 500, headers: corsHeaders }
    );
  }
}

