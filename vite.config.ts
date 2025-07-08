
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
      // Use esbuild for minification (faster than terser)
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isDevelopment,
      target: 'es2020',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core vendor libraries (critical)
            vendor: ['react', 'react-dom'],
            // Router and navigation (critical)
            router: ['react-router-dom'],
            // UI libraries (load early)
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', 'lucide-react'],
            // Backend integration (defer)
            supabase: ['@supabase/supabase-js'],
            // Analytics and tracking (lazy load)
            analytics: ['@tanstack/react-query'],
            // Animation libraries (defer)
            animations: ['framer-motion'],
            // Charts and data visualization (lazy load)
            charts: ['recharts'],
            // Heavy components (lazy load)
            dashboard: ['/src/pages/Dashboard.tsx'],
            practice: ['/src/pages/Practice.tsx', '/src/pages/AIRoleplay.tsx'],
          },
          // Optimize chunk file names with cache busting
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'vendor') return 'assets/vendor-[hash].js';
            if (chunkInfo.name === 'ui') return 'assets/ui-[hash].js';
            if (chunkInfo.name === 'charts') return 'assets/charts-[hash].js';
            if (chunkInfo.name === 'analytics') return 'assets/analytics-[hash].js';
            return 'assets/[name]-[hash].js';
          },
          assetFileNames: (assetInfo) => {
            // Organize assets with cache-friendly names
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/styles-[hash].css';
            }
            if (assetInfo.name?.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (assetInfo.name?.match(/\.(woff|woff2|ttf|eot)$/)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // Ensure clean builds
      emptyOutDir: true,
      // Optimize chunk size warnings
      chunkSizeWarningLimit: 500, // Smaller chunks for better caching
    },
    // Production optimizations
    ...(isProduction && {
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
        treeShaking: true,
      },
    }),
    // Optimize dependencies pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
      ],
      exclude: [
        '@supabase/supabase-js',
        '@tanstack/react-query',
        'recharts',
        'framer-motion'
      ],
    },
    // CSS optimization
    css: {
      devSourcemap: isDevelopment,
      postcss: {
        plugins: isProduction ? [
          require('cssnano')({
            preset: ['default', {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              mergeLonghand: true,
              mergeRules: true,
            }]
          })
        ] : [],
      },
    },
  };
});
