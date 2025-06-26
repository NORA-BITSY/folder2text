# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

folder2text is a CLI tool and web application that converts entire project directories into organized text files, with OCR capabilities for extracting text from images and PDFs.

## Key Commands

```bash
# Run tests
npm test

# Start web server (port 3000)
npm start

# Run CLI
node index.js <folder-path>
node index.js <folder-path> --output custom-name.txt
node index.js <folder-path> --ocr  # Enable OCR processing

# Install globally
npm install -g folder2text
```

## Architecture

The project has a modular architecture with clear separation of concerns:

- **index.js**: Core CLI logic - file traversal, statistics generation, tree building, and output formatting
- **server.js**: Express web server providing REST API for the web GUI
- **ocr.js**: OCR service class handling text extraction from images/PDFs using Tesseract.js
- **ignore.js**: Filtering logic for excluded directories and files
- **public/index.html**: Self-contained web GUI with inline CSS/JS

## Development Guidelines

1. **OCR Integration**: When modifying OCR functionality, test with both images and PDFs. The OCR service preprocesses images for better accuracy.

2. **File Filtering**: Exclusion rules are centralized in ignore.js. Common exclusions include node_modules, .git, build directories, and binary files.

3. **API Endpoints**: The web server exposes:
   - `/api/browse`: Directory listing
   - `/api/process`: Folder processing
   - `/api/download/:filename`: File download

4. **Error Handling**: Both CLI and web interfaces provide user-friendly error messages. OCR errors are logged but don't stop processing.

5. **Testing**: test.js contains comprehensive tests covering CLI functionality, file filtering, OCR processing, and edge cases.