import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 3460,
    proxy: { "/api": "http://127.0.0.1:3461" },
  },
  build: { outDir: "dist", sourcemap: false },
});
