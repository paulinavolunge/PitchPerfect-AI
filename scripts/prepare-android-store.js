
// Script to prepare Android app for Google Play Store submission
const fs = require('fs');
const path = require('path');

// Ensure the Android assets directory exists
const assetsDir = path.join(__dirname, '../android/app/src/main/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create Data Safety attributes JSON file for Play Store
const dataSafetyContent = {
  data_collection: {
    collected_data: [
      {
        type: "Personal info",
        items: ["Name", "Email address"],
        purpose: "App functionality",
        shared: false,
        collection_type: "User provided",
        required: true
      },
      {
        type: "Voice or sound recordings",
        items: ["Voice recordings"],
        purpose: "App functionality",
        shared: false,
        collection_type: "User provided",
        required: false,
        optional: true,
        ephemeral: true
      }
    ],
    security_practices: [
      "Data is encrypted in transit",
      "Data is encrypted at rest",
      "User can request data deletion"
    ],
    data_retention: "Data is retained only as long as necessary for the purposes described in our Privacy Policy.",
    children_data: "This app does not collect data from children."
  }
};

// Write data safety JSON file
const dataSafetyPath = path.join(assetsDir, 'data_safety.json');
fs.writeFileSync(dataSafetyPath, JSON.stringify(dataSafetyContent, null, 2));
console.log(`✅ Data safety JSON created at: ${dataSafetyPath}`);

// Create privacy and permissions documentation file
const privacyDocsContent = `
# Privacy and Permissions Documentation

## App Permissions

### Microphone
- **Usage**: Required for voice recording during speech practice and AI roleplay conversations
- **Access Type**: Runtime permission, requested only when needed
- **Data Handling**: Voice recordings are encrypted in transit and at rest
- **Retention**: Voice data can be deleted by the user at any time and is automatically deleted after 30 days

### Internet Access
- **Usage**: Required for AI processing, cloud storage, and account synchronization
- **Access Type**: Manifest permission, always granted
- **Data Handling**: All network traffic is encrypted using TLS

## Data Collection & Privacy

### Personal Information
- Email address (for authentication)
- Name (optional profile information)
- Voice recordings (for pitch practice analysis)

### Data Security
- All sensitive user data is encrypted using AES-256
- Row-level security implemented in database
- Regular security audits and testing

### User Controls
- Privacy settings accessible from the app menu
- Data download option available
- Account deletion with complete data removal

### Third-Party Sharing
- No personal data is sold to third parties
- Anonymous analytics may be used to improve the app
- Users can opt out of analytics in settings

### Compliance
- GDPR compliant
- CCPA compliant
- Google Play data safety requirements compliant

For more information, see our Privacy Policy at https://pitchperfectai.ai/privacy
`;

// Write privacy documentation file
const privacyDocsPath = path.join(assetsDir, 'privacy_docs.md');
fs.writeFileSync(privacyDocsPath, privacyDocsContent);
console.log(`✅ Privacy documentation created at: ${privacyDocsPath}`);

// Update the app's build.gradle to add metadata about data safety
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
if (fs.existsSync(buildGradlePath)) {
  console.log('📝 Updating build.gradle with data safety metadata...');
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Add metadata to buildConfigField if not already present
  if (!buildGradle.includes('DATA_SAFETY_VERSION')) {
    const buildTypesMatch = buildGradle.match(/buildTypes\s*{[^}]*}/);
    if (buildTypesMatch) {
      const buildTypesBlock = buildTypesMatch[0];
      const updatedBuildTypesBlock = buildTypesBlock.replace(
        'buildTypes {',
        `buildTypes {
        debug {
            buildConfigField "String", "DATA_SAFETY_VERSION", "\\"1.0\\""
        }
        release {
            buildConfigField "String", "DATA_SAFETY_VERSION", "\\"1.0\\""
        }`
      );
      
      buildGradle = buildGradle.replace(buildTypesBlock, updatedBuildTypesBlock);
      fs.writeFileSync(buildGradlePath, buildGradle);
      console.log('✅ Added data safety metadata to build.gradle');
    }
  } else {
    console.log('ℹ️ Data safety metadata already present in build.gradle');
  }
}

console.log('✅ Android Play Store preparation complete!');
console.log('\nPlease remember to:');
console.log('1. Review the generated files before submission');
console.log('2. Complete the Data Safety section in Google Play Console');
console.log('3. Upload privacy policy URL to Google Play Console');
console.log('4. Test all permission flows before final submission');
