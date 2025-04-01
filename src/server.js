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

  // Debug endpoint to list all directories and files
  app.get('/api/debug-files', async (req, res) => {
    try {
      const result = {
        currentDir: __dirname,
        directories: {},
      };
      
      // Check several potential paths
      const pathsToCheck = [
        { name: 'current', path: __dirname },
        { name: 'parent', path: path.join(__dirname, '..') },
        { name: 'json', path: path.join(__dirname, '..', 'json') },
        { name: 'public_json', path: path.join(__dirname, '..', 'public', 'json') },
        { name: 'src', path: path.join(__dirname, '..', 'src') },
        { name: 'public', path: path.join(__dirname, '..', 'public') },
      ];
      
      for (const dirInfo of pathsToCheck) {
        try {
          const files = await fs.readdir(dirInfo.path);
          result.directories[dirInfo.name] = {
            path: dirInfo.path,
            exists: true,
            files: files
          };
        } catch (err) {
          result.directories[dirInfo.name] = {
            path: dirInfo.path,
            exists: false,
            error: err.message
          };
        }
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // API endpoint to list JSON files in the json folder with enhanced error handling and multiple path checking
  app.get('/api/json-files', async (req, res) => {
    try {
      // Try multiple potential paths where JSON files might be stored
      const potentialPaths = [
        path.join(__dirname, '..', 'json'),
        path.join(__dirname, '..', 'public', 'json'),
        path.join(__dirname, 'json'),
        path.join(__dirname, 'public', 'json')
      ];
      
      let allFiles = [];
      
      for (const jsonPath of potentialPaths) {
        try {
          const dirExists = await fs.access(jsonPath).then(() => true).catch(() => false);
          
          if (dirExists) {
            const files = await fs.readdir(jsonPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            console.log(`Found ${jsonFiles.length} JSON files in ${jsonPath}`);
            allFiles = [...allFiles, ...jsonFiles];
          }
        } catch (dirError) {
          console.error(`Error reading directory ${jsonPath}:`, dirError);
        }
      }
      
      // Remove duplicates by creating a Set and converting back to array
      allFiles = [...new Set(allFiles)];
      
      console.log(`Total unique JSON files found: ${allFiles.length}`);
      res.json({ files: allFiles });
    } catch (error) {
      console.error('Error reading JSON directories:', error);
      res.status(500).json({ 
        error: 'Failed to read JSON files', 
        details: error.message
      });
    }
  });

  // Serve the json directory - setup multiple paths to be safe
  app.use('/json', express.static(path.join(__dirname, '..', 'json')));
  app.use('/json', express.static(path.join(__dirname, '..', 'public', 'json')));
  app.use('/json', express.static(path.join(__dirname, 'json')));
  app.use('/json', express.static(path.join(__dirname, 'public', 'json')));

  // Serve static files from the 'dist' directory after build
  app.use(express.static(path.join(__dirname, '..', 'dist')));

  // For all routes not handled by the static middleware, send the index.html file
  // Only enable this for production mode
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
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