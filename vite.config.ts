import { defineConfig } from "vite";
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/api/v1": {
        target: "http://localhost:5000",
        changeOrigin: true,
        configure(proxy) {
          // The dev proxy is a server-to-server hop; keep browser requests
          // same-origin without changing the backend's CORS allowlist.
          proxy.on("proxyReq", (request) => request.removeHeader("origin"));
        },
      },
    },
  },
  build: { target: "es2022" },
});
