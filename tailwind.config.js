/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kaisho: {
          // --- Brand Hauptfarben ---
          red: "#E10600",          // Primäres Kaisho Rot (Logo + CI)
          redLight: "#FF4F4F",     // Hellrot (Hover / Highlights)

          blue: "#003F7F",         // Primäres Kaisho Blau (Logo / Website)
          blueDark: "#001A33",     // Sehr dunkles Navy (Panels / Tiefe)
          blueLight: "#3A77C9",    // Akzent-Blau (Buttons / Links)
          blueIce: "#EEF6FF",      // Sehr helles Blau (Hintergrundflächen)

          // --- Neutral & Background ---
          dark: "#0A0A0A",         // Haupt-Hintergrund (Dark Mode)
          darkPanel: "#121212",    // Panels / Cards
          black: "#0A0A0A",        // Starker Kontrast
          white: "#FFFFFF",        // Reines Weiß
          whiteSoft: "#F4F4F4",    // Leicht aufgehelltes Weiß
          greyLight: "#D8D8D8",    // Linien / dezente UI-Elemente

          // --- Deine ursprünglichen Töne (angepasst & integriert) ---
          primary: "#1a3a5c",      // Marineblau
          secondary: "#2d5077",    // Mittleres Blau
          accent: "#e63946",       // Roter Akzent (Backup / alt)
          light: "#f5f7fa",        // Heller Hintergrund
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
}
