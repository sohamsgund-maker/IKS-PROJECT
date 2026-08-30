const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.resolve('android/app/capacitor.build.gradle'),
  path.resolve('node_modules/@capacitor/android/capacitor/build.gradle'),
  path.resolve('node_modules/@capacitor-community/admob/android/build.gradle'),
  path.resolve('android/capacitor-cordova-android-plugins/build.gradle')
];

filesToPatch.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/8\.13\.0/g, '8.7.3');
    content = content.replace(/25\.4\.\+/g, '23.6.0');
    content = content.replace(/2\.2\.20/g, '1.9.24');
    content = content.replace(/VERSION_21/g, 'VERSION_17');
    content = content.replace(/jvmTarget = .*/g, "jvmTarget = '17'");
    content = content.replace(/abortOnError = true/g, 'abortOnError = false');
    content = content.replace(/warningsAsErrors = true/g, 'warningsAsErrors = false');
    content = content.replace(/: 36/g, ': 34');
    content = content.replace(/= 36/g, '= 34');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched: ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
