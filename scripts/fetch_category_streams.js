import fs from 'fs';

async function fetchAndParse(url) {
  console.log(`Fetching ${url}...`);
  const r = await fetch(url);
  const text = await r.text();
  const lines = text.split('\n');
  const items = [];
  let cur = null;
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith('#EXTINF:')) cur = l;
    else if (l.startsWith('http') && cur) {
      const nameMatch = cur.match(/,(.+)$/);
      const logoMatch = cur.match(/tvg-logo="([^"]+)"/);
      const idMatch = cur.match(/tvg-id="([^"]+)"/);
      items.push({
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        logo: logoMatch ? logoMatch[1] : '',
        id: idMatch ? idMatch[1] : '',
        url: l
      });
      cur = null;
    }
  }
  return items;
}

async function testUrl(url) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(to);
    if (!res.ok && res.status !== 206) return false;
    const body = await res.text();
    return body.includes('#EXTM3U') || body.includes('#EXTINF');
  } catch {
    clearTimeout(to);
    return false;
  }
}

async function run() {
  const sports = await fetchAndParse('https://iptv-org.github.io/iptv/categories/sports.m3u');
  const kids = await fetchAndParse('https://iptv-org.github.io/iptv/categories/kids.m3u');
  const hin = await fetchAndParse('https://iptv-org.github.io/iptv/languages/hin.m3u');

  const indianSports = sports.filter(s => s.name.toLowerCase().includes('star') || s.name.toLowerCase().includes('sony') || s.name.toLowerCase().includes('cricket') || s.name.toLowerCase().includes('dd') || s.name.toLowerCase().includes('euro') || s.id.endsWith('.in@SD') || s.id.endsWith('.in@HD'));
  console.log(`Indian sports candidates: ${indianSports.length}`);

  const indianKids = kids.filter(k => k.name.toLowerCase().includes('cartoon') || k.name.toLowerCase().includes('pogo') || k.name.toLowerCase().includes('hungama') || k.name.toLowerCase().includes('nick') || k.name.toLowerCase().includes('disney') || k.name.toLowerCase().includes('sonic') || k.id.endsWith('.in@SD') || k.id.endsWith('.in@HD'));
  console.log(`Indian kids candidates: ${indianKids.length}`);

  for (const c of indianSports) {
    const ok = await testUrl(c.url);
    if (ok) console.log(`[WORKING SPORTS] ${c.name} -> ${c.url}`);
  }

  for (const c of indianKids) {
    const ok = await testUrl(c.url);
    if (ok) console.log(`[WORKING KIDS] ${c.name} -> ${c.url}`);
  }

  const keywords = ['star plus', 'colors', 'zee tv', '&tv', 'sony sab', 'dangal', 'shemaroo', 'star bharat'];
  const matchedHin = hin.filter(h => keywords.some(kw => h.name.toLowerCase().includes(kw)));
  for (const c of matchedHin) {
    const ok = await testUrl(c.url);
    if (ok) console.log(`[WORKING HINDI] ${c.name} -> ${c.url}`);
  }
}

run();
