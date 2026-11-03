import { DEFAULT_SERVER_PORT } from "@ricportal/shared";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type ProxyOptions } from "vite";

// The dev server proxies /api to Express, so the browser sees one origin:
// cookies work and no CORS is needed (DEC-021). The port is the server's
// default; set API_PORT only if PORT in .env was changed. This file never
// reads .env.
function apiPort(): number {
  const raw = process.env.API_PORT;
  if (raw === undefined || raw === "") {
    return DEFAULT_SERVER_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("API_PORT must be a whole number from 1 to 65535");
  }
  return port;
}

const apiProxy: Record<string, ProxyOptions> = {
  "/api": { target: `http://127.0.0.1:${String(apiPort())}`, xfwd: true },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true, proxy: apiProxy },
  preview: { port: 4173, strictPort: true, proxy: apiProxy },
  build: { outDir: "dist", emptyOutDir: true },
});
