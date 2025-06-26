# folder2text 🗂️➡️📝

> **Transform entire project directories into organized, searchable text documents with advanced OCR and multimedia processing capabilities.**

[![NPM Version](https://img.shields.io/npm/v/folder2text.svg)](https://www.npmjs.com/package/folder2text)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

## 🚀 What is folder2text?

`folder2text` is a powerful, intelligent directory-to-text conversion tool that goes beyond simple file concatenation. It transforms your entire project structure into a comprehensive, well-organized text document perfect for documentation, AI context sharing, code analysis, and digital archiving.

### 🎯 Why folder2text?

- **🤖 AI-Ready**: Perfect for sharing complete project context with AI/LLM systems
- **📚 Documentation**: Generate comprehensive project documentation automatically
- **🔍 Analysis**: Enable full-text search across your entire project, including images and PDFs
- **📦 Archival**: Create searchable text archives of complex projects with multimedia content
- **👥 Collaboration**: Share complete project overviews with team members
- **🔄 Migration**: Prepare legacy projects for modern analysis and processing

## ✨ Key Features

### 📊 **Comprehensive Project Analysis**
- **File Statistics**: Detailed breakdown of file types, sizes, and counts
- **Technology Detection**: Automatic identification of frameworks, languages, and tools
- **Project Metrics**: Total size, file distribution, and complexity analysis
- **Performance Insights**: Processing time, success rates, and confidence scores

### 🖼️ **Advanced OCR & Document Processing**
- **Image OCR**: Extract text from PNG, JPG, GIF, BMP, and TIFF images
- **PDF Processing**: Direct text extraction from text-based PDFs
- **Scanned Document OCR**: Advanced OCR for scanned PDFs and image documents
- **Multi-format Support**: Handles complex document layouts and mixed content
- **Confidence Scoring**: Quality metrics for OCR accuracy assessment

### 🧠 **Intelligent Content Handling**
- **Smart Filtering**: Automatically skips binary files, system files, and common excludes
- **Content Detection**: Identifies text-based files vs. binary files intelligently
- **Encoding Support**: Handles various text encodings and special characters
- **Structure Preservation**: Maintains original formatting and hierarchy

### 🎛️ **Flexible Processing Options**
- **CLI Interface**: Command-line tool for scripts and automation
- **Web GUI**: Beautiful browser-based interface with real-time feedback
- **Custom Filtering**: Include/exclude specific paths, files, or patterns
- **OCR Toggle**: Enable/disable OCR processing as needed
- **Output Customization**: Configurable output formats and file naming

### 🔧 **Developer-Friendly**
- **Modern JavaScript**: Built with ES6+ and async/await patterns
- **Error Handling**: Robust error recovery and detailed logging
- **Extensible**: Modular architecture for easy customization
- **Performance**: Optimized for large projects and heavy multimedia content

## 📦 Installation

### Quick Install (Recommended)

```bash
npm install -g folder2text
```

### System Dependencies

The OCR functionality uses **Tesseract.js** which works out-of-the-box, but for optimal performance, you may want to install native Tesseract:

#### macOS
```bash
brew install tesseract
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

#### Windows
1. Download from [Tesseract GitHub Releases](https://github.com/tesseract-ocr/tesseract/releases)
2. Install and add to PATH
3. Or use Windows Package Manager:
```bash
winget install UB-Mannheim.TesseractOCR
```

### Development Setup

```bash
# Clone repository
git clone https://github.com/oritromax/folder2text.git
cd folder2text

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run web
```

## 🎮 Usage Guide

### 🖥️ Command Line Interface

#### Basic Usage
```bash
# Process current directory
folder2text .

# Process specific directory
folder2text /path/to/project

# Process with custom output file
folder2text /path/to/project my-project-analysis.txt
```

#### Advanced Options
```bash
# Disable OCR processing
folder2text /path/to/project --no-ocr

# Custom filtering
folder2text /path/to/project --filter "node_modules,dist,build"

# Complex filtering with paths
folder2text /path/to/project --filter "src/tests,docs/temp,*.log"

# Complete example
folder2text ~/my-project project-export.txt --filter "tests,temp" --no-ocr
```

### 🌐 Web Interface

#### Starting the Server
```bash
# Start with default settings
npm run web

# Or directly
node server.js
```

#### Using the Web Interface
1. Open `http://localhost:3000` in your browser
2. **Browse**: Navigate to your project directory
3. **Configure**: Set output filename and filters
4. **Toggle OCR**: Enable/disable OCR processing
5. **Process**: Click "Convert to Text" and watch real-time progress
6. **Download**: Get your generated text file instantly

#### Web Interface Features
- 📁 **Visual Directory Browser**: Click through directories with ease
- ⚙️ **Real-time Configuration**: See settings update immediately
- 📊 **Live Progress**: Watch processing statistics in real-time
- 🖼️ **OCR Preview**: See which files will be OCR processed
- 📄 **Instant Download**: Get results without leaving the browser
- 🎨 **Modern UI**: Clean, responsive design that works on all devices

## 📄 Output Format

The generated text file includes comprehensive sections:

### Project Overview
```text
Project Overview
===============
📊 Project Statistics:
   Total Files: 127
   Total Size: 15.3 MB
   Text Files: 89
   OCR-Processed Files: 12
   Processing Time: 2.4 seconds

📋 File Type Distribution:
   .js: 45 files (2.1 MB)
   .json: 8 files (156 KB)
   .md: 6 files (89 KB)
   .pdf: 4 files (8.2 MB)
   .png: 8 files (4.8 MB)
   ...

🔍 Detected Technologies:
   - Node.js/JavaScript
   - React Framework
   - Express.js
   - PDF Processing
   - Image Processing
   - OCR Integration
```

### Directory Structure
```text
Folder Structure (Tree)
======================
📁 my-project/
├── 📁 src/
│   ├── 📄 index.js (2.3 KB)
│   ├── 📄 server.js (5.1 KB)
│   └── 📁 components/
│       ├── 📄 Header.jsx (1.8 KB)
│       └── 📄 Footer.jsx (1.2 KB)
├── 📁 docs/
│   ├── 📄 README.md (15.2 KB)
│   ├── 📄 manual.pdf (2.1 MB) [OCR: 89% confidence]
│   └── 📄 screenshot.png (1.5 MB) [OCR: 92% confidence]
└── 📄 package.json (1.1 KB)
```

### OCR Processing Summary
```text
OCR Processing Summary
=====================
📊 Statistics:
   Total OCR Files: 12
   Successfully Processed: 11
   Failed Processing: 1
   Average Confidence: 87.3%
   Total Text Extracted: 23,847 characters

📋 Processing Details:
   Images: 8 files (avg confidence: 91.2%)
   PDFs: 4 files (avg confidence: 83.4%)
   Failed: temp_scan.jpg (corrupted file)
```

### File Contents
```text
Files Content
=============

=====================================
📄 FILE: src/index.js
=====================================
Type: JavaScript
Size: 2.3 KB
Modified: 2024-01-15 10:30:22

const express = require('express');
const app = express();
// ... (complete file content)

=====================================
📄 FILE: docs/manual.pdf [OCR]
=====================================
Type: PDF Document
Size: 2.1 MB
OCR Confidence: 89%
Text Length: 5,247 characters
Processing Method: OCR + Direct extraction

Getting Started Guide
===================
This manual provides comprehensive instructions...
// ... (extracted text content)
```

## 🎯 Use Cases & Benefits

### 🤖 **AI & Machine Learning**
- **LLM Context**: Provide complete project context to AI assistants
- **Code Analysis**: Enable AI to understand entire codebases including documentation
- **Training Data**: Prepare structured datasets from project repositories
- **Documentation AI**: Generate project documentation using AI with full context

### 📚 **Documentation & Analysis**
- **Project Documentation**: Auto-generate comprehensive project overviews
- **Code Reviews**: Provide reviewers with complete project context
- **Legacy Migration**: Analyze and document legacy systems before migration
- **Compliance Audits**: Create searchable archives for regulatory compliance

### 🏢 **Enterprise & Teams**
- **Knowledge Management**: Convert project knowledge into searchable formats
- **Onboarding**: Help new team members understand large codebases quickly
- **Project Handoffs**: Ensure complete knowledge transfer between teams
- **Digital Transformation**: Convert paper documents and mixed media projects

### 🔍 **Research & Development**
- **Academic Research**: Analyze large software projects for research purposes
- **Pattern Recognition**: Identify common patterns across multiple projects
- **Benchmarking**: Compare project structures and implementations
- **Open Source Analysis**: Study open source projects systematically

## ⚙️ Configuration Options

### CLI Arguments
```bash
folder2text [directory] [output] [options]

Arguments:
  directory     Source directory to process (default: current directory)
  output        Output filename (default: folder-content.txt)

Options:
  --no-ocr      Disable OCR processing
  --filter      Comma-separated list of paths/patterns to exclude
  --help        Show help information
  --version     Show version number
```

### Environment Variables
```bash
# Disable OCR globally
export FOLDER2TEXT_NO_OCR=true

# Set default output directory
export FOLDER2TEXT_OUTPUT_DIR=/path/to/outputs

# Custom port for web interface
export PORT=8080
```

### Custom Ignore Patterns

Create a `.folder2textignore` file in your project root:
```
# Binary directories
node_modules/
dist/
build/
.git/

# Log files
*.log
logs/

# Temporary files
temp/
tmp/
*.tmp

# Large media files
*.mp4
*.avi
*.mov
```

## 🔧 Advanced Features

### 🧩 **Extensibility**
The application is built with a modular architecture allowing easy customization:

- **Custom OCR Engines**: Integrate different OCR providers
- **Additional File Types**: Add support for new file formats
- **Output Formats**: Generate different output formats (JSON, XML, etc.)
- **Processing Hooks**: Add custom processing steps

### 🔍 **Debugging & Troubleshooting**

#### Enable Debug Mode
```bash
# CLI with debug output
DEBUG=folder2text* folder2text /path/to/project

# Or set environment variable
export DEBUG=folder2text*
```

#### Common Issues & Solutions

**OCR Processing Fails**
```bash
# Check Tesseract installation
tesseract --version

# Reinstall tesseract.js
npm uninstall tesseract.js
npm install tesseract.js
```

**Large File Processing**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 index.js /path/to/large/project
```

**Permission Errors**
```bash
# Check file permissions
ls -la /path/to/project

# Fix permissions if needed
chmod -R 755 /path/to/project
```

### 📊 **Performance Optimization**

#### For Large Projects
```bash
# Disable OCR for speed
folder2text /large/project --no-ocr

# Use specific filtering
folder2text /large/project --filter "node_modules,dist,build,*.log"

# Process in chunks (for custom implementations)
folder2text /large/project --max-files 1000
```

#### Memory Management
```bash
# Monitor memory usage
node --inspect index.js /path/to/project

# Limit concurrent OCR processing
export FOLDER2TEXT_OCR_CONCURRENCY=2
```

## 🧪 Testing & Quality Assurance

### Running Tests
```bash
# Run all tests
npm test

# Run with verbose output
npm test -- --verbose

# Test specific functionality
node test.js --test-ocr
node test.js --test-ignore
```

### Test Coverage
The test suite covers:
- ✅ **Dependency Validation**: Ensures all required packages are installed
- ✅ **Module Loading**: Verifies all modules load correctly
- ✅ **Ignore Logic**: Tests file filtering and exclusion rules
- ✅ **File Operations**: Validates file reading and processing
- ✅ **OCR Functionality**: Tests OCR processing for various file types
- ✅ **Server Endpoints**: Validates web interface functionality
- ✅ **Error Handling**: Tests error recovery and reporting

### Manual Testing Checklist
- [ ] CLI processes directories correctly
- [ ] Web interface loads and functions
- [ ] OCR extracts text from sample images
- [ ] PDF processing works for both text and scanned PDFs
- [ ] Filtering excludes specified patterns
- [ ] Output file is generated with correct format
- [ ] Error handling works for corrupted files

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 📋 **Setup Development Environment**
```bash
# Fork and clone the repository
git clone https://github.com/your-username/folder2text.git
cd folder2text

# Install dependencies
npm install

# Run tests to ensure everything works
npm test

# Start development server
npm run web
```

### 🔧 **Development Guidelines**
- **Code Style**: Follow existing patterns and use ESLint
- **Testing**: Add tests for new features
- **Documentation**: Update README and code comments
- **Commits**: Use clear, descriptive commit messages

### 🐛 **Reporting Issues**
When reporting bugs, please include:
- Operating system and Node.js version
- Command used and expected vs. actual behavior
- Sample files or directories (if applicable)
- Complete error messages and stack traces

### 💡 **Feature Requests**
We're always looking for ways to improve! Consider contributing:
- New file format support
- Additional OCR engines
- Performance optimizations
- UI/UX improvements
- Documentation enhancements

### 📝 **Pull Request Process**
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes and add tests
3. Run the test suite: `npm test`
4. Update documentation as needed
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request with a clear description

## 🆘 Troubleshooting & FAQ

### ❓ **Frequently Asked Questions**

**Q: Why is OCR processing slow?**
A: OCR processing is computationally intensive. For faster processing, consider:
- Using `--no-ocr` flag for non-OCR content
- Installing native Tesseract for better performance
- Processing smaller batches of files

**Q: Can I process password-protected PDFs?**
A: Currently, password-protected PDFs are not supported. Please decrypt PDFs before processing or submit a feature request.

**Q: What image formats are supported for OCR?**
A: Supported formats include: PNG, JPG/JPEG, GIF, BMP, TIFF, and WebP.

**Q: How do I exclude specific file types?**
A: Use the `--filter` option: `folder2text . --filter "*.pdf,*.png,temp/"`

**Q: Can I run this on a server/headless environment?**
A: Yes! The CLI works perfectly in headless environments. OCR processing uses CPU-only rendering.

### 🔍 **Common Error Messages**

**"ENOENT: no such file or directory"**
- Check that the specified path exists
- Ensure you have read permissions for the directory

**"OCR processing failed"**
- Verify the image file isn't corrupted
- Check available memory (OCR requires significant RAM)
- Try processing individual files to isolate issues

**"Port already in use"**
- Another process is using port 3000
- Use a different port: `PORT=8080 npm run web`
- Or stop the conflicting process

**"Maximum call stack size exceeded"**
- Usually caused by circular symbolic links
- Use filtering to exclude problematic directories
- Check for recursive directory structures

### 🛠️ **Advanced Troubleshooting**

#### Enable Debug Logging
```bash
# Comprehensive debug output
DEBUG=folder2text:* folder2text /path/to/project

# OCR-specific debugging
DEBUG=folder2text:ocr folder2text /path/to/project

# Web server debugging
DEBUG=folder2text:server npm run web
```

#### Check System Resources
```bash
# Monitor memory usage during processing
top -p $(pgrep -f "node.*folder2text")

# Check disk space
df -h

# Verify Node.js version compatibility
node --version  # Should be >= 14.0.0
```

#### Performance Profiling
```bash
# Profile memory usage
node --prof index.js /path/to/project

# Analyze profile
node --prof-process isolate-*-v8.log > profile.txt
```

## 📚 API Reference

### 🔧 **Core Modules**

#### `OCRService`
```javascript
const { OCRService } = require('./ocr');

// Initialize OCR service
const ocrService = new OCRService();
await ocrService.initialize();

// Process an image
const result = await ocrService.processImage('/path/to/image.png');
console.log(result.text, result.confidence);

// Process a PDF
const pdfResult = await ocrService.processPDF('/path/to/document.pdf');
console.log(pdfResult.text, pdfResult.method);
```

#### `IgnoreService`
```javascript
const { shouldSkipFile, shouldSkipContent } = require('./ignore');

// Check if file should be skipped
const skip = shouldSkipFile('/path/to/file.log');

// Check if content should be extracted
const extractContent = shouldSkipContent('/path/to/binary.exe');
```

### 🌐 **Web API Endpoints**

#### `GET /api/browse`
Browse directory contents
```javascript
// Request
GET /api/browse?path=/path/to/directory

// Response
{
  "success": true,
  "contents": [
    {
      "name": "src",
      "type": "directory",
      "path": "/path/to/directory/src"
    },
    {
      "name": "README.md",
      "type": "file",
      "path": "/path/to/directory/README.md",
      "size": 1024
    }
  ]
}
```

#### `POST /api/convert`
Convert directory to text
```javascript
// Request
POST /api/convert
{
  "folderPath": "/path/to/project",
  "outputFileName": "output.txt",
  "filters": ["node_modules", "dist"],
  "enableOcr": true
}

// Response
{
  "success": true,
  "message": "Conversion completed",
  "filePath": "/path/to/output.txt",
  "stats": {
    "totalFiles": 127,
    "ocrFiles": 12,
    "processingTime": 2.4
  }
}
```

## 📈 Roadmap & Future Features

### 🎯 **Short-term Goals (Next Release)**
- [ ] **Batch Processing**: Process multiple directories simultaneously
- [ ] **Cloud OCR**: Integration with Google Cloud Vision, AWS Textract
- [ ] **Format Options**: Export to JSON, XML, and structured formats
- [ ] **Progress Callbacks**: Real-time progress updates for large projects
- [ ] **Resume Processing**: Ability to resume interrupted processing

### 🚀 **Medium-term Goals**
- [ ] **Language Detection**: Automatic language detection for OCR
- [ ] **Table Extraction**: Advanced table recognition from PDFs and images
- [ ] **Collaborative Features**: Share and collaborate on processed documents
- [ ] **Plugin System**: Allow third-party extensions and custom processors
- [ ] **Database Integration**: Direct export to databases and search engines

### 🌟 **Long-term Vision**
- [ ] **AI Integration**: Built-in AI analysis and summarization
- [ ] **Real-time Processing**: Live folder monitoring and processing
- [ ] **Enterprise Features**: SSO, audit trails, and enterprise security
- [ ] **Mobile App**: Mobile interface for on-the-go processing
- [ ] **Cloud Service**: Hosted version with API access

## 📄 License & Legal

This project is licensed under **MIT License with Commons Clause**:

### ✅ **Permitted Uses**
- ✅ Personal and educational use
- ✅ Open source project integration
- ✅ Modification and customization
- ✅ Distribution with attribution
- ✅ Internal business use (non-commercial)

### ❌ **Restrictions**
- ❌ Commercial distribution or sale
- ❌ Hosting as a paid service
- ❌ Integration into commercial products without permission
- ❌ Removal of attribution or license notices

### 📞 **Commercial Licensing**
For commercial use, enterprise licensing, or custom development:
- Contact: [contact information]
- Enterprise features available
- Custom development and support options
- Volume licensing discounts

## 👨‍💻 About the Author

**Nidal Siddique Oritro** - *Creator and Maintainer*

I'm a passionate developer focused on creating tools that bridge traditional development workflows with modern AI capabilities. I believe in building software that makes developers' lives easier and more productive.

### 🌐 **Connect with Me**
- **Website**: [iam.ioritro.com](https://iam.ioritro.com)
- **GitHub**: [@oritromax](https://github.com/oritromax)
- **LinkedIn**: [Connect on LinkedIn](https://linkedin.com/in/oritromax)
- **Twitter**: [@oritromax](https://twitter.com/oritromax)

### 🚀 **Other Projects**
Check out my other developer tools and utilities:
- **Project A**: Brief description
- **Project B**: Brief description
- **Project C**: Brief description

## 🙏 Acknowledgments

Special thanks to:
- **Tesseract.js Team**: For excellent OCR capabilities
- **Node.js Community**: For robust ecosystem and tools
- **Contributors**: Everyone who has contributed code, bug reports, and feedback
- **Users**: The community that makes this project valuable

### 🛠️ **Built With**
- [Node.js](https://nodejs.org/) - Runtime environment
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR processing
- [Express.js](https://expressjs.com/) - Web framework
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [PDF-Parse](https://www.npmjs.com/package/pdf-parse) - PDF text extraction
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework

---

<div align="center">

**Made with ❤️ by developers, for developers**

[⭐ Star this repo](https://github.com/oritromax/folder2text) • [🐛 Report Bug](https://github.com/oritromax/folder2text/issues) • [💡 Request Feature](https://github.com/oritromax/folder2text/issues) • [📖 Documentation](https://github.com/oritromax/folder2text/wiki)

</div>
