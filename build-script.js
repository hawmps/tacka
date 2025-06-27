const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function checkPrerequisites() {
  logInfo('Checking build prerequisites...');
  
  // Check if build directory exists
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    logWarning('Build directory not found. Creating build directory...');
    fs.mkdirSync(buildDir, { recursive: true });
    logInfo('Created build directory. Add your app icons and assets here.');
  }
  
  // Check for required files
  const requiredFiles = [
    { path: 'src/main.js', name: 'Main process file' },
    { path: 'src/index.html', name: 'Renderer HTML file' },
    { path: 'package.json', name: 'Package configuration' }
  ];
  
  let missingFiles = [];
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file.path))) {
      missingFiles.push(file.name);
    }
  });
  
  if (missingFiles.length > 0) {
    logError(`Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  logSuccess('All prerequisites check passed!');
  return true;
}

function createEntitlementsFile() {
  const entitlementsPath = path.join(__dirname, 'build', 'entitlements.mac.plist');
  
  if (!fs.existsSync(entitlementsPath)) {
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.debugger</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
</dict>
</plist>`;
    
    fs.writeFileSync(entitlementsPath, entitlementsContent);
    logInfo('Created macOS entitlements file');
  }
}

function runBuild(target) {
  return new Promise((resolve, reject) => {
    logInfo(`Starting ${target} build...`);
    
    const buildProcess = spawn('npx', ['electron-builder', target], {
      stdio: 'inherit',
      shell: true
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        logSuccess(`${target} build completed successfully!`);
        resolve();
      } else {
        logError(`${target} build failed with exit code ${code}`);
        reject(new Error(`Build failed with exit code ${code}`));
      }
    });
    
    buildProcess.on('error', (error) => {
      logError(`Failed to start ${target} build: ${error.message}`);
      reject(error);
    });
  });
}

async function main() {
  try {
    log('🚀 Starting Tracka Build Process', 'bright');
    log('================================', 'bright');
    
    // Check prerequisites
    if (!checkPrerequisites()) {
      process.exit(1);
    }
    
    // Create necessary files
    createEntitlementsFile();
    
    // Get build targets from command line arguments
    const args = process.argv.slice(2);
    let targets = [];
    
    if (args.includes('--win') || args.includes('-w')) {
      targets.push('--win');
    }
    if (args.includes('--mac') || args.includes('-m')) {
      targets.push('--mac');
    }
    if (args.includes('--linux') || args.includes('-l')) {
      targets.push('--linux');
    }
    if (args.includes('--all') || args.includes('-a')) {
      targets = ['--win', '--mac', '--linux'];
    }
    
    // Default to current platform if no targets specified
    if (targets.length === 0) {
      const platform = process.platform;
      if (platform === 'darwin') {
        targets.push('--mac');
      } else if (platform === 'win32') {
        targets.push('--win');
      } else {
        targets.push('--linux');
      }
      logInfo(`No target specified, building for current platform: ${platform}`);
    }
    
    // Build for each target
    for (const target of targets) {
      try {
        await runBuild(target);
      } catch (error) {
        logError(`Failed to build ${target}: ${error.message}`);
        // Continue with other targets
      }
    }
    
    log('', 'reset');
    log('🎉 Build Process Complete!', 'green');
    log('==========================', 'green');
    logInfo('Built files can be found in the "dist" directory');
    
    // Show code signing information
    log('', 'reset');
    log('📝 Code Signing Information:', 'yellow');
    log('============================', 'yellow');
    logWarning('For production releases, you should set up code signing:');
    log('• macOS: Set CSC_LINK and CSC_KEY_PASSWORD environment variables', 'yellow');
    log('• Windows: Set CSC_LINK and CSC_KEY_PASSWORD environment variables', 'yellow');
    log('• Or use electron-builder\'s code signing configuration', 'yellow');
    log('• See BUILD_INSTRUCTIONS.md for detailed setup', 'yellow');
    
  } catch (error) {
    logError(`Build process failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  log('', 'reset');
  logWarning('Build process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('', 'reset');
  logWarning('Build process terminated');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});