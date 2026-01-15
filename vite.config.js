import { resolve } from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  root: "src/",
  publicDir: "public",
  envDir: "../", // Look for .env file in the project root, not inside src/

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
      },
    },
  },

  server: {
    open: true,
  },

  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["images/logo.png", "images/og-image.jpg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff,woff2}"],
        runtimeCaching: [
          {
            // Cache Bible API calls
            urlPattern: /^https:\/\/bible\.helloao\.org\/api\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "bible-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache bible-api.com verse lookups
            urlPattern: /^https:\/\/bible-api\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "verse-api-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Network-first for Firebase functions (AI, payments)
            urlPattern: /^https:\/\/.*\.cloudfunctions\.net\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Cache FontAwesome CDN
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fontawesome-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: "DiscipleMe - Transform Scripture into Memory",
        short_name: "DiscipleMe",
        description: "Master God's Word through gamified learning, AI-powered insights, and progress tracking. A Creators Lab product.",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["education", "lifestyle", "productivity"],
        icons: [
          {
            src: "/images/creators-lab-logo-dark.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/images/creators-lab-logo-dark.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});