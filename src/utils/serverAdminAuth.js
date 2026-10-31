// src/utils/serverAdminAuth.js
// Sunucu tarafı (Next.js Route Handler) Firebase ID Token doğrulama ve Admin yetki kontrolü
import { firebaseConfig } from "../firebase";

const AUTHORIZED_EMAIL = "abimer2350@gmail.com";
const MASTER_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";

/**
 * İstek başlığındaki Authorization: Bearer <idToken> değerini Google Identity Toolkit
 * üzerinden kriptografik olarak doğrular ve yalnızca sistem yöneticisine izin verir.
 */
export async function verifyAdminRequest(req) {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return { authorized: false };
    }

    const idToken = authHeader.slice("Bearer ".length).trim();
    if (!idToken || idToken.length < 32 || idToken.length > 8192) {
      return { authorized: false };
    }

    const apiKey =
      firebaseConfig?.apiKey ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.REACT_APP_FIREBASE_API_KEY ||
      "";

    if (!apiKey) {
      return { authorized: false };
    }

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      }
    );

    if (!lookupRes.ok) {
      return { authorized: false };
    }

    const data = await lookupRes.json().catch(() => null);
    const verifiedUser = Array.isArray(data?.users) ? data.users[0] : null;
    if (!verifiedUser || verifiedUser.disabled) {
      return { authorized: false };
    }

    const verifiedUid = String(verifiedUser.localId || "").trim();
    const verifiedEmail = String(verifiedUser.email || "").trim().toLowerCase();
    const isEmailVerified = verifiedUser.emailVerified !== false;

    const isMasterUid = verifiedUid === MASTER_ADMIN_UID;
    const isMasterEmail =
      isEmailVerified && verifiedEmail === AUTHORIZED_EMAIL.toLowerCase();

    if (!isMasterUid && !isMasterEmail) {
      return { authorized: false };
    }

    return {
      authorized: true,
      uid: verifiedUid,
      email: verifiedEmail,
    };
  } catch {
    return { authorized: false };
  }
}

