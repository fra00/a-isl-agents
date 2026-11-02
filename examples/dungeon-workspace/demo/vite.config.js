import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  publicDir: path.resolve(__dirname, "../public"),
  plugins: [react()],
  resolve: {
    alias: {
      "@bin": path.resolve(__dirname, "../bin-react-js"),
    },
  },
  server: {
    port: 5177,
    open: true,
  },
});
