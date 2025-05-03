
// Script to update Android manifest with proper permission declarations
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to ensure a directory exists
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Function to update the AndroidManifest.xml
const updateAndroidManifest = () => {
  const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
  
  // Check if Android project exists
  if (!fs.existsSync(path.join(__dirname, '../android'))) {
    console.log('⚠️ Android project not found. Run npx cap add android first.');
    return;
  }
  
  // Ensure the manifest file exists
  if (!fs.existsSync(manifestPath)) {
    console.log(`⚠️ AndroidManifest.xml not found at ${manifestPath}`);
    return;
  }
  
  // Read the manifest file
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  // Add RECORD_AUDIO permission if not present
  if (!manifest.includes('android.permission.RECORD_AUDIO')) {
    manifest = manifest.replace(
      '<uses-permission android:name="android.permission.INTERNET" />',
      '<uses-permission android:name="android.permission.INTERNET" />\n    ' +
      '<uses-permission android:name="android.permission.RECORD_AUDIO" />'
    );
    console.log('✅ Added RECORD_AUDIO permission');
  } else {
    console.log('ℹ️ RECORD_AUDIO permission already present');
  }
  
  // Add maxSdkVersion for permissions that should be restricted
  if (manifest.includes('android.permission.READ_EXTERNAL_STORAGE') && 
      !manifest.includes('android:maxSdkVersion="32"')) {
    manifest = manifest.replace(
      '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />',
      '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />'
    );
    console.log('✅ Added maxSdkVersion for READ_EXTERNAL_STORAGE permission');
  }
  
  // Add android:required="false" for features that are not required
  if (manifest.includes('<uses-feature') && !manifest.includes('android:required="false"')) {
    manifest = manifest.replace(
      /<uses-feature/g, 
      '<uses-feature android:required="false"'
    );
    console.log('✅ Added required="false" to features');
  }
  
  // Add Google Play's data protection statement
  if (!manifest.includes('data-protection-declaration')) {
    manifest = manifest.replace(
      '</manifest>',
      `    <!-- Google Play Data Safety Declaration -->
    <meta-data
        android:name="google_play_data_protection_declaration"
        android:value="@string/data_protection_declaration" />
</manifest>`
    );
    console.log('✅ Added data protection declaration metadata');
    
    // Create strings.xml if it doesn't exist
    const stringsPath = path.join(__dirname, '../android/app/src/main/res/values/strings.xml');
    ensureDirExists(path.dirname(stringsPath));
    
    if (!fs.existsSync(stringsPath)) {
      fs.writeFileSync(stringsPath, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PitchPerfect AI</string>
    <string name="title_activity_main">PitchPerfect AI</string>
    <string name="package_name">com.pitchperfectai.app</string>
    <string name="custom_url_scheme">com.pitchperfectai.app</string>
    <string name="data_protection_declaration">https://pitchperfectai.ai/privacy</string>
</resources>
`);
      console.log('✅ Created strings.xml with data protection declaration');
    } else {
      let stringsXml = fs.readFileSync(stringsPath, 'utf8');
      if (!stringsXml.includes('data_protection_declaration')) {
        stringsXml = stringsXml.replace(
          '</resources>',
          '    <string name="data_protection_declaration">https://pitchperfectai.ai/privacy</string>\n</resources>'
        );
        fs.writeFileSync(stringsPath, stringsXml);
        console.log('✅ Updated strings.xml with data protection declaration');
      }
    }
  }
  
  // Write the updated manifest back to the file
  fs.writeFileSync(manifestPath, manifest);
  console.log('✅ AndroidManifest.xml updated successfully');
};

// Run the update function
updateAndroidManifest();

console.log('\nNext steps:');
console.log('1. Run `npx cap sync android` to sync your changes');
console.log('2. Build your app with `npm run build:android`');
console.log('3. Submit the app to Google Play Store');
