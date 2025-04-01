import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create a custom plugin to serve JSON files from the json directory
const serveJsonFiles = () => {
  return {
    name: 'serve-json-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/json/')) {
          try {
            // Handle both json directory and public/json directory
            const jsonPath = resolve(__dirname, 'json', req.url.slice(6));
            const publicJsonPath = resolve(__dirname, 'public', req.url);
            
            let filePath = '';
            
            if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).isFile()) {
              filePath = jsonPath;
            } else if (fs.existsSync(publicJsonPath) && fs.statSync(publicJsonPath).isFile()) {
              filePath = publicJsonPath;
            }
            
            if (filePath && filePath.endsWith('.json')) {
              console.log(`Serving JSON file: ${filePath}`);
              const content = fs.readFileSync(filePath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(content);
              return;
            }
          } catch (error) {
            console.error('Error serving JSON file:', error);
          }
        }
        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    serveJsonFiles()
  ],
  server: {
    port: 5173,
    proxy: {
      // Verwende die genaue Proxy-Pfad-Konfiguration aus dem alten Code
      '^/api/edu-sharing/rest/': {
        target: 'https://redaktion.openeduhub.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          // Füge CORS-Header hinzu
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          });
          // Füge Fehlerprotokollierung hinzu
          proxy.on('error', (err) => {
            console.log('Proxy error:', err);
          });
        },
        headers: {
          'User-Agent': 'WLO-KI-Editor'
        },
        timeout: 60000  // 60 Sekunden Timeout
      }
    },
    open: true // Automatisch Browser öffnen
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  publicDir: 'public'
});