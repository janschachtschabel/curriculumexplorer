import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // API endpoint to list JSON files in the json folder
  app.get('/api/json-files', async (req, res) => {
    try {
      const jsonPath = path.join(__dirname, 'json');
      const files = await fs.readdir(jsonPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      res.json({ files: jsonFiles });
    } catch (error) {
      console.error('Error reading JSON directory:', error);
      res.status(500).json({ error: 'Failed to read JSON files' });
    }
  });

  // Serve the json directory
  app.use('/json', express.static(path.join(__dirname, 'json')));

  // Serve static files from the 'dist' directory after build
  app.use(express.static(path.join(__dirname, 'dist')));

  // For all routes not handled by the static middleware, send the index.html file
  // Only enable this for production mode
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Start server
  const port = process.env.PORT || 4000; // Use a different port than Vite
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`API endpoint available at http://localhost:${port}/api/json-files`);
    console.log(`JSON files served from http://localhost:${port}/json/`);
  });
}

createServer();