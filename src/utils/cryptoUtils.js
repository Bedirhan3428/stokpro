// src/utils/cryptoUtils.js
// SHA-256 Hash ve Terminal Anahtarı Yardımcı Fonksiyonları

/**
 * Verilen metni veya anahtarı SHA-256 ile hashler (Hex formatında döner)
 * Hem tarayıcıda (crypto.subtle) hem de Node.js ortamında sorunsuz çalışır.
 */
export async function hashKey(key) {
  if (!key) return '';
  const clean = String(key).trim();
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(clean);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Node.js veya sunucu ortamı fallback
  try {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(clean).digest('hex');
  } catch {
    return clean;
  }
}

/**
 * Sunucu (Node.js) tarafı için senkron SHA-256 fonksiyonu
 */
export function hashKeySync(key) {
  if (!key) return '';
  const clean = String(key).trim();
  try {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(clean).digest('hex');
  } catch {
    return clean;
  }
}

/**
 * Masaüstü terminali için kriptografik güvenli 16 haneli anahtar üretir
 * Format: SP-XXXX-XXXX-XXXX-XXXX
 */
export function generateTerminalKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SP';
  for (let i = 0; i < 16; i++) {
    if (i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
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
