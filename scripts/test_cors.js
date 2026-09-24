const testUrls = [
  'https://cloudplay-sonyliv.pages.dev/sethd.m3u8',
  'https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8',
  'https://9xjio.wiseplayout.com/9XM/master.m3u8',
  'https://dai.google.com/linear/hls/event/JCAm25qkRXiKcK1AJMlvKQ/master.m3u8',
  'https://d1rc86nwwc9fag.cloudfront.net/vglive-sk-472500/abpnews/master.m3u8',
  'https://dknttpxmr0dwf.cloudfront.net/index_57.m3u8',
  'https://live-dangal.akamaized.net/liveabr/playlist.m3u8',
  'https://pl-indiatvnews.akamaized.net/out/v1/db79179b608641ceaa5a4d0dd0dca8da/index.m3u8',
  'https://n18syndication.akamaized.net/bpk-tv/News18_India_NW18_MOB/output01/master.m3u8',
  'https://dyjmyiv3bp2ez.cloudfront.net/pub-iotv9hinjzgtpe/liveabr/playlist.m3u8',
  'https://yupprestreamliveus.akamaized.net/v1/vglive-sk-717514/main.m3u8',
  'https://airtelapp.shemaroo.com/shemarootv/smil:shemarootvadp.smil/playlist.m3u8',
  'https://streams.tangotv.in/B4UMOVIES/ORIGIN/index.m3u8',
  'https://streams.tangotv.in/GOLDMINES/ORIGIN/index.m3u8'
];

async function main() {
  for (const u of testUrls) {
    try {
      const res = await fetch(u, {
        headers: {
          'Origin': 'https://cinevaultapk.online',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const cors = res.headers.get('access-control-allow-origin');
      console.log(`[CORS: ${cors || 'NONE'}] status=${res.status} URL=${u}`);
    } catch (e) {
      console.log(`[ERR] ${u}: ${e.message}`);
    }
  }
}
main();
