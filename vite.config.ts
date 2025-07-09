
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
      // Use esbuild for minification with ES6+ target
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isProduction, // Only in production for debugging
      target: 'es2022', // Modern browsers only
      cssCodeSplit: true,
      cssMinify: isProduction,
      reportCompressedSize: false, // Faster builds
      // Purge unused CSS
      rollupOptions: {
        external: [], // Remove unused external deps
        output: {
          // Optimized chunking for critical path
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Critical React bundle
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react';
              }
              // UI essentials only
              if (id.includes('@radix-ui') && (id.includes('dialog') || id.includes('button') || id.includes('tooltip'))) {
                return 'ui-core';
              }
              // Router
              if (id.includes('react-router')) {
                return 'router';
              }
              // Defer heavy libraries
              if (id.includes('recharts') || id.includes('@tanstack/react-query') || id.includes('framer-motion')) {
                return 'heavy-libs';
              }
              // Supabase
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              return 'vendor';
            }
          },
          // Cache-friendly file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/css/[name]-[hash].css';
            }
            return 'assets/[ext]/[name]-[hash][extname]';
          },
        },
      },
      // Ensure clean builds
      emptyOutDir: true,
      // Optimize chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    // Production optimizations with tree shaking
    ...(isProduction && {
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
        treeShaking: true,
      },
    }),
    
    // Optimize dependencies pre-bundling for smaller bundles
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        '@supabase/postgrest-js',
      ],
      exclude: [
        '@tanstack/react-query',
        'framer-motion',
        'recharts'
      ],
    },
  };
});
