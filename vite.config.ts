import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ENDERECO_DA_API = "http://localhost:3000";

export default defineConfig({
  root: "src/frontend",
  plugins: [react()],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rolldownOptions: {
      input: ["src/frontend/index.html", "src/frontend/nao-encontrado.html"],
    },
  },
  server: {
    proxy: { "/links": ENDERECO_DA_API },
  },
});
