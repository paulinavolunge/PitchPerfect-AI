
#!/usr/bin/env node

// This script helps test a signed Android App Bundle (AAB) using bundletool
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get paths
const rootDir = path.resolve(__dirname, '..');
const aabPath = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const outputApksPath = path.join(rootDir, 'dist', 'play', 'PitchPerfect.apks');

// Check if bundletool exists
const checkBundleTool = () => {
  try {
    execSync('bundletool version', { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.error('❌ Error: bundletool not found in PATH');
    console.log('\nPlease install bundletool first:');
    console.log('1. Download from: https://github.com/google/bundletool/releases');
    console.log('2. Rename to "bundletool.jar"');
    console.log('3. Add to PATH or create an alias:');
    console.log('   alias bundletool="java -jar /path/to/bundletool.jar"\n');
    return false;
  }
};

// Check if AAB exists
const checkAAB = () => {
  if (!fs.existsSync(aabPath)) {
    console.error(`❌ Error: AAB file not found at: ${aabPath}`);
    console.log('\nPlease build the Android App Bundle first:');
    console.log('npm run build:android\n');
    return false;
  }
  return true;
};

const askForKeystoreInfo = () => {
  return new Promise((resolve) => {
    console.log('\n📱 Android App Bundle Test');
    console.log('========================\n');
    
    rl.question('Path to keystore file: ', (keystorePath) => {
      rl.question('Keystore password: ', (keystorePass) => {
        rl.question('Key alias: ', (keyAlias) => {
          rl.question('Key password (press Enter if same as keystore password): ', (keyPass) => {
            resolve({
              keystorePath: keystorePath.trim(),
              keystorePass: keystorePass.trim(),
              keyAlias: keyAlias.trim(),
              keyPass: (keyPass.trim() || keystorePass.trim()) // Use keystore password if key password is empty
            });
          });
        });
      });
    });
  });
};

const buildApks = async () => {
  if (!checkBundleTool() || !checkAAB()) {
    rl.close();
    return;
  }

  const keystoreInfo = await askForKeystoreInfo();

  // Ensure output directory exists
  const outputDir = path.dirname(outputApksPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    console.log('\n🔨 Building APKs from App Bundle...');
    
    const command = `bundletool build-apks \
      --bundle=${aabPath} \
      --output=${outputApksPath} \
      --ks=${keystoreInfo.keystorePath} \
      --ks-pass=pass:${keystoreInfo.keystorePass} \
      --ks-key-alias=${keystoreInfo.keyAlias} \
      --key-pass=pass:${keystoreInfo.keyPass}`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ APKs built successfully!');
    console.log(`Output saved to: ${outputApksPath}`);
    
    rl.question('\nInstall the APKs on a connected device? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          console.log('\n📲 Installing APKs on connected device...');
          execSync(`bundletool install-apks --apks=${outputApksPath}`, { stdio: 'inherit' });
          console.log('\n✅ Installation complete!');
        } catch (error) {
          console.error('\n❌ Installation failed:', error.message);
          console.log('Make sure a device is connected and debuggable.');
        }
      }
      rl.close();
    });
  } catch (error) {
    console.error('\n❌ Building APKs failed:', error.message);
    rl.close();
  }
};

// Start the script
buildApks();
