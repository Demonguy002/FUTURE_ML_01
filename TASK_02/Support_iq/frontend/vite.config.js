import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://supportiq-backend-wc8h.onrender.com",
        changeOrigin: true,
        secure: true,
      },
      "/health": {
        target: "https://supportiq-backend-wc8h.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    target: "es2020",
  },
});
