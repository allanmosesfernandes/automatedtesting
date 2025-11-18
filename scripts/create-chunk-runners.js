const fs = require('fs');
const path = require('path');

// Create batch files for running individual chunks
for (let i = 3; i <= 10; i++) {
  const batchContent = `@echo off
echo Running Chunk ${i}...
set CHUNK_FILE=test-data/chunks/links-chunk-${i}.json
set CHUNK_ID=${i}
set BATCH_START=1
set BATCH_SIZE=509
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts
`;

  const filename = path.join(__dirname, '..', `run-chunk-${i}.bat`);
  fs.writeFileSync(filename, batchContent);
  console.log(`Created: run-chunk-${i}.bat`);
}

console.log('\n✓ All chunk runner batch files created!');
