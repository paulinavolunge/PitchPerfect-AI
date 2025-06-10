
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  
  console.log('Vite config mode:', mode, { isProduction, isDevelopment });
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      // Only include the Lovable tagger in development mode, never in production
      !isProduction && isDevelopment && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Ensure proper environment variables
    define: {
      'import.meta.env.VITE_LOVABLE': JSON.stringify(isDevelopment ? 'true' : 'false'),
    },
    build: {
      // Use esbuild for minification instead of terser (no additional dependency required)
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isDevelopment,
      target: 'es2015',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
      // Ensure clean builds
      emptyOutDir: true,
    },
    // Production optimizations
    ...(isProduction && {
      esbuild: {
        drop: ['console', 'debugger'],
      },
    }),
  };
});
