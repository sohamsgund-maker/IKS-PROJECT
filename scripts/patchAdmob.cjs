const fs = require('fs');
const path = require('path');

const admobGradlePath = path.resolve('node_modules/@capacitor-community/admob/android/build.gradle');

if (fs.existsSync(admobGradlePath)) {
  let content = fs.readFileSync(admobGradlePath, 'utf8');
  content = content.replace(/8\.13\.0/g, '8.7.3');
  content = content.replace(/25\.4\.\+/g, '23.6.0');
  content = content.replace(/compileSdk = .* : 36/g, 'compileSdk = project.hasProperty("compileSdkVersion") ? rootProject.ext.compileSdkVersion : 34');
  content = content.replace(/targetSdkVersion = .* : 36/g, 'targetSdkVersion = project.hasProperty("targetSdkVersion") ? rootProject.ext.targetSdkVersion : 34');
  fs.writeFileSync(admobGradlePath, content, 'utf8');
  console.log('✅ Patched @capacitor-community/admob/android/build.gradle successfully!');
} else {
  console.log('AdMob plugin build.gradle not found, skipping patch.');
}
