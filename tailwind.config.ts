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
        brutalism: {
          bg: '#FBF7F3',
          panel: '#F4EDE4',
          dark: '#3C3836',
          border: '#B89968',
          accent: '#D97757',
          hover: '#F4EDE4',
          success: '#8FAF6F',
          warning: '#E9A87E',
          danger: '#C97C5D',
          orange: '#D97757',
          peach: '#E9A87E',
          cream: '#F4EDE4',
          brown: '#8B6F47',
          light: '#FBF7F3',
        }
      },
      boxShadow: {
        'brutal': '3px 3px 0px 0px rgba(184, 153, 104, 0.3)',
        'brutal-lg': '6px 6px 0px 0px rgba(184, 153, 104, 0.2)',
        'brutal-sm': '2px 2px 0px 0px rgba(184, 153, 104, 0.3)',
      }
    },
  },
  plugins: [],
} satisfies Config;
