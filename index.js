const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const { shouldSkipTraversal, shouldSkipContent, supportsOCR } = require('./ignore');
const OCRService = require('./ocr');

program
  .argument('<folderPath>', 'Path to the target folder')
  .argument('[outputName]', 'Output file name (optional)')
  .option('-f, --filter <patterns>', 'Additional patterns to filter (separated by commas)')
  .option('--no-ocr', 'Disable OCR processing for images and PDFs')
  .parse();

const [folderPath] = program.args;
const options = program.opts();
const additionalFilters = options.filter ? options.filter.split(',').map(p => p.trim()) : [];
const enableOCR = options.ocr !== false; // OCR enabled by default

let ocrService = null;

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

async function generateTree(dir, prefix = '', includedFiles = new Set()) {
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
          result += await generateTree(itemPath, prefix + newPrefix, includedFiles);
        }
      } catch (error) {
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
          // Track all files in stats, regardless of content inclusion
          const ext = path.extname(fullPath).toLowerCase();
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          
          // Technology detection (enhanced with OCR file recognition)
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

async function main() {
  try {
    console.log('Starting to process directory:', folderPath);
    
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      throw new Error('Provided path is not a directory');
    }

    // Initialize OCR service if enabled
    if (enableOCR) {
      console.log('Initializing OCR service...');
      ocrService = new OCRService();
    }

    const date = new Date();
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear()}`;
    const timestamp = Math.floor(date.getTime() / 1000);
    
    const folderName = path.basename(folderPath);
    const outputFileName = program.args[1] || `${folderName}_${dateStr}_${timestamp}.txt`;
    
    console.log('Collecting files...');
    const files = await getAllFiles(folderPath);
    const includedFiles = new Set(files.map(f => f.path));
    
    console.log('Generating tree structure...');
    const treeStructure = await generateTree(folderPath, '', includedFiles);
    
    console.log(`Found ${files.length} files`);
    if (enableOCR && ocrStats.totalOCRFiles > 0) {
      console.log(`Found ${ocrStats.totalOCRFiles} files that support OCR processing`);
    }
    
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
    
    console.log('Processing individual files...');
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
    
    console.log('Writing output file...');
    await fs.writeFile(outputFileName, output);
    console.log(`Output written to ${outputFileName}`);
    console.log(`Total files processed: ${files.length}`);
    console.log(`Total size: ${formatSize(totalSize)}`);
    
    if (enableOCR && ocrStats.totalOCRFiles > 0) {
      console.log(`OCR files processed: ${ocrStats.successfulOCR}/${ocrStats.totalOCRFiles}`);
      console.log(`Average OCR confidence: ${ocrStats.averageConfidence}%`);
    }
    
    // Clean up OCR service
    if (ocrService) {
      await ocrService.terminateWorker();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Clean up OCR service on error
    if (ocrService) {
      await ocrService.terminateWorker();
    }
    
    process.exit(1);
  }
}

main();