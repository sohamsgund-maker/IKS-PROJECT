const prefixes = ['cloudplay-star', 'cloudplay-zee', 'cloudplay-colors', 'cloudplay-jiotv', 'cloudplay-tv', 'cloudplay-tataplay', 'cloudplay-sports', 'cloudplay-live', 'cloudplay-in'];
async function main() {
  for (const p of prefixes) {
    try {
      const r = await fetch('https://' + p + '.pages.dev', { method: 'HEAD' });
      console.log(p + ': ' + r.status);
    } catch (e) {
      // ignore
    }
  }
}
main();
