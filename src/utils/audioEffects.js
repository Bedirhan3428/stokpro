// src/utils/audioEffects.js
/**
 * StokPro Web Audio API Synthesizer
 * Gerçek ses dosyası indirmeden, tarayıcının yerleşik AudioContext motoruyla
 * yüksek kaliteli ve gecikmesiz (0ms) POS ses efektleri üretir.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof window === "undefined") return false;
  const val = localStorage.getItem("soundEffectsEnabled");
  return val === null || val === "true";
}

export function setSoundEnabled(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem("soundEffectsEnabled", enabled ? "true" : "false");
}

/**
 * 1. Barkod Okuyucu Bip Sesi (POS Scanner Beep)
 * Lazer barkod okuyucu tonu: 1760Hz (A6), 65 milisaniye
 */
export function playScanBeep() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1760, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) {}
}

/**
 * 2. Yazar Kasa / Satış Tamamlama Çanı (Cash Drawer Chime)
 * İki tonlu zengin metalik kasa tınısı
 */
export function playCashRegisterSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = [987.77, 1318.51, 1975.53]; // B5, E6, B6
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.26);
    });
  } catch (e) {}
}

/**
 * 3. Başarılı İşlem / Kaydetme Tonu (Success Chime)
 */
export function playSuccessSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}
