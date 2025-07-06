import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      workbox: {
        maximumFileSizeToCacheInBytes: 6100000, // Set to 4MB or any higher value
      },
      manifest: {
        name: "Character News",
        short_name: "Character News",
        start_url: "./",
        display: "standalone",
        theme_color: "#d2d2d2",
        background_color: "#d2d2d2",
        description: "PWA install handler package for Character news",
        icons: [
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1751074363/2_dv9kah.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1751074363/2_dv9kah.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "https://res.cloudinary.com/dtkeyccga/image/upload/v1751074363/2_dv9kah.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    onConsoleLog(log) {
      return !log.includes("React Router Future Flag Warning");
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
}));
