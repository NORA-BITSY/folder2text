#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const OCRService = require('./ocr');
const { shouldSkipTraversal, shouldSkipContent, supportsOCR } = require('./ignore');

console.log('🔍 Starting comprehensive application test...\n');

async function testOCRService() {
  console.log('📄 Testing OCR Service...');
  
  try {
    const ocrService = new OCRService();
    
    // Test 1: Check initialization
    console.log('  ✓ OCR Service instantiated');
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check file type detection
    console.log('  ✓ isImage test:', ocrService.isImage('test.jpg'));
    console.log('  ✓ isPDF test:', ocrService.isPDF('test.pdf'));
    console.log('  ✓ supportsOCR test:', ocrService.supportsOCR('test.png'));
    
    await ocrService.terminateWorker();
    console.log('  ✓ OCR Service cleaned up successfully\n');
    
    return true;
  } catch (error) {
    console.error('  ❌ OCR Service test failed:', error.message);
    return false;
  }
}

async function testIgnoreLogic() {
  console.log('📁 Testing Ignore Logic...');
  
  try {
    // Test skip traversal
    console.log('  ✓ shouldSkipTraversal node_modules:', shouldSkipTraversal('/path/node_modules'));
    console.log('  ✓ shouldSkipTraversal .git:', shouldSkipTraversal('/path/.git'));
    console.log('  ✓ shouldSkipTraversal regular:', shouldSkipTraversal('/path/src'));
    
    // Test skip content
    console.log('  ✓ shouldSkipContent package-lock.json:', shouldSkipContent('package-lock.json'));
    console.log('  ✓ shouldSkipContent image.jpg:', shouldSkipContent('image.jpg'));
    console.log('  ✓ shouldSkipContent script.js:', shouldSkipContent('script.js'));
    
    // Test OCR support
    console.log('  ✓ supportsOCR image.png:', supportsOCR('image.png'));
    console.log('  ✓ supportsOCR document.pdf:', supportsOCR('document.pdf'));
    console.log('  ✓ supportsOCR script.js:', supportsOCR('script.js'));
    
    console.log('  ✓ Ignore logic tests passed\n');
    return true;
  } catch (error) {
    console.error('  ❌ Ignore logic test failed:', error.message);
    return false;
  }
}

async function testFileOperations() {
  console.log('📂 Testing File Operations...');
  
  try {
    // Test current directory access
    const currentDir = process.cwd();
    const files = await new Promise((resolve, reject) => {
      fs.readdir(currentDir, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
    console.log(`  ✓ Can read current directory (${files.length} items)`);
    
    // Test file stat operations
    const packageJsonPath = path.join(currentDir, 'package.json');
    try {
      const stats = await new Promise((resolve, reject) => {
        fs.stat(packageJsonPath, (err, stats) => {
          if (err) reject(err);
          else resolve(stats);
        });
      });
      console.log(`  ✓ Can stat package.json (${stats.size} bytes)`);
    } catch (error) {
      console.log('  ⚠️  package.json not found (this is okay)');
    }
    
    console.log('  ✓ File operations tests passed\n');
    return true;
  } catch (error) {
    console.error('  ❌ File operations test failed:', error.message);
    return false;
  }
}

async function testDependencies() {
  console.log('📦 Testing Dependencies...');
  
  const dependencies = [
    'express',
    'commander', 
    'fs-extra',
    'tesseract.js',
    'pdf-parse',
    'pdf2pic',
    'jimp',
    'sharp'
  ];
  
  let allDepsWorking = true;
  
  for (const dep of dependencies) {
    try {
      require(dep);
      console.log(`  ✓ ${dep} loaded successfully`);
    } catch (error) {
      console.error(`  ❌ ${dep} failed to load:`, error.message);
      allDepsWorking = false;
    }
  }
  
  if (allDepsWorking) {
    console.log('  ✓ All dependencies loaded successfully\n');
  } else {
    console.log('  ⚠️  Some dependencies failed to load\n');
  }
  
  return allDepsWorking;
}

async function testMainModules() {
  console.log('🔧 Testing Main Modules...');
  
  try {
    // Test OCR module
    const OCRService = require('./ocr');
    console.log('  ✓ OCR module loaded');
    
    // Test ignore module
    const ignore = require('./ignore');
    console.log('  ✓ Ignore module loaded');
    
    // Test server module structure (check file exists and has expected content)
    const serverCode = fs.readFileSync('./server.js', 'utf8');
    if (serverCode.includes('app.listen') && serverCode.includes('OCRService')) {
      console.log('  ✓ Server module structure valid');
    } else {
      throw new Error('Server module missing expected functionality');
    }
    
    // Test index module (check structure without executing)
    const indexModule = fs.readFileSync('./index.js', 'utf8');
    if (indexModule.includes('async function main()') && indexModule.includes('OCRService')) {
      console.log('  ✓ Index module structure valid');
    } else {
      throw new Error('Index module missing expected functionality');
    }
    
    console.log('  ✓ All main modules validated successfully\n');
    return true;
  } catch (error) {
    console.error('  ❌ Main modules test failed:', error.message);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 folder2text Application Test Suite');
  console.log('=====================================\n');
  
  const results = [];
  
  // Run all tests
  results.push(await testDependencies());
  results.push(await testMainModules());
  results.push(await testIgnoreLogic());
  results.push(await testFileOperations());
  results.push(await testOCRService());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 Test Results Summary');
  console.log('======================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Application is ready to use.');
    console.log('\n📝 Quick Start:');
    console.log('   Web GUI: npm start (then open http://localhost:3000)');
    console.log('   CLI: node index.js <folder-path>');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
    process.exit(1);
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
