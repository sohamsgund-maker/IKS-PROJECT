import fs from 'fs';

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

console.log(`Total parsed channels: ${channels.length}`);

// Search for keywords
const keywords = ['Star', 'Sony', 'Colors', 'Zee', 'Aaj Tak', 'ABP', 'India TV', 'NDTV', 'News18', '9X', 'B4U', 'Dangal', 'Shemaroo', 'Pogo', 'Cartoon', 'Nick', 'Discovery', 'History', 'Sports'];

keywords.forEach(kw => {
  const matches = channels.filter(c => c.name.toLowerCase().includes(kw.toLowerCase()));
  console.log(`\n--- Matches for "${kw}" (${matches.length}) ---`);
  matches.slice(0, 5).forEach(m => console.log(`  [${m.name}] (${m.group}): ${m.url}`));
});
