/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      perspective: {
        1000: "1000px",
        1200: "1200px",
        2000: "2000px",
        3000: "3000px",
      },

      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },

      letterSpacing: {
        over: "0.18em",
        mega: "0.28em",
      },

      borderRadius: {
        "4xl": "2rem",
      },

      boxShadow: {
        glass: "0 20px 50px rgba(0,0,0,0.8)",
        soft: "0 12px 40px rgba(0,0,0,0.35)",
      },

      zIndex: {
        90: "90",
        100: "100",
        110: "110",
        120: "120",
      },

      height: {
        13: "3.25rem",
      },

      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },

      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [
    function ({ addUtilities, matchUtilities, theme }) {
      addUtilities({
        ".transform-3d": { transformStyle: "preserve-3d" },
        ".backface-hidden": { backfaceVisibility: "hidden" },

        ".glass": {
          backgroundColor: "rgba(9, 9, 11, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        },
      });

      matchUtilities(
        { perspective: (value) => ({ perspective: value }) },
        { values: theme("perspective") },
      );
    },
  ],
};
