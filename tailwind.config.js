/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./blog/*.html",
    "./js/**/*.js",
    "./admin/*.html"
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
  plugins: [],
}