import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#111111',
          card: '#F4F1EA',
        },
        retro: {
          pink: '#FF0055',
          cyan: '#00FFFF',
          lime: '#CCFF00',
          yellow: '#FFFF00',
          black: '#000000',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        heading: ['Oswald', 'Impact', 'sans-serif'],
        body: ['Courier New', 'monospace'],
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px #000000',
        'retro-lg': '8px 8px 0px 0px #000000',
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
          '62%': { transform: 'translate(0,0) skew(5deg)' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
