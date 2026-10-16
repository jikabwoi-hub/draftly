import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    // Bind to all interfaces so the dev server can be reached through a
    // sandbox/tunnel host. Vite 7 blocks unknown Host headers by default, so
    // the tunnel domains are explicitly allow-listed below.
    host: true,
    allowedHosts: [".myninja.ai", ".trycloudflare.com", "localhost", "127.0.0.1"],
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api": {
        target: env.VITE_PROXY_TARGET || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "framer-motion": ["framer-motion"],
          "lucide-react": ["lucide-react"],
        },
      },
    },
  },
  };
});
