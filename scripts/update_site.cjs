const fs = require('fs');
const path = require('path');

const webDir = path.resolve(__dirname, '../../CineVaultapk Web');

const json = {
  version: '2.5.0',
  versionCode: 2500,
  releaseDate: '2026-09-22',
  changelog: [
    'Fixed video player landscape mode to fit full device frame',
    'Instant touch response time and optimized navigation speed',
    'Stream pre-warming and non-blocking background caching',
    'Cinema-grade 4K HDR & AV1 hardware decoding',
    '65+ Live TV channels with low-latency HLS'
  ],
  apkUrl: 'https://cinevaultapk.online/downloads/CineVault.apk',
  websiteUrl: 'https://cinevaultapk.online/',
  mandatory: true,
  minVersion: '2.5.0',
  sha256: '0841558f9f004408eff659280213b1e55d4fef25845590b04659f0d48605795f',
  fileSizeBytes: 9209090,
  fileSizeMB: '8.8MB'
};

const jsonStr = JSON.stringify(json, null, 2) + '\n';
fs.writeFileSync(path.join(webDir, 'version.json'), jsonStr, 'utf8');
fs.writeFileSync(path.join(webDir, 'dist/version.json'), jsonStr, 'utf8');

const htmlFiles = [
  path.join(webDir, 'index.html'),
  path.join(webDir, 'dist/index.html')
];

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/id="apkHash">[a-f0-9]+<\/code>/, 'id="apkHash">78f6f206d5e74123b64333ec78c023f24a442725a266eafb0bb44f6305c69b52</code>');
  html = html.replace(/8\.[0-9] MB \([0-9,]+ bytes\)/, '8.8 MB (9,209,123 bytes)');
  html = html.replace(/"fileSize": "8\.[0-9]MB"/, '"fileSize": "8.8MB"');
  html = html.replace(/v2\.5\.0 \(8\.[0-9] MB\)/, 'v2.5.0 (8.8 MB)');
  html = html.replace(/<span class="bento-tag tag-primary">8\.[0-9] MB<\/span>/, '<span class="bento-tag tag-primary">8.8 MB</span>');
  html = html.replace(/8\.[0-9] MB APK footprint/, '8.8 MB APK footprint');
  html = html.replace(/uncompressed 8\.[0-9] MB package/, 'uncompressed 8.8 MB package');
  fs.writeFileSync(file, html, 'utf8');
}

console.log('Successfully updated website files with zero BOM');
