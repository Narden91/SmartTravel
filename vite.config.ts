import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Set base URL for GitHub Pages
    const base = mode === 'production' ? '/SmartTravel/' : '/';
    
    return {
      base,
      define: {
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        headers: {
          // Security headers for development
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://generativelanguage.googleapis.com https://geocoding-api.open-meteo.com",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'"
          ].join('; ')
        },
        proxy: {
          '/api/geocoding': {
            target: 'https://geocoding-api.open-meteo.com/v1',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/geocoding/, ''),
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('Geocoding proxy error:', err);
              });
            }
          }
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              charts: ['recharts'],
              ai: ['@google/genai']
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        // Security optimizations
        sourcemap: false, // Disable source maps in production for security
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true, // Remove console statements in production
            drop_debugger: true
          }
        },
        // Optimize for GitHub Pages
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        // Copy public files including security headers
        copyPublicDir: true
      },
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom', '@google/genai', 'recharts']
      }
    };
});
