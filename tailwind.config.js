/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
    "./*.html",         // Tous les HTML à la racine
    "./**/*.html",      // Tous les HTML dans TOUS les sous-dossiers (blog, admin, etc.)
    "./js/**/*.js",     // Tes scripts JS
    "./data/*.json"     // Important car tes articles de blog sont là
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