// src/utils/cryptoUtils.js
// SHA-256 Hash ve Terminal Anahtarı Yardımcı Fonksiyonları

/**
 * Verilen metni veya anahtarı SHA-256 ile hashler (Hex formatında döner)
 * Hem tarayıcıda (crypto.subtle) hem de Node.js ortamında sorunsuz çalışır.
 */
export async function hashKey(key) {
  if (!key) return '';
  const clean = String(key).trim();
  if (!clean) return '';

  const subtle =
    (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) ||
    (typeof window !== 'undefined' && window.crypto && window.crypto.subtle);

  if (subtle) {
    const msgBuffer = new TextEncoder().encode(clean);
    const hashBuffer = await subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Node.js veya sunucu ortamı fallback (başarısız olursa düz metin döndürme, hata fırlat)
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * Sunucu (Node.js) tarafı için senkron SHA-256 fonksiyonu
 */
export function hashKeySync(key) {
  if (!key) return '';
  const clean = String(key).trim();
  if (!clean) return '';
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * İki 64 karakterlik SHA-256 hex özetini zamanlama saldırılarına (timing attack) karşı sabit sürede karşılaştırır
 */
export function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(cleanA) || !/^[a-f0-9]{64}$/.test(cleanB)) {
    return false;
  }
  try {
    const crypto = require('crypto');
    const bufA = Buffer.from(cleanA, 'hex');
    const bufB = Buffer.from(cleanB, 'hex');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  } catch {
    let diff = 0;
    for (let i = 0; i < 64; i++) {
      diff |= cleanA.charCodeAt(i) ^ cleanB.charCodeAt(i);
    }
    return diff === 0;
  }
}

/**
 * Masaüstü terminali için kriptografik güvenli (CSPRNG) 16 haneli anahtar üretir
 * Format: SP-XXXX-XXXX-XXXX-XXXX
 */
export function generateTerminalKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 karakter (modulo bias yok)
  let randomBytes = null;

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    randomBytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(randomBytes);
  } else {
    const crypto = require('crypto');
    randomBytes = crypto.randomBytes(16);
  }

  let result = 'SP';
  for (let i = 0; i < 16; i++) {
    if (i % 4 === 0) result += '-';
    result += chars.charAt(randomBytes[i] & 31);
  }
  return result;
}

/**
 * Anahtarı arayüzde güvenli göstermek için maskeler
 * Örnek: SP-****-****-****-9K2F
 */
export function maskKey(key) {
  if (!key) return '';
  const clean = String(key).trim();
  if (clean.length <= 6) return '****';
  const lastFour = clean.slice(-4);
  return 'SP-****-****-****-' + lastFour;
}
