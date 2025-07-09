
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
      target: 'es2020',
      cssCodeSplit: true,
      cssMinify: isProduction,
      reportCompressedSize: false, // Faster builds
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunk for React and core libraries
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              if (id.includes('framer-motion')) {
                return 'animations';
              }
              if (id.includes('recharts')) {
                return 'charts';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('@tanstack')) {
                return 'query';
              }
              return 'vendor';
            }
            
            // Component chunks for lazy loading
            if (id.includes('/components/')) {
              if (id.includes('Testimonials') || id.includes('CompanyLogos')) {
                return 'social-proof';
              }
              if (id.includes('InteractiveDemo') || id.includes('VideoWalkthrough')) {
                return 'demo-components';
              }
              if (id.includes('PricingCTA') || id.includes('Footer')) {
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
    // Production optimizations
    ...(isProduction && {
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
      },
    }),
    // Optimize dependencies pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
      ],
      exclude: ['@supabase/supabase-js'],
    },
  };
});
