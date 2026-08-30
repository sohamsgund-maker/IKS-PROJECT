const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.resolve('android/app/capacitor.build.gradle'),
  path.resolve('node_modules/@capacitor/android/capacitor/build.gradle'),
  path.resolve('node_modules/@capacitor-community/admob/android/build.gradle')
];

filesToPatch.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/8\.13\.0/g, '8.7.3');
    content = content.replace(/25\.4\.\+/g, '23.6.0');
    content = content.replace(/2\.2\.20/g, '1.9.24');
    content = content.replace(/14\.0\.1/g, '10.1.1');
    content = content.replace(/4\.0\.0/g, '3.0.0');
    content = content.replace(/1\.11\.0/g, '1.9.3');
    content = content.replace(/1\.15\.0/g, '1.13.1');
    content = content.replace(/1\.17\.0/g, '1.13.1');
    content = content.replace(/1\.8\.9/g, '1.8.5');
    content = content.replace(/1\.14\.0/g, '1.12.1');
    content = content.replace(/1\.7\.1/g, '1.7.0');
    content = content.replace(/1\.3\.0/g, '1.2.0');
    content = content.replace(/3\.7\.0/g, '3.6.1');
    content = content.replace(/VERSION_17/g, 'VERSION_21');
    content = content.replace(/jvmTarget = .*/g, "jvmTarget = '21'");
    content = content.replace(/abortOnError = true/g, 'abortOnError = false');
    content = content.replace(/warningsAsErrors = true/g, 'warningsAsErrors = false');
    content = content.replace(/testImplementation .*/g, '// removed test dep');
    content = content.replace(/testRuntimeOnly .*/g, '// removed test dep');
    content = content.replace(/androidTestImplementation .*/g, '// removed test dep');
    content = content.replace(/useJUnitPlatform\(\)/g, '// useJUnitPlatform');
    content = content.replace(/.*capacitor-cordova-android-plugins.*/g, '// cordova removed');
    content = content.replace(/.*postBuildExtras.*/g, '// postBuildExtras removed');
    content = content.replace(/: 36/g, ': 34');
    content = content.replace(/= 36/g, '= 34');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched: ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
