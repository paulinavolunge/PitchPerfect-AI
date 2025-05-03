
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only include the Lovable tagger in development mode, not in production builds
    (mode === 'development' || mode === 'lovable') &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Set the VITE_LOVABLE environment variable based on mode
  define: {
    'import.meta.env.VITE_LOVABLE': mode === 'production' ? 'false' : 'true',
  }
}));
