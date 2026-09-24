const names = [
  'STAR-PLUS', 'STARPLUS', 'STAR-BHARAT', 'STARBHARAT', 'STAR-GOLD', 'STARGOLD',
  'STAR-SPORTS-1', 'STARSPORTS1', 'STAR-SPORTS-2', 'STARSPORTS2', 'STAR-SPORTS-HINDI',
  'COLORS', 'COLORS-HD', 'COLORS-CINEPLEX',
  'ZEE-TV', 'ZEETV', 'ZEE-CINEMA', 'ZEECINEMA', 'AND-TV', 'ANDTV', 'AND-PICTURES',
  'SONY', 'SONY-TV', 'SONY-SAB', 'SONY-MAX', 'SONY-PAL', 'SONY-YAY',
  'CARTOON-NETWORK', 'CN', 'POGO', 'DISCOVERY', 'DISCOVERY-KIDS', 'ANIMAL-PLANET', 'NAT-GEO', 'HISTORY-TV18',
  'AAJ-TAK', 'ABP-NEWS', 'ZEE-NEWS', 'INDIA-TV', 'NEWS18-INDIA'
];

async function scan() {
  for (const n of names) {
    try {
      const u = `http://103.185.24.134:3001/${n}/index.m3u8`;
      const r = await fetch(u, { method: 'HEAD' });
      if (r.ok) {
        console.log(`[FOUND 103.185] ${n}: ${u}`);
      }
    } catch (e) {}
  }
  console.log('Done scanning 103.185.');
}
scan();
