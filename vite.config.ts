// vite.config.ts
import './vite.polyfill' // ✅ Add this line at the very top before anything else

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from 'vite-tsconfig-paths';

export default async function defineViteConfig({ mode }: { mode: 'development' | 'production' | 'test' }) {

  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  const isTest = mode === 'test';

  console.log('Vite config mode (restarted):', mode, { isProduction, isDevelopment, isTest });

  return defineConfig({
    server: {
      host: "::",
      port: isTest ? 5173 : 8080,
    },
    plugins: [
      tsconfigPaths(),
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_LOVABLE': JSON.stringify(isDevelopment ? 'true' : 'false'),
    },
    build: {
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isDevelopment,
      target: 'es2020',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', 'lucide-react'],
            supabase: ['@supabase/supabase-js'],
            analytics: ['@tanstack/react-query'],
            animations: ['framer-motion'],
            charts: ['recharts'],
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'vendor') return 'assets/vendor-[hash].js';
            if (chunkInfo.name === 'ui') return 'assets/ui-[hash].js';
            return 'assets/[name]-[hash].js';
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/styles-[hash].css';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
    },
    ...(isProduction && {
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
      },
    }),
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
        '@supabase/supabase-js',
      ],
    },
  });
}
