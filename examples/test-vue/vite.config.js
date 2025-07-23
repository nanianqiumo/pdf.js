import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true,
    cors: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    fs: {
      // allow: ["..", "../.."], // 允许访问上级目录
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": resolve(".", "src"),
    },
  },
  optimizeDeps: {
    // exclude: ["pdfjs-editor"],
  },
});
