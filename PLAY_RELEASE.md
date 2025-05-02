
# Google Play Release Guide

This guide explains how to prepare and deploy the PitchPerfect AI app to the Google Play Store.

## Building the App Bundle

To build an Android App Bundle (AAB) for release:

```bash
npm run build:android
```

This command:
1. Builds the React app with Vite
2. Syncs the web assets to the Android project
3. Builds a signed Android App Bundle (AAB)

The AAB file will be saved to `dist/play/PitchPerfect-{timestamp}.aab`

## Testing the App Bundle with bundletool

We've created a helper script to test your AAB before uploading to Google Play:

```bash
node scripts/test-android-bundle.js
```

This script will:
1. Check for bundletool installation
2. Prompt for keystore information
3. Build device-specific APKs from your AAB
4. Offer to install them on a connected device

### Manual bundletool commands

If you prefer to use bundletool directly:

```bash
# Generate APKs from the AAB
bundletool build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=/tmp/PitchPerfect.apks \
  --ks=/path/to/keystore.jks \
  --ks-pass=pass:your-keystore-password \
  --ks-key-alias=your-key-alias \
  --key-pass=pass:your-key-password

# Install APKs on a connected device
bundletool install-apks --apks=/tmp/PitchPerfect.apks
```

### Installing bundletool

If you don't have bundletool:

1. Download the latest JAR from [GitHub](https://github.com/google/bundletool/releases)
2. Create an alias for easy access:
   ```bash
   alias bundletool='java -jar /path/to/bundletool.jar'
   ```
3. Or place it in your PATH

## Validating the App Bundle

Validate your AAB using bundletool:

```bash
bundletool validate --bundle=/path/to/PitchPerfect.aab
```

## Keystores and Signing

For release builds, you need a signing keystore:

1. Generate a keystore if you don't have one:
   ```bash
   keytool -genkey -v -keystore pitchperfect.keystore -alias pitchperfect -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`:
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('path/to/pitchperfect.keystore')
         storePassword 'your-store-password'
         keyAlias 'pitchperfect'
         keyPassword 'your-key-password'
       }
     }
   }
   ```

## Play App Signing Enrollment

1. Generate an upload key and keystore
2. In Play Console, go to Setup → App Integrity → App signing
3. Follow the enrollment process for Play App Signing
4. Upload your signing certificate when prompted

## Google Play Internal Testing

1. Create a new release in Play Console:
   - Navigate to Testing → Internal testing
   - Create a new release
   - Upload your AAB file
   - Complete the release form
   - Save and roll out the release

2. Check the Pre-launch Report:
   - Wait for Google to run automated tests
   - Address any issues flagged in the report

## Data Safety Section

Complete the Data Safety form with this information:

1. **Data Collection**:
   - **Audio/Voice Data**: Collected
     - Purpose: App functionality
     - Processing: On-device and in the cloud
     - Encrypted in transit: Yes
     - User can request deletion: Yes

   - **User IDs**: Collected
     - Purpose: App functionality, Authentication
     - Processing: On-device and in the cloud
     - Encrypted in transit: Yes
     - User can request deletion: Yes

2. **Security Practices**:
   - Data is encrypted in transit
   - Users can request data deletion
   - Personal data is not shared with third parties

## Content Rating Questionnaire

Use these answers for the content rating:

1. **Target audience**: 18+ / adults
2. **Content type**: Business / Productivity
3. **Violence**: None
4. **Sexuality**: None
5. **Profanity**: None
6. **Controlled substances**: None
7. **User-generated content**: None
8. **Gambling**: None

## App Info Settings

1. **Category**: Business, Productivity, or Education
2. **Email contact**: your-support-email@domain.com
3. **Website**: https://pitchperfectai.ai
4. **Privacy Policy URL**: https://pitchperfectai.ai/privacy

## Testing on Physical Device

To test the app on a physical device:

1. Enable Developer options and USB debugging on your device
2. Connect your device via USB
3. Run:
   ```bash
   npx cap run android
   ```

To test deep links:
```bash
adb shell am start -a android.intent.action.VIEW -d "https://pitchperfectai.ai/demo"
```

## Final Checklist

Before submitting for review:

- [ ] App launches in less than 5 seconds
- [ ] Back button works consistently
- [ ] Microphone permissions work properly
- [ ] Account deletion process works
- [ ] Deep links correctly open the appropriate screens
- [ ] All content meets Google Play policies
- [ ] Privacy policy is accessible and accurate
- [ ] Data safety section is complete and accurate
- [ ] Min 3 screenshots uploaded to Play listing
- [ ] Icon and feature graphic uploaded

## Creating SHA-256 Fingerprint

To generate the SHA-256 fingerprint for App Links:

```bash
keytool -list -v -keystore your-keystore.keystore -alias your-alias -storepass your-password -keypass your-key-password
```

Use this value in the `.well-known/assetlinks.json` file on your website.
