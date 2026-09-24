import fs from 'fs';

const working = JSON.parse(fs.readFileSync('working_in_channels.json', 'utf-8'));

console.log(`Loaded ${working.length} tested working channels.`);

function find(q) {
  const matches = working.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  return matches.map(c => ({ name: c.name, url: c.url, logo: c.logo }));
}

const targets = [
  'Star', 'Sony', 'Colors', 'Zee', 'Dangal', 'Shemaroo', 'Sun',
  'Aaj Tak', 'ABP', 'India TV', 'News18', 'Republic', 'NDTV', 'Times Now', 'News24', 'Good News', 'CNBC', 'TV9',
  'Sports', 'Ten', 'Eurosport', 'Cricket',
  'Kid', 'Nick', 'Pogo', 'Cartoon', 'Sonic', 'Hungama',
  'Discovery', 'Geographic', 'History', 'Earth', 'Travel',
  '9X', 'B4U', 'Mastiii', 'Zoom', 'Music', 'MTV',
  'Marathi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bangla', 'Gujarati', 'Punjabi', 'Odia', 'Bhojpuri'
];

const results = {};
for (const t of targets) {
  const m = find(t);
  results[t] = m;
  console.log(`Target "${t}": ${m.length} found`);
}

fs.writeFileSync('catalog_matches.json', JSON.stringify(results, null, 2));
