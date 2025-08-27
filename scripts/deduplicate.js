const fs = require('fs');
const path = require('path');

// Read the JSON file
const dataPath = path.join(__dirname, '../public/data/grade1.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('=== Original Data Analysis ===');
console.log(`Total entries: ${data.length}`);

// Separate by type
const recognizeData = data.filter(item => item.type === 'recognize');
const writeData = data.filter(item => item.type === 'write');

console.log(`Recognize (识字表): ${recognizeData.length}`);
console.log(`Write (写字表): ${writeData.length}`);

// Find duplicates based on char AND korean meaning
const duplicates = [];
const writeMap = new Map();

// Create map of write characters with their korean meanings
writeData.forEach(item => {
  const key = `${item.char}_${item.korean}`;
  writeMap.set(key, item);
});

// Check for duplicates in recognize
recognizeData.forEach(item => {
  const key = `${item.char}_${item.korean}`;
  if (writeMap.has(key)) {
    duplicates.push({
      char: item.char,
      korean: item.korean,
      recognizeId: item.id,
      writeId: writeMap.get(key).id
    });
  }
});

console.log(`\n=== Duplicates Found ===`);
console.log(`Total duplicates: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log('\nFirst 10 duplicates:');
  duplicates.slice(0, 10).forEach(dup => {
    console.log(`  ${dup.char} (${dup.korean}) - Recognize ID: ${dup.recognizeId}, Write ID: ${dup.writeId}`);
  });
}

// Remove duplicates - keep only write version when char AND korean are the same
const deduplicatedData = [];
const seenKeys = new Set();

// First add all write data (priority)
writeData.forEach(item => {
  const key = `${item.char}_${item.korean}`;
  deduplicatedData.push(item);
  seenKeys.add(key);
});

// Then add recognize data that doesn't duplicate
recognizeData.forEach(item => {
  const key = `${item.char}_${item.korean}`;
  if (!seenKeys.has(key)) {
    deduplicatedData.push(item);
    seenKeys.add(key);
  }
});

// Sort by original order and renumber
deduplicatedData.sort((a, b) => {
  // Write items come after recognize items
  if (a.type !== b.type) {
    return a.type === 'recognize' ? -1 : 1;
  }
  // Within same type, sort by original ID
  return a.id - b.id;
});

// Renumber IDs
deduplicatedData.forEach((item, index) => {
  item.id = index + 1;
});

console.log('\n=== After Deduplication ===');
const finalRecognize = deduplicatedData.filter(item => item.type === 'recognize');
const finalWrite = deduplicatedData.filter(item => item.type === 'write');
console.log(`Total: ${deduplicatedData.length}`);
console.log(`Recognize: ${finalRecognize.length}`);
console.log(`Write: ${finalWrite.length}`);

// Save the cleaned data
const outputPath = path.join(__dirname, '../public/data/grade1_cleaned.json');
fs.writeFileSync(outputPath, JSON.stringify(deduplicatedData, null, 2));
console.log(`\n✅ Cleaned data saved to: ${outputPath}`);

// Optionally overwrite original
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nOverwrite original grade1.json? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    fs.writeFileSync(dataPath, JSON.stringify(deduplicatedData, null, 2));
    console.log('✅ Original file updated!');
  } else {
    console.log('Original file kept unchanged. Check grade1_cleaned.json for the deduplicated version.');
  }
  rl.close();
});