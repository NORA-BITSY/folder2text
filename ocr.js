const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const pdf2pic = require('pdf2pic');
const Jimp = require('jimp');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class OCRService {
  constructor() {
    this.tesseractWorker = null;
    this.isInitializing = false;
    this.initializeWorker();
  }

  async initializeWorker() {
    if (this.isInitializing) {
      return; // Prevent multiple initialization attempts
    }
    
    this.isInitializing = true;
    try {
      this.tesseractWorker = await Tesseract.createWorker();
      await this.tesseractWorker.loadLanguage('eng');
      await this.tesseractWorker.initialize('eng');
      console.log('OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error.message);
      this.tesseractWorker = null;
    } finally {
      this.isInitializing = false;
    }
  }

  async terminateWorker() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }

  // Check if file is an image that can be processed
  isImage(filePath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    const ext = path.extname(filePath).toLowerCase();
    return imageExtensions.includes(ext);
  }

  // Check if file is a PDF
  isPDF(filePath) {
    return path.extname(filePath).toLowerCase() === '.pdf';
  }

  // Check if file supports OCR processing
  supportsOCR(filePath) {
    return this.isImage(filePath) || this.isPDF(filePath);
  }

  // Preprocess image for better OCR accuracy
  async preprocessImage(imagePath) {
    try {
      const image = await Jimp.read(imagePath);
      
      // Apply preprocessing: convert to grayscale, increase contrast, normalize
      image
        .greyscale()
        .contrast(0.3)
        .normalize();

      // Save processed image to temp location
      const tempPath = path.join(path.dirname(imagePath), 'temp_' + path.basename(imagePath));
      await image.writeAsync(tempPath);
      
      return tempPath;
    } catch (error) {
      console.warn(`Image preprocessing failed for ${imagePath}:`, error.message);
      return imagePath; // Return original if preprocessing fails
    }
  }

  // Extract text from image using OCR
  async extractTextFromImage(imagePath) {
    if (!this.tesseractWorker) {
      console.warn('OCR worker not available, attempting to reinitialize...');
      await this.initializeWorker();
      if (!this.tesseractWorker) {
        throw new Error('OCR worker initialization failed');
      }
    }

    try {
      console.log(`Processing image: ${path.basename(imagePath)}`);
      
      // Preprocess image for better accuracy
      const processedImagePath = await this.preprocessImage(imagePath);
      
      // Perform OCR
      const { data: { text, confidence } } = await this.tesseractWorker.recognize(processedImagePath);
      
      // Clean up temp file if it was created
      if (processedImagePath !== imagePath) {
        try {
          await fs.unlink(processedImagePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      return {
        text: text.trim(),
        confidence: Math.round(confidence || 0),
        method: 'OCR (Tesseract)',
        metadata: {
          originalFile: path.basename(imagePath),
          processingTime: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`OCR failed for ${imagePath}:`, error.message);
      return {
        text: `[OCR Error: ${error.message}]`,
        confidence: 0,
        method: 'OCR (Failed)',
        metadata: {
          originalFile: path.basename(imagePath),
          error: error.message
        }
      };
    }
  }

  // Extract text from PDF (try text extraction first, then OCR if needed)
  async extractTextFromPDF(pdfPath) {
    try {
      console.log(`Processing PDF: ${path.basename(pdfPath)}`);
      
      // First, try to extract text directly from PDF
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      
      if (pdfData.text && pdfData.text.trim().length > 50) {
        // PDF has extractable text
        return {
          text: pdfData.text.trim(),
          confidence: 100,
          method: 'PDF Text Extraction',
          metadata: {
            originalFile: path.basename(pdfPath),
            pages: pdfData.numpages,
            extractedDirectly: true,
            processingTime: new Date().toISOString()
          }
        };
      } else {
        // PDF appears to be scanned, use OCR
        return await this.extractTextFromScannedPDF(pdfPath);
      }
    } catch (error) {
      console.error(`PDF processing failed for ${pdfPath}:`, error.message);
      return {
        text: `[PDF Processing Error: ${error.message}]`,
        confidence: 0,
        method: 'PDF Processing (Failed)',
        metadata: {
          originalFile: path.basename(pdfPath),
          error: error.message
        }
      };
    }
  }

  // Extract text from scanned PDF using OCR
  async extractTextFromScannedPDF(pdfPath) {
    try {
      console.log(`Performing OCR on scanned PDF: ${path.basename(pdfPath)}`);
      
      // Convert PDF pages to images
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 300,           // Higher DPI for better OCR
        saveFilename: "page",
        savePath: path.dirname(pdfPath),
        format: "png",
        width: 2480,           // High resolution
        height: 3508
      });

      // Get total pages
      const dataBuffer = await fs.readFile(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      const totalPages = pdfData.numpages;

      let allText = '';
      let totalConfidence = 0;
      const processedPages = [];

      // Process each page
      for (let pageNum = 1; pageNum <= Math.min(totalPages, 20); pageNum++) { // Limit to 20 pages for performance
        try {
          const result = await convert(pageNum);
          const imagePath = result.path;
          
          // Perform OCR on the page image
          const ocrResult = await this.extractTextFromImage(imagePath);
          
          if (ocrResult.text && ocrResult.text.length > 10) {
            allText += `\n--- Page ${pageNum} ---\n${ocrResult.text}\n`;
            totalConfidence += ocrResult.confidence;
            processedPages.push(pageNum);
          }

          // Clean up page image
          try {
            await fs.unlink(imagePath);
          } catch (e) {
            // Ignore cleanup errors
          }
          
        } catch (pageError) {
          console.warn(`Failed to process page ${pageNum}: ${pageError.message}`);
        }
      }

      const averageConfidence = processedPages.length > 0 
        ? Math.round(totalConfidence / processedPages.length) 
        : 0;

      return {
        text: allText.trim(),
        confidence: averageConfidence,
        method: 'PDF OCR (Tesseract)',
        metadata: {
          originalFile: path.basename(pdfPath),
          totalPages: totalPages,
          processedPages: processedPages.length,
          pagesProcessed: processedPages,
          processingTime: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`PDF OCR failed for ${pdfPath}:`, error.message);
      return {
        text: `[PDF OCR Error: ${error.message}]`,
        confidence: 0,
        method: 'PDF OCR (Failed)',
        metadata: {
          originalFile: path.basename(pdfPath),
          error: error.message
        }
      };
    }
  }

  // Main method to extract text from any supported file
  async extractText(filePath) {
    if (!this.supportsOCR(filePath)) {
      throw new Error('File type not supported for OCR');
    }

    if (this.isImage(filePath)) {
      return await this.extractTextFromImage(filePath);
    } else if (this.isPDF(filePath)) {
      return await this.extractTextFromPDF(filePath);
    }

    throw new Error('Unknown file type');
  }

  // Get enhanced metadata for OCR-processed files
  getFileMetadata(filePath, ocrResult) {
    try {
      const stats = require('fs').statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        fileName: path.basename(filePath),
        filePath: filePath,
        fileSize: stats.size,
        fileType: ext,
        lastModified: stats.mtime,
        ocrMethod: ocrResult.method,
        ocrConfidence: ocrResult.confidence,
        textLength: ocrResult.text.length,
        wordCount: ocrResult.text.split(/\s+/).filter(word => word.length > 0).length,
        ...ocrResult.metadata
      };
    } catch (error) {
      console.error(`Failed to get file metadata for ${filePath}:`, error.message);
      return {
        fileName: path.basename(filePath),
        filePath: filePath,
        fileSize: 0,
        fileType: path.extname(filePath).toLowerCase(),
        lastModified: new Date(),
        ocrMethod: ocrResult.method,
        ocrConfidence: ocrResult.confidence,
        textLength: ocrResult.text.length,
        wordCount: ocrResult.text.split(/\s+/).filter(word => word.length > 0).length,
        error: error.message,
        ...ocrResult.metadata
      };
    }
  }
}
module.exports = OCRService;
