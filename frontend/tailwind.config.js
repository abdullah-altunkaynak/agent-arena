/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Dark palette (Industrial) ---
        void: "#080A0F",
        abyss: "#0D1117",
        forge: "#161B24",
        steel: "#1E2530",
        gunmetal: "#252D3A",
        slate: "#2E3848",
        // --- Accent ---
        cyan: { 400: "#22D3EE", 500: "#06B6D4", 600: "#0891B2" },
        acid: { 400: "#A3E635", 500: "#84CC16", 600: "#65A30D" },
        amber: { 400: "#FBBF24", 500: "#F59E0B", 600: "#D97706" },
        rose: { 400: "#FB7185", 500: "#F43F5E" },
        // --- Text ---
        wire: "#94A3B8",
        mist: "#64748B",
        spark: "#E2E8F0",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(34,211,238,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.04) 1px,transparent 1px)",
        "glow-radial":
          "radial-gradient(ellipse 80% 40% at 50% 0%,rgba(34,211,238,.12),transparent)",
        "hero-gradient":
          "linear-gradient(135deg,#080A0F 0%,#0D1117 50%,#0A1628 100%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(34,211,238,.35), 0 0 40px rgba(34,211,238,.15)",
        "neon-acid": "0 0 20px rgba(163,230,53,.35), 0 0 40px rgba(163,230,53,.1)",
        "inner-lg": "inset 0 2px 24px rgba(0,0,0,.6)",
        "card": "0 4px 24px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.04) inset",
        "card-hover": "0 8px 40px rgba(34,211,238,.15), 0 1px 0 rgba(255,255,255,.08) inset",
      },
      animation: {
        "scan-line": "scanLine 4s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(.4,0,.6,1) infinite",
        "flicker": "flicker 6s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "data-flow": "dataFlow 2s linear infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: ".4" },
          "94%": { opacity: "1" },
          "96%": { opacity: ".6" },
          "97%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        dataFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
