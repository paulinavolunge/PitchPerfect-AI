
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
      sourcemap: true, // Always generate source maps for better debugging
      target: 'es2020',
      cssCodeSplit: true,
      cssMinify: isProduction,
      reportCompressedSize: false, // Faster builds
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Aggressive chunking for smaller initial bundles
            if (id.includes('node_modules')) {
              // Core React bundle
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-core';
              }
              // UI libraries chunk
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-lib';
              }
              // Router chunk
              if (id.includes('react-router')) {
                return 'router';
              }
              // Heavy analytics/charts
              if (id.includes('recharts') || id.includes('@tanstack/react-query')) {
                return 'analytics';
              }
              // Heavy animation libraries
              if (id.includes('framer-motion')) {
                return 'animations';
              }
              // Supabase chunk
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              // Other vendor libraries
              return 'vendor';
            }
            
            // Split pages into separate chunks
            if (id.includes('/pages/')) {
              if (id.includes('Analytics') || id.includes('Progress') || id.includes('Dashboard')) {
                return 'analytics-pages';
              }
              if (id.includes('Demo') || id.includes('Practice') || id.includes('RolePlay')) {
                return 'demo-pages';
              }
              if (id.includes('Auth') || id.includes('Login') || id.includes('Signup')) {
                return 'auth-pages';
              }
              return 'other-pages';
            }
            
            // Split heavy components
            if (id.includes('/components/')) {
              if (id.includes('Charts') || id.includes('Analytics') || id.includes('Progress')) {
                return 'chart-components';
              }
              if (id.includes('Demo') || id.includes('Interactive') || id.includes('Video')) {
                return 'demo-components';
              }
              if (id.includes('Testimonials') || id.includes('Pricing') || id.includes('Footer')) {
                return 'marketing-components';
              }
            }
          },
          // Optimize chunk file names
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
      ],
      exclude: [
        '@supabase/supabase-js',
        '@tanstack/react-query',
        'framer-motion',
        'recharts'
      ],
    },
  };
});
