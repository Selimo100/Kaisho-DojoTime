/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kaisho Theme - Dunkelblau basierend auf kaisho.ch
        kaisho: {
          primary: '#1a3a5c', // Dunkles Marineblau
          secondary: '#2d5077', // Mittleres Blau
          accent: '#e63946', // Rot-Akzent (wie im Logo)
          light: '#f5f7fa', // Heller Hintergrund
          dark: '#0f2337', // Sehr dunkles Blau
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
