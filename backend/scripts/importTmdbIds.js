import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = 'C:\\Users\\Aditya Yadav\\Downloads\\movie_ids_08_28_2026.json\\movie_ids_08_28_2026.json';
const outputDir = path.join(__dirname, '..', 'data');
const outputPath = path.join(outputDir, 'indexed_tmdb_movies.json');

async function processFile() {
  console.log('🚀 Processing TMDB Daily Export from:', inputPath);

  if (!fs.existsSync(inputPath)) {
    console.error('❌ Input file does not exist at:', inputPath);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let totalLines = 0;
  const filtered = [];

  for await (const line of rl) {
    totalLines++;
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      // Filter out adult content and keep movies with popularity >= 2.0
      if (!item.adult && item.popularity && item.popularity >= 2.0) {
        filtered.push({
          id: item.id,
          title: item.original_title,
          popularity: item.popularity
        });
      }
    } catch (e) {
      // Ignore parse errors on malformed lines
    }

    if (totalLines % 200000 === 0) {
      console.log(`... scanned ${totalLines.toLocaleString()} entries (found ${filtered.length.toLocaleString()} popular movies)`);
    }
  }

  console.log(`✅ Finished scanning! Total entries in export: ${totalLines.toLocaleString()}`);
  console.log(`🎯 Filtered popular entries (pop >= 8.0): ${filtered.length.toLocaleString()}`);

  // Sort by popularity descending
  filtered.sort((a, b) => b.popularity - a.popularity);

  // Keep top 35,000 most popular movies for fast in-memory instant search
  const topIndexed = filtered.slice(0, 35000);

  fs.writeFileSync(outputPath, JSON.stringify(topIndexed), 'utf-8');
  console.log(`💾 Saved ${topIndexed.length.toLocaleString()} indexed movies to ${outputPath}`);
}

processFile().catch(console.error);
