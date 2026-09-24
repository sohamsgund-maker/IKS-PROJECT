const names = [
  'starplus', 'starplus_hd', 'starbharat', 'stargold', 'stargoldhd', 'stargold2',
  'starsports1', 'starsports2', 'starsportshindi',
  'colors', 'colorshd', 'colorstv', 'colorscineplex',
  'zeetv', 'zeetvhd', 'zeecinema', 'zeecinemahd', 'andtv', 'andpictures',
  'sonytv', 'sonyhd', 'sonysab', 'sonymax', 'sonypal',
  'cartoonnetwork', 'pogo', 'hungama', 'nick', 'discovery'
];

async function scan() {
  for (const n of names) {
    try {
      const u = `http://107.167.16.138/${n}/index.m3u8?token=test`;
      const r = await fetch(u, { method: 'HEAD' });
      if (r.ok) {
        console.log(`[FOUND 107.167] ${n}: ${u}`);
      }
    } catch (e) {}
  }
  console.log('Done scanning 107.167.');
}
scan();
