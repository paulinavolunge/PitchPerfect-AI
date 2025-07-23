
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
      react({
        // Ensure React import is handled properly
        jsxRuntime: 'automatic',
      }),
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
      // Ensure global is defined for better browser compatibility
      global: 'globalThis',
    },
    build: {
      // Use esbuild for minification instead of terser (no additional dependency required)
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isDevelopment,
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13'],
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core vendor libraries
            vendor: ['react', 'react-dom'],
            // Router and navigation
            router: ['react-router-dom'],
            // UI libraries
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', 'lucide-react'],
            // Backend integration
            supabase: ['@supabase/supabase-js'],
            // Analytics and tracking
            analytics: ['@tanstack/react-query'],
            // Animation libraries
            animations: ['framer-motion'],
            // Charts and data visualization
            charts: ['recharts'],
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
        // Ensure proper handling of JSX
        jsx: 'automatic',
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
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
        'react/jsx-runtime',
      ],
      exclude: ['@supabase/supabase-js'],
      // Force pre-bundling of React to avoid initialization issues
      force: true,
    },
  };
});
