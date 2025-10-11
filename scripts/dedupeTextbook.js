const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'data', 'textbook', '1.json');

function main() {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  const seen = new Set();
  const duplicates = [];
  const filtered = data.filter((entry, index) => {
    if (!entry || typeof entry.word !== 'string') {
      return true;
    }
    if (seen.has(entry.word)) {
      duplicates.push({ word: entry.word, index });
      return false;
    }
    seen.add(entry.word);
    return true;
  });

  if (!duplicates.length) {
    console.log('No duplicates found.');
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2) + '\n', 'utf8');

  console.log(`Removed ${duplicates.length} duplicate entr${duplicates.length === 1 ? 'y' : 'ies'}:`);
  for (const dup of duplicates) {
    console.log(`- ${dup.word} (original index ${dup.index})`);
  }
}

main();
