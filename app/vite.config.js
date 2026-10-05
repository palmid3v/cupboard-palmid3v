import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Cupboard",
        short_name: "Cupboard",
        description:
          "Aplicación de gestión de inventario para organizar productos y controlar existencias.",
        theme_color: "#78a85b",
        background_color: "#12100d",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/",
      },
    }),
  ],
});