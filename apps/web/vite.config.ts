import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/sessions": {
        target: "http://127.0.0.1:3001",
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
      "/health": "http://127.0.0.1:3001",
      "/preview": "http://127.0.0.1:3001",
    },
  },
});
