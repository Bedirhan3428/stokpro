/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        sp: {
          canvas: '#F7F7F5',
          surface: '#FFFFFF',
          obsidian: '#18181B',
          deep: '#0D0D11',
          cardDark: '#16161B',
          caramel: '#A66B49',
          caramelDark: '#8D583A',
          graphite: '#71717A',
          border: '#E8E8E4',
          borderSubtle: '#F0F0EC',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        slate: {
          50: '#f7f9fb',
          100: '#f0f3f6',
          200: '#d8e0ea',
          300: '#c5ced9',
          400: '#939eb0',
          500: '#697587',
          600: '#4d5766',
          700: '#2f3643',
          800: '#242933',
          900: '#1b1f26',
          950: '#13161a',
        },
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
          900: '#1a2434',
          950: '#161e2a',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
