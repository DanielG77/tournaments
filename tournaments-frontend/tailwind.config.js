/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        lol: { gold: '#C89B3C', dark: '#010A13', blue: '#0A1428', light: '#F0E6D2' },
        cs: { orange: '#E3890B', dark: '#2D2D2D', gray: '#5A5A5A' },
        pokemon: { red: '#FF0000', blue: '#3B4CCA', yellow: '#FFDE00' },
        'lol-gold': '#c8aa6e',
        'lol-blue': '#0a1428',
        'cs-orange': '#f59e0b',
        'cs-dark': '#1f2937',
        'pokemon-red': '#ef4444',
        'pokemon-blue': '#3b82f6',
        'pokemon-yellow': '#fbbf24',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Beaufort', 'Georgia', 'serif'],
        game: ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
