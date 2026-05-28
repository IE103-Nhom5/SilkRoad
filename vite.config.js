import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  cacheDir: ".vite-cache",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react")) return "react";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("lucide-react") || id.includes("lucide")) return "icons";
          return "vendor";
        },
      },
    },
  },
});
