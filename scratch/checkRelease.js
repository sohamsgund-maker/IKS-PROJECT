async function checkAssets() {
  const res = await fetch('https://github.com/aditys4444/cinevault/releases/tag/v1.0.0');
  const html = await res.text();
  const regex = /href="([^"]+)"/g;
  let m;
  const links = [];
  while ((m = regex.exec(html)) !== null) {
    if (m[1].includes('download') || m[1].includes('apk') || m[1].includes('releases')) {
      links.push(m[1]);
    }
  }
  console.log('Found release download links:', [...new Set(links)]);
}
checkAssets();
