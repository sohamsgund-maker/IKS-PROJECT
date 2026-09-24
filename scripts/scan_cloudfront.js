const base = 'https://da86m1sqpm3o0.cloudfront.net/28072023/';
const names = [
  'starplus', 'starplus1', 'starplushd', 'starplushd1',
  'starbharat', 'starbharathd',
  'stargold', 'stargoldhd', 'stargold2',
  'starsports', 'starsports1', 'starsports1hd', 'starsports2', 'starsportshindi',
  'colors', 'colors1', 'colorshd', 'colorshd1',
  'zeetv', 'zeetv1', 'zeetvhd', 'zeetvhd1',
  'zeecinema', 'zeecinemahd',
  'sonytv', 'sethd', 'sabtv', 'sonysab'
];

async function test() {
  for (const n of names) {
    const u1 = `${base}smil:${n}.smil/playlist.m3u8`;
    const u2 = `${base}smil:${n}.smil/chunklist_b1928000.m3u8`;
    const u3 = `${base}smil:${n}.smil/chunklist_b2628000.m3u8`;
    for (const u of [u1, u2, u3]) {
      try {
        const r = await fetch(u, { method: 'HEAD' });
        if (r.ok) {
          console.log(`[FOUND] ${n} -> ${u}`);
          break;
        }
      } catch (e) {}
    }
  }
  console.log('Done scanning cloudfront.');
}
test();
