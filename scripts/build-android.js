
// This script will be run by the build:android npm script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const playDir = path.join(__dirname, '../dist/play');
if (!fs.existsSync(playDir)) {
  fs.mkdirSync(playDir, { recursive: true });
}

// Set environment variable for production build
process.env.VITE_LOVABLE = 'false';

// Run the build commands
console.log('Building Vite app...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Syncing Capacitor project...');
execSync('npx cap sync android', { stdio: 'inherit' });

// Patch the build.gradle file
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
if (fs.existsSync(buildGradlePath)) {
  console.log('Patching build.gradle...');
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Update SDK versions
  buildGradle = buildGradle.replace(/compileSdkVersion \d+/g, 'compileSdkVersion 34');
  buildGradle = buildGradle.replace(/targetSdkVersion \d+/g, 'targetSdkVersion 34');
  
  // Add ABI splits if not present
  if (!buildGradle.includes('splits {')) {
    const androidBlock = buildGradle.match(/android {[\s\S]*?(?=buildTypes)/);
    if (androidBlock) {
      const splitsConfig = `
    splits {
        abi {
            enable true
            reset()
            include 'arm64-v8a', 'x86_64'
            universalApk false
        }
    }
    
    `;
      buildGradle = buildGradle.replace(/android {[\s\S]*?(?=buildTypes)/, androidBlock[0] + splitsConfig);
    }
  }
  
  fs.writeFileSync(buildGradlePath, buildGradle);
}

// Patch AndroidManifest.xml to add mic permission and deep links
const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  console.log('Patching AndroidManifest.xml...');
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  // Add RECORD_AUDIO permission if not present
  if (!manifest.includes('android.permission.RECORD_AUDIO')) {
    manifest = manifest.replace(
      '<uses-permission android:name="android.permission.INTERNET" />',
      '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />'
    );
  }
  
  // Add intent filter for deep links if not present
  if (!manifest.includes('pitchperfectai.ai')) {
    manifest = manifest.replace(
      '</activity>',
      `        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" android:host="pitchperfectai.ai" android:pathPattern=".*" />
        </intent-filter>
      </activity>`
    );
  }
  
  fs.writeFileSync(manifestPath, manifest);
}

// Build the release bundle
console.log('Building Android App Bundle...');
const timestamp = Date.now();
const outputPath = path.join(playDir, `PitchPerfect-${timestamp}.aab`);
try {
  execSync('cd android && ./gradlew bundleRelease', { stdio: 'inherit' });
  
  // Copy the AAB file to our play directory
  const aabSourcePath = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');
  if (fs.existsSync(aabSourcePath)) {
    fs.copyFileSync(aabSourcePath, outputPath);
    console.log(`✅ Build successful! App Bundle saved to: ${outputPath}`);
    
    console.log('\n📱 Testing the app bundle:');
    console.log('To test the bundle with bundletool, run:');
    console.log('node scripts/test-android-bundle.js');
    console.log('\nThis will help you verify the bundle works correctly before uploading to Google Play.');
  } else {
    console.error('❌ Could not find the AAB file. Build may have failed.');
  }
} catch (error) {
  console.error('❌ Build failed:', error);
}
