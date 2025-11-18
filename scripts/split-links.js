const fs = require('fs');
const path = require('path');

/**
 * Split final.json into N chunks for parallel processing
 */
function splitLinksIntoChunks() {
  const inputFile = path.join(__dirname, '..', 'final.json');
  const outputDir = path.join(__dirname, '..', 'test-data', 'chunks');
  const numChunks = 10;

  console.log('='.repeat(80));
  console.log('SPLITTING LINKS INTO CHUNKS');
  console.log('='.repeat(80));

  // Read the input file
  console.log(`Reading: ${inputFile}`);
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  // Remove the first element if it's the header "link"
  const links = data[0] === 'link' ? data.slice(1) : data;
  console.log(`Total links: ${links.length}`);

  // Calculate chunk size
  const chunkSize = Math.ceil(links.length / numChunks);
  console.log(`Chunk size: ~${chunkSize} links per chunk`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  // Split into chunks
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, links.length);
    const chunk = links.slice(start, end);

    const outputFile = path.join(outputDir, `links-chunk-${i + 1}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(chunk, null, 2));

    console.log(`Chunk ${i + 1}: ${chunk.length} links (${start + 1} to ${end}) → ${path.basename(outputFile)}`);
  }

  console.log('='.repeat(80));
  console.log(`✓ Successfully split ${links.length} links into ${numChunks} chunks`);
  console.log('='.repeat(80));

  // Create a summary file
  const summary = {
    totalLinks: links.length,
    numChunks: numChunks,
    chunkSize: chunkSize,
    chunks: []
  };

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, links.length);
    summary.chunks.push({
      chunkId: i + 1,
      file: `links-chunk-${i + 1}.json`,
      startIndex: start + 1,
      endIndex: end,
      count: end - start
    });
  }

  const summaryFile = path.join(outputDir, 'chunks-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`Summary saved to: ${path.basename(summaryFile)}\n`);
}

// Run the script
try {
  splitLinksIntoChunks();
} catch (error) {
  console.error('Error splitting links:', error.message);
  process.exit(1);
}
