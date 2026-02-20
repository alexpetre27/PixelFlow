import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import sanity from "@sanity/astro";

export default defineConfig({
  integrations: [
    react(),
    sanity({
      projectId: "zcrc78yf",
      dataset: "production",
      useCdn: true,
      studioHost: "pxflow",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    domains: ["cdn.sanity.io"],
  },
});
