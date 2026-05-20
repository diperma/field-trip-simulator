import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL === "1" ? "/" : "/field-trip-simulator/",
  server: {
    host: "127.0.0.1",
    port: 5174,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
