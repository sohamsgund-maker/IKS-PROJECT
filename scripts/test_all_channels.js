import fs from 'fs';

// Read in_test.m3u
const content = fs.readFileSync('in_test.m3u', 'utf-8');
const lines = content.split('\n');

const channels = [];
let currentInf = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('#EXTINF:')) {
    currentInf = line;
  } else if (line.startsWith('http') && currentInf) {
    const nameMatch = currentInf.match(/,(.+)$/);
    const logoMatch = currentInf.match(/tvg-logo="([^"]+)"/);
    const groupMatch = currentInf.match(/group-title="([^"]+)"/);
    const idMatch = currentInf.match(/tvg-id="([^"]+)"/);
    channels.push({
      name: nameMatch ? nameMatch[1].trim() : 'Unknown',
      logo: logoMatch ? logoMatch[1] : '',
      group: groupMatch ? groupMatch[1] : '',
      id: idMatch ? idMatch[1] : '',
      url: line
    });
    currentInf = null;
  }
}

console.log(`Parsed ${channels.length} channels from in_test.m3u. Testing live playback validity...`);

async function testUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Range': 'bytes=0-2048'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!resp.ok && resp.status !== 206) return { ok: false, status: resp.status };
    const text = await resp.text();
    if (text.includes('#EXTM3U') || text.includes('#EXT-X-STREAM-INF') || text.includes('#EXTINF')) {
      return { ok: true, status: resp.status, text: text.substring(0, 100) };
    }
    return { ok: false, status: resp.status, reason: 'No EXTM3U header' };
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, error: err.name === 'AbortError' ? 'Timeout' : err.message };
  }
}

// Test in batches of 20
async function run() {
  const working = [];
  const batchSize = 25;
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (ch) => {
        const res = await testUrl(ch.url);
        return { ...ch, res };
      })
    );
    for (const r of results) {
      if (r.res.ok) {
        working.push(r);
        console.log(`[WORKING] ${r.name} (${r.group}) -> ${r.url}`);
      }
    }
  }

  console.log(`\n\n========================================`);
  console.log(`Total Working Channels: ${working.length} / ${channels.length}`);
  fs.writeFileSync('working_in_channels.json', JSON.stringify(working, null, 2));
}

run();
