import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();
  
  // Parse JSON bodies for requests
  app.use(express.json());

  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });

  // Create WLO API proxy middleware
  const wloApiProxy = createProxyMiddleware({
    target: 'https://redaktion.openeduhub.net',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
      '^/api': ''
    },
    onProxyReq: (proxyReq, req, res) => {
      // Log outgoing request
      console.log(`Proxy Request: ${req.method} ${req.url}`);
      
      // If it's a POST request with a body, write it to the proxy request
      if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Set CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept';
      
      // Log response status
      console.log(`Proxy Response: ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Proxy Error', 
          message: err.message 
        });
      }
    }
  });

  // Apply proxy middleware for WLO API requests
  app.use('/api/edu-sharing/rest', wloApiProxy);

  // Debug endpoint to check file system structure
  app.get('/api/debug-fs', async (req, res) => {
    try {
      const result = {
        currentDir: __dirname,
        projectRoot: path.join(__dirname, '..'),
        directories: {}
      };
      
      // Check several potential paths
      const pathsToCheck = [
        { name: 'current', path: __dirname },
        { name: 'parent', path: path.join(__dirname, '..') },
        { name: 'json', path: path.join(__dirname, '..', 'json') },
        { name: 'public_json', path: path.join(__dirname, '..', 'public', 'json') },
        { name: 'src', path: path.join(__dirname, '..', 'src') },
        { name: 'public', path: path.join(__dirname, '..', 'public') },
        { name: 'dist', path: path.join(__dirname, '..', 'dist') },
        { name: 'dist_json', path: path.join(__dirname, '..', 'dist', 'json') }
      ];
      
      for (const dirInfo of pathsToCheck) {
        try {
          const stats = await fs.stat(dirInfo.path);
          if (stats.isDirectory()) {
            const files = await fs.readdir(dirInfo.path);
            
            // For JSON directories, get more details about the files
            const fileDetails = [];
            if (dirInfo.name.includes('json')) {
              for (const file of files) {
                try {
                  const filePath = path.join(dirInfo.path, file);
                  const fileStats = await fs.stat(filePath);
                  fileDetails.push({
                    name: file,
                    size: fileStats.size,
                    isDirectory: fileStats.isDirectory(),
                    lastModified: fileStats.mtime
                  });
                } catch (fileError) {
                  fileDetails.push({ name: file, error: fileError.message });
                }
              }
            }
            
            result.directories[dirInfo.name] = {
              path: dirInfo.path,
              exists: true,
              files: files,
              fileDetails: fileDetails.length > 0 ? fileDetails : undefined
            };
          } else {
            result.directories[dirInfo.name] = {
              path: dirInfo.path,
              exists: true,
              isFile: true
            };
          }
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

  // API endpoint to list JSON files in the json folder
  app.get('/api/json-files', async (req, res) => {
    try {
      console.log('Received request for JSON files list');
      
      // Try multiple potential paths where JSON files might be stored
      const potentialPaths = [
        path.join(__dirname, '..', 'json'),
        path.join(__dirname, '..', 'public', 'json'),
        path.join(__dirname, '..', 'dist', 'json'),
        path.join(__dirname, 'json'),
        path.join(__dirname, 'public', 'json')
      ];
      
      console.log('Checking these paths for JSON files:', potentialPaths);
      
      const allFiles = [];
      const pathResults = {};
      
      for (const jsonPath of potentialPaths) {
        try {
          console.log(`Checking directory: ${jsonPath}`);
          const dirExists = await fs.access(jsonPath).then(() => true).catch(() => false);
          
          if (dirExists) {
            try {
              const files = await fs.readdir(jsonPath);
              const jsonFiles = files.filter(file => file.endsWith('.json'));
              console.log(`Found ${jsonFiles.length} JSON files in ${jsonPath}:`, jsonFiles);
              
              // Store results for this path
              pathResults[jsonPath] = {
                exists: true,
                files: jsonFiles
              };
              
              allFiles.push(...jsonFiles);
            } catch (readError) {
              console.error(`Error reading directory ${jsonPath}:`, readError);
              pathResults[jsonPath] = {
                exists: true,
                error: readError.message
              };
            }
          } else {
            console.log(`Directory does not exist: ${jsonPath}`);
            pathResults[jsonPath] = { exists: false };
          }
        } catch (dirError) {
          console.error(`Error checking directory ${jsonPath}:`, dirError);
          pathResults[jsonPath] = {
            error: dirError.message
          };
        }
      }
      
      // Remove duplicates by creating a Set and converting back to array
      const uniqueFiles = [...new Set(allFiles)];
      
      console.log(`Total unique JSON files found: ${uniqueFiles.length}`);
      console.log('Unique files:', uniqueFiles);
      
      // If no files found through scanning, add known files as fallback
      if (uniqueFiles.length === 0) {
        console.log('No files found through scanning, using hardcoded list as fallback');
        const knownFiles = [
          'Anlagenmechaniker-IH04-03-25-idF-18-02-23_Anlagenmechaniker_Anlagenmechanikerin.json',
          'Aenderungsschneider.pdf_converted_Änderungsschneider_Änderungsschneiderin.json',
          'Anlagenmechaniker_SHK_16-01-29-E.pdf_converted_Anlagenmechaniker_für_Sanitär-__Heizungs-_und_Klimatechnik_Anlagenmechanikerin_für_Sanitär-__Heizungs-_und_Klimatechnik.json',
          'Asphaltbauer84-02-10.pdf_converted_Asphaltbauer_Asphaltbauerin.json',
          'Aufbereitungsmechaniker92-04-29.pdf_converted_Aufbereitungsmechaniker_Aufbereitungsmechanikerin.json',
          'Augenoptiker11-03-25-E_01.pdf_converted_Augenoptiker_Augenoptikerin.json',
          'Ausbaufacharbeiter.pdf_converted_Ausbaufacharbeiter_-in.json'
        ];
        uniqueFiles.push(...knownFiles);
      }
      
      res.json({ 
        files: uniqueFiles,
        searchResults: pathResults
      });
    } catch (error) {
      console.error('Error reading JSON directories:', error);
      res.status(500).json({ 
        error: 'Failed to read JSON files', 
        details: error.message
      });
    }
  });

  // API endpoint to serve a specific JSON file with detailed error handling
  app.get('/api/json/:filename', async (req, res) => {
    const filename = req.params.filename;
    console.log(`Request for specific JSON file: ${filename}`);
    
    // Try multiple potential paths
    const potentialPaths = [
      path.join(__dirname, '..', 'json', filename),
      path.join(__dirname, '..', 'public', 'json', filename),
      path.join(__dirname, '..', 'dist', 'json', filename),
      path.join(__dirname, 'json', filename),
      path.join(__dirname, 'public', 'json', filename)
    ];
    
    for (const filePath of potentialPaths) {
      try {
        console.log(`Trying to read: ${filePath}`);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          console.log(`File found at: ${filePath}`);
          const fileContent = await fs.readFile(filePath, 'utf8');
          
          // Try parsing the JSON to verify it's valid
          try {
            JSON.parse(fileContent);
            res.setHeader('Content-Type', 'application/json');
            return res.send(fileContent);
          } catch (parseError) {
            console.error(`Invalid JSON in ${filePath}:`, parseError);
            continue; // Try next path if this file isn't valid JSON
          }
        }
      } catch (error) {
        console.log(`File not found at: ${filePath}`);
        // Continue to next path
      }
    }
    
    // If we've tried all paths and failed
    console.error(`Could not find JSON file ${filename} in any location`);
    res.status(404).json({
      error: `File ${filename} not found`,
      searchedPaths: potentialPaths
    });
  });

  // Serve the json directory from multiple potential locations
  app.use('/json', express.static(path.join(__dirname, '..', 'json')));
  app.use('/json', express.static(path.join(__dirname, '..', 'public', 'json')));
  app.use('/json', express.static(path.join(__dirname, '..', 'dist', 'json')));
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
    console.log(`WLO API proxy running at http://localhost:${port}/api/edu-sharing/rest/`);
  });
}

createServer();