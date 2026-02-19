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
    },
  },
  plugins: [
    function ({ addUtilities, matchUtilities, theme }) {
      addUtilities({
        ".transform-3d": { transformStyle: "preserve-3d" },
        ".backface-hidden": { backfaceVisibility: "hidden" },
      });

      matchUtilities(
        { perspective: (value) => ({ perspective: value }) },
        { values: theme("perspective") },
      );
    },
  ],
};
