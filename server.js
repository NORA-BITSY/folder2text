const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { shouldSkipTraversal, shouldSkipContent, supportsOCR } = require('./ignore');
const OCRService = require('./ocr');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OCR service
let ocrService = null;

async function initializeOCR() {
  try {
    ocrService = new OCRService();
    console.log('OCR service initialized for web server');
  } catch (error) {
    console.error('Failed to initialize OCR service:', error.message);
  }
}

// Initialize OCR on startup
initializeOCR();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper function to get user-friendly starting directory
function getStartingDirectory() {
  // Start from user's home directory on macOS/Linux, or user profile on Windows
  return os.homedir();
}

// API to get directory contents for browsing
app.get('/api/browse', async (req, res) => {
  try {
    let dirPath = req.query.path;
    
    // If no path specified, start from home directory
    if (!dirPath) {
      dirPath = getStartingDirectory();
    }

    // Resolve the path to handle relative paths and symlinks
    dirPath = path.resolve(dirPath);

    const items = await fs.readdir(dirPath);
    const result = [];

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      try {
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          // Skip hidden directories that start with . (except for common dev folders)
          if (item.startsWith('.') && !['.vscode', '.git', '.github'].includes(item)) {
            continue;
          }
          
          result.push({
            name: item,
            type: 'directory',
            path: itemPath
          });
        }
      } catch (error) {
        // Skip items we can't access (permission denied, etc.)
        continue;
      }
    }

    // Sort directories alphabetically, but put common dev folders first
    const commonDevFolders = ['Desktop', 'Documents', 'Downloads', 'Projects', 'Development', 'Code', 'src'];
    result.sort((a, b) => {
      const aIsCommon = commonDevFolders.includes(a.name);
      const bIsCommon = commonDevFolders.includes(b.name);
      
      if (aIsCommon && !bIsCommon) return -1;
      if (!aIsCommon && bIsCommon) return 1;
      
      return a.name.localeCompare(b.name);
    });

    // Get parent directory, but don't go above root
    const parent = path.dirname(dirPath);
    const isAtRoot = parent === dirPath;

    res.json({ 
      currentPath: dirPath,
      parent: isAtRoot ? dirPath : parent,
      items: result,
      isAtRoot
    });
  } catch (error) {
    console.error('Browse error:', error);
    res.status(500).json({ error: `Cannot access directory: ${error.message}` });
  }
});

