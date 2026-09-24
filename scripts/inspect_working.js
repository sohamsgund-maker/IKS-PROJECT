import fs from 'fs';

const channels = JSON.parse(fs.readFileSync('working_in_channels.json', 'utf-8'));

let out = '';
function log(msg) {
  out += msg + '\n';
}

function list(names) {
  for (const n of names) {
    const found = channels.filter(c => c.name.toLowerCase().includes(n.toLowerCase()));
    log(`\n=== MATCHES FOR "${n}" (${found.length}) ===`);
    found.slice(0, 10).forEach(f => {
      log(`- [${f.name}] (${f.group}): ${f.url}`);
    });
  }
}

log('--- ENTERTAINMENT & MOVIES ---');
list(['Star', 'Colors', 'Zee', 'Dangal', 'Shemaroo', 'B4U', 'Gold', 'Cinema']);

log('--- NEWS ---');
list(['Aaj Tak', 'ABP', 'Zee News', 'India TV', 'News18', 'Republic', 'NDTV', 'Times Now', 'News24', 'Good News', 'CNBC', 'TV9']);

log('--- KIDS & MUSIC & DOC ---');
list(['Kid', 'Nick', 'Sonic', 'Hungama', '9X', 'Zoom', 'Mastiii', 'YRF', 'Zing', 'History', 'Earth', 'Discovery']);

log('--- REGIONAL ---');
list(['Marathi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bangla', 'Gujarati', 'Punjabi', 'Odia', 'Bhojpuri']);

fs.writeFileSync('inspect_results.txt', out, 'utf-8');
console.log('Written to inspect_results.txt');

