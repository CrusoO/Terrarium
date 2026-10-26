import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: "../../", // load .env from monorepo root
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replaceAll("\\", "/");
          if (!moduleId.includes("/node_modules/")) return undefined;
          if (moduleId.includes("/firebase/") || moduleId.includes("/@firebase/")) return "firebase";
          if (moduleId.includes("/@mui/icons-material/")) return "mui-icons";
          if (moduleId.includes("/@mui/") || moduleId.includes("/@emotion/")) return "mui";
          if (
            moduleId.includes("/react/") ||
            moduleId.includes("/react-dom/") ||
            moduleId.includes("/scheduler/")
          ) {
            return "react";
          }
          if (moduleId.includes("/gsap/")) return "animation";
          return "vendor";
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/sessions": {
        target: "http://127.0.0.1:3010",
        timeout: 0,
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes, _req, res) => {
            if (proxyRes.headers["content-type"]?.includes("text/event-stream")) {
              res.setHeader("Cache-Control", "no-cache, no-transform");
              res.setHeader("X-Accel-Buffering", "no");
              res.setHeader("Connection", "keep-alive");
            }
          });
        },
      },
      "/health": "http://127.0.0.1:3010",
      "/preview": {
        target: "http://127.0.0.1",
        changeOrigin: true,
        ws: true,
      },
      "/workspace": "http://127.0.0.1:3010",
      "/auth": "http://127.0.0.1:3010",
      "/github": "http://127.0.0.1:3010",
      "/groups": "http://127.0.0.1:3010",
      "/access-requests": "http://127.0.0.1:3010",
      "/tools": "http://127.0.0.1:3010",
      "/settings": "http://127.0.0.1:3010",
      "/brownie": "http://127.0.0.1:3010",
    },
  },
});
