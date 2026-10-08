import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: [
      "444d061f-7f31-4310-9fe8-9530001c2ca3-00-2amm4076yk3sk.janeway.replit.dev",
      ".replit.dev",
      ".janeway.replit.dev",
      "localhost",
    ],
    hmr: { overlay: false },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/sitemap.xml": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/robots.txt": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: [
      ".replit.dev",
      ".janeway.replit.dev",
      "localhost",
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
