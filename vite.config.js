import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Özel rotalar için middleware
    {
      name: 'minesweeper-routes-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // URL sorgusunu al
          const urlPath = req.url.split('?')[0];
          
          // /direct-minesweeper/ rotasını yakala
          if (urlPath.startsWith('/direct-minesweeper/')) {
            console.log('Direct-minesweeper rotası yakalandı:', req.url);
            
            // URL'den lobbyId'yi çıkar
            const urlParts = urlPath.split('/');
            const lobbyId = urlParts[2] || '';
            
            if (lobbyId) {
              // index.html içeriğini oku
              const indexHtml = fs.readFileSync(
                resolve(__dirname, 'index.html'),
                'utf-8'
              );
              
              // lobbyId bilgisini sayfaya ekle
              const htmlWithLobby = indexHtml.replace(
                '</head>',
                `  <script>window.minesweeperLobbyId = "${lobbyId}";</script>\n</head>`
              );
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html');
              res.end(htmlWithLobby);
              return;
            }
          }
          
          next();
        });
      }
    }
  ],
  base: '/minesweeper/', // Mayın tarlası alt dizini temel yol
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@minesweeper/common': resolve(__dirname, 'src/utils')
    },
  },
  // Tarayıcı ortamında değişkenleri tanımla
  define: {
    // Global değişkenler
    global: {},
    // Tarayıcıda ortam değişkenlerini window.__VITE_ENV__ üzerinden eriş
    'window.__VITE_ENV__': {
      VITE_API_URL: JSON.stringify(process.env.API_URL || 'http://localhost:3001'),
      VITE_SOCKET_URL: JSON.stringify(process.env.SOCKET_URL || 'http://localhost:3001'),
      VITE_NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      VITE_BASE_URL: JSON.stringify('/minesweeper/'),
      VITE_IFRAME_MODE: JSON.stringify(true)  // iframe modu aktif
    },
    // Global değişkenleri tanımla - burada açık URL belirt
    __API_URL__: JSON.stringify('http://localhost:3001'),
    __SOCKET_URL__: JSON.stringify('http://localhost:3001')
  },
  server: {
    port: 3200,
    open: false,
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    proxy: {
      // API proxy
      '/api': {
        target: process.env.API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      
      // Socket.io proxy
      '/socket.io': {
        target: process.env.SOCKET_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocket desteği
        rewrite: (path) => path
      },
      // Doğrudan endpoint isteklerini yönlendir
      '/lobbies/status': {
        target: 'http://localhost:3001/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lobbies\/status/, '/lobbies/status'),
        secure: false,
      }
    },
    // Hata ayıklama bilgilerini görüntüle
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true,
    // Tüm uyarıları kapatma
    chunkSizeWarningLimit: 2000,
    reportCompressedSize: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
          utils: ['socket.io-client']
        }
      }
    },
    // Çıktı dosyalarının yapılandırması
    terserOptions: {
      compress: {
        drop_console: false // Konsol loglarını koru (geliştirme için)
      }
    }
  },
  // HTML'e eklenen meta etiketleri
  experimental: {
    renderBuiltUrl(filename) {
      return `/minesweeper/${filename}`;
    }
  }
}); 