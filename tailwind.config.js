/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // GÖZÜ YORMAYAN YUMUŞAK CHARCOAL & GRAFİT PALETİ (LACİVERT VE KÖR EDİCİ BEYAZI ENGELLEYEN SOFT PALET)
        slate: {
          50: '#f7f9fb',   // Gündüz yumuşak zemin (bembeyaz değil, sakin ve dinlendirici)
          100: '#f0f3f6',  // Gündüz panel/kart içi kutucuk zemini
          200: '#d8e0ea',  // Gündüz belirgin yumuşak çerçeve çizgisi
          300: '#c5ced9',  // Ayrıcı çizgi
          400: '#939eb0',  // Gece ikincil/muted metin
          500: '#697587',  // Gündüz ikincil metin
          600: '#4d5766',  // Koyu vurgu
          700: '#2f3643',  // Gece belirgin çerçeve çizgisi
          800: '#242933',  // Gece panel/kart içi kutucuk zemini
          900: '#1b1f26',  // Gece yumuşak kart yüzeyi (asla mavi/lacivert değil)
          950: '#13161a',  // Gece mat dinlendirici ana zemin
        },
        // GÖZÜ YORAN PARLAK LACİVERTİ ENGELLEYEN YUMUŞATILMIŞ MAVİ TONLARI
        blue: {
          50: '#eff5ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e2d42',
          900: '#1a2434',  // Yumuşatılmış koyu mavi tonu
          950: '#161e2a',  // Gözü yormayan yumuşak mat gece mavisi (asla parlak lacivert değil)
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.15s ease-out',
      }
    },
  },
  plugins: [],
}
