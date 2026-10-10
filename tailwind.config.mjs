import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 50px -28px rgba(18, 18, 18, 0.35)',
      },
      colors: {
        sand: {
          50: '#faf9f6',
          100: '#f4efe8',
          200: '#e8e0d2',
        },
        gold: {
          50: '#f4ead3',
          100: '#e8d4a2',
          200: '#d7bb72',
          300: '#c5a059',
        },
        ink: {
          900: '#121212',
          800: '#1f1f1f',
        },
      },
    },
  },
  plugins: [typography],
};