// API to process folder and generate text
app.post('/api/process', async (req, res) => {
  try {
    const { folderPath, outputName, additionalFilters = [], enableOCR = true } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    // Verify the folder exists and is accessible
    try {
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: 'Provided path is not a directory' });
      }
    } catch (error) {
      return res.status(400).json({ error: `Cannot access directory: ${error.message}` });
    }

    console.log(`Processing folder: ${folderPath}`);
    console.log(`Additional filters: ${additionalFilters.join(', ')}`);

    // Set up filters
    const originalSkipTraversal = shouldSkipTraversal;
    const shouldSkipTraversalWithFilters = (filepath) => {
      if (originalSkipTraversal(filepath)) {
        return true;
      }

      const normalizedPath = filepath.replace(/\\/g, '/');
      return additionalFilters.some(pattern => {
        const regexPattern = pattern.includes('/') 
          ? pattern.replace(/\//g, '[/\\\\]') 
          : `(^|[/\\\\])${pattern}($|[/\\\\])`;
        
        return new RegExp(regexPattern).test(normalizedPath);
      });
    };

    let totalFiles = 0;
    let totalSize = 0;
    let fileTypes = {};
    let technologies = new Set();
    let ocrStats = {
      totalOCRFiles: 0,
      successfulOCR: 0,
      failedOCR: 0,
      averageConfidence: 0,
      totalTextExtracted: 0
    };

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    async function generateTree(dir, prefix = '') {
      let result = '';
      try {
        const items = await fs.readdir(dir);
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemPath = path.join(dir, item);
          
          try {
            const stats = await fs.stat(itemPath);
            
            if (shouldSkipTraversalWithFilters(itemPath)) continue;
            
            const isLast = i === items.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const newPrefix = isLast ? '    ' : '│   ';
            
            if (stats.isFile()) {
              const size = formatSize(stats.size);
              const isIncluded = !shouldSkipContent(itemPath);
              const isOCRFile = supportsOCR(itemPath);
              
              let indicator = ' ✗';
              if (isIncluded) {
                indicator = isOCRFile ? ' 📄' : ' ✓';  // Special indicator for OCR files
              }
              
              result += `${prefix}${connector}${item} (${size})${indicator}\n`;
            } else {
              result += `${prefix}${connector}${item}/\n`;
              result += await generateTree(itemPath, prefix + newPrefix);
            }
          } catch (error) {
            // Skip files/folders we can't access
            console.warn(`Skipping ${itemPath}: ${error.message}`);
            continue;
          }
        }
      } catch (error) {
        console.warn(`Cannot read directory ${dir}: ${error.message}`);
      }
      return result;
    }

    async function getAllFiles(dir) {
      const fileList = [];
      try {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          if (shouldSkipTraversalWithFilters(fullPath)) continue;
          
          try {
            const stats = await fs.stat(fullPath);
            
            if (stats.isDirectory()) {
              const subFiles = await getAllFiles(fullPath);
              fileList.push(...subFiles);
            } else {
              // Track all files in stats
              const ext = path.extname(fullPath).toLowerCase();
              fileTypes[ext] = (fileTypes[ext] || 0) + 1;
              
              // Enhanced technology detection
              if (['.ts', '.tsx'].includes(ext)) technologies.add('TypeScript');
              if (['.jsx', '.tsx'].includes(ext)) technologies.add('React');
              if (ext === '.vue') technologies.add('Vue.js');
              if (ext === '.py') technologies.add('Python');
              if (ext === '.php') technologies.add('PHP');
              if (ext === '.java') technologies.add('Java');
              if (ext === '.go') technologies.add('Go');
              if (ext === '.rs') technologies.add('Rust');
              if (ext === '.swift') technologies.add('Swift');
              if (['.rb'].includes(ext)) technologies.add('Ruby');
              if (['.c', '.cpp', '.cc', '.cxx'].includes(ext)) technologies.add('C/C++');
              if (['.cs'].includes(ext)) technologies.add('C#');
              if (['.html', '.htm'].includes(ext)) technologies.add('HTML');
              if (['.css', '.scss', '.sass', '.less'].includes(ext)) technologies.add('CSS');
              if (path.basename(fullPath) === 'package.json') technologies.add('Node.js');
              if (path.basename(fullPath) === 'requirements.txt') technologies.add('Python');
              if (path.basename(fullPath) === 'Gemfile') technologies.add('Ruby');
              if (path.basename(fullPath) === 'composer.json') technologies.add('PHP');
              
              // OCR file detection
              if (supportsOCR(fullPath)) {
                technologies.add('OCR Processing');
                ocrStats.totalOCRFiles++;
              }
              
              totalFiles++;
              totalSize += stats.size;
            
              if (!shouldSkipContent(fullPath)) {
                fileList.push({
                  path: fullPath,
                  size: stats.size,
                  extension: ext,
                  isOCRFile: supportsOCR(fullPath)
                });
              }
            }
          } catch (error) {
            console.warn(`Skipping ${fullPath}: ${error.message}`);
            continue;
          }
        }
      } catch (error) {
        console.warn(`Cannot read directory ${dir}: ${error.message}`);
      }
      return fileList;
    }

    // Process the folder
    console.log('Starting folder processing...');
    const files = await getAllFiles(folderPath);
    console.log(`Found ${files.length} files to process`);
    
    const treeStructure = await generateTree(folderPath);
    console.log('Generated directory tree');

    const date = new Date();
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear()}`;
    const timestamp = Math.floor(date.getTime() / 1000);
    
    const folderName = path.basename(folderPath);
    const outputFileName = outputName || `${folderName}_${dateStr}_${timestamp}.txt`;

    let output = 'Project Overview\n===============\n\n';
    output += `Project Statistics:\n`;
    output += `Total Files: ${totalFiles}\n`;
    output += `Total Size: ${formatSize(totalSize)}\n`;
    
    if (enableOCR && ocrStats.totalOCRFiles > 0) {
      output += `OCR-Processed Files: ${ocrStats.totalOCRFiles}\n`;
    }
    output += '\n';
    
    output += `File Types:\n`;
    Object.entries(fileTypes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([ext, count]) => {
        output += `  ${ext || 'no extension'}: ${count} files\n`;
      });
    
    output += `\nDetected Technologies:\n`;
    Array.from(technologies).sort().forEach(tech => {
      output += `  - ${tech}\n`;
    });
    
    output += '\nFolder Structure (Tree)\n=====================\n';
    output += 'Legend: ✓ = Text file, 📄 = OCR-processed file, ✗ = Excluded from output\n\n';
    output += treeStructure;
    output += '\n==============\n';
    
    let confidenceSum = 0;
    let ocrCount = 0;
    
    for (const file of files) {
      try {
        const relPath = path.relative(folderPath, file.path);
        
        if (file.isOCRFile && enableOCR && ocrService) {
          // Process with OCR
          console.log(`Performing OCR on: ${relPath}`);
          const ocrResult = await ocrService.extractText(file.path);
          const metadata = ocrService.getFileMetadata(file.path, ocrResult);
          
          if (ocrResult.confidence > 0) {
            ocrStats.successfulOCR++;
            confidenceSum += ocrResult.confidence;
            ocrCount++;
          } else {
            ocrStats.failedOCR++;
          }
          
          ocrStats.totalTextExtracted += ocrResult.text.length;
          
          output += `\nFile Name: ${relPath}\n`;
          output += `Size: ${formatSize(file.size)}\n`;
          output += `Processing Method: ${ocrResult.method}\n`;
          output += `OCR Confidence: ${ocrResult.confidence}%\n`;
          output += `Extracted Text Length: ${ocrResult.text.length} characters\n`;
          output += `Word Count: ${metadata.wordCount} words\n`;
          
          if (metadata.pages) {
            output += `Total Pages: ${metadata.pages}\n`;
          }
          if (metadata.processedPages) {
            output += `Processed Pages: ${metadata.processedPages}\n`;
          }
          
          output += 'Extracted Content:\n';
          output += ocrResult.text || '[No text extracted]';
          output += '\n-------- [ Separator ] ------\n';
          
        } else {
          // Process as regular text file
          const content = await fs.readFile(file.path, 'utf8');
          
          output += `\nFile Name: ${relPath}\n`;
          output += `Size: ${formatSize(file.size)}\n`;
          output += 'Code:\n';
          output += content;
          output += '\n-------- [ Separator ] ------\n';
        }
      } catch (error) {
        console.error(`Error reading file ${file.path}:`, error.message);
      }
    }
    
    // Add OCR statistics to output
    if (enableOCR && ocrStats.totalOCRFiles > 0) {
      ocrStats.averageConfidence = ocrCount > 0 ? Math.round(confidenceSum / ocrCount) : 0;
      
      output += '\n\nOCR Processing Summary\n=====================\n';
      output += `Total OCR Files: ${ocrStats.totalOCRFiles}\n`;
      output += `Successfully Processed: ${ocrStats.successfulOCR}\n`;
      output += `Failed Processing: ${ocrStats.failedOCR}\n`;
      output += `Average Confidence: ${ocrStats.averageConfidence}%\n`;
      output += `Total Text Extracted: ${formatSize(ocrStats.totalTextExtracted)} characters\n`;
    }

    // Write the output file
    await fs.writeFile(outputFileName, output);

    res.json({
      success: true,
      outputFileName,
      totalFiles: files.length,
      totalSize: formatSize(totalSize),
      ocrStats: enableOCR ? ocrStats : null,
      message: `Successfully processed ${files.length} files${enableOCR && ocrStats.totalOCRFiles > 0 ? ` (including ${ocrStats.totalOCRFiles} OCR files)` : ''}`
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API to download generated file
app.get('/api/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    res.download(filePath, filename);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to find an available port
async function findAvailablePort(startPort) {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', () => {
      // Port is busy, try next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Start server with error handling and port detection
async function startServer() {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    const server = app.listen(availablePort, () => {
      console.log(`🚀 folder2text Web GUI running at http://localhost:${availablePort}`);
      console.log(`📁 Open your browser and navigate to the URL above`);
      if (availablePort !== PORT) {
        console.log(`ℹ️  Note: Default port ${PORT} was busy, using port ${availablePort} instead`);
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${availablePort} is already in use`);
        console.log(`🔄 Trying to find another available port...`);
        // Try again with a different port
        setTimeout(() => startServer(), 1000);
      } else {
        console.error('❌ Server error:', error.message);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        if (ocrService) {
          ocrService.terminateWorker().then(() => {
            console.log('✅ OCR service cleaned up');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      server.close(() => {
        if (ocrService) {
          ocrService.terminateWorker().then(() => {
            console.log('✅ OCR service cleaned up');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
