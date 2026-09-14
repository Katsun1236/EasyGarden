/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
    "./src/**/*.html",
    "./src/assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        botanic: {
          light: '#e8ece5',
          DEFAULT: '#728a64',
          dark: '#3a4f2f',
          deep: '#1e2b17',
        },
        gold: {
          DEFAULT: '#D4AF37',
        }
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('tailwindcss-animated'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        easygarden: {
          "primary": "#728a64",
          "primary-focus": "#3a4f2f",
          "primary-content": "#ffffff",
          "secondary": "#D4AF37",
          "accent": "#3a4f2f",
          "neutral": "#1c1917",
          "base-100": "#ffffff",
          "base-200": "#f5f5f4",
          "base-300": "#e7e5e4",
          "info": "#38bdf8",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      "light",
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
}