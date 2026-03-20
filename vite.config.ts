import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@client": resolve(__dirname, "src/client"),
      "@server": resolve(__dirname, "src/server"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
});
