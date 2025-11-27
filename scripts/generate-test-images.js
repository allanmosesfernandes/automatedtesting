/**
 * Generate placeholder test images for photo book testing
 * Creates 21 simple colored PNG images
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'tests', 'data', 'test-images');
const NUM_IMAGES = 21;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Simple PNG generator (different colors)
function createMinimalPNG(r, g, b) {
  // PNG file structure for a 500x500 solid color image
  const width = 500;
  const height = 500;

  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);  // width
  ihdrData.writeUInt32BE(height, 4); // height
  ihdrData.writeUInt8(8, 8);         // bit depth
  ihdrData.writeUInt8(2, 9);         // color type (RGB)
  ihdrData.writeUInt8(0, 10);        // compression
  ihdrData.writeUInt8(0, 11);        // filter
  ihdrData.writeUInt8(0, 12);        // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (image data) - uncompressed for simplicity
  // Create raw image data (filter byte + RGB for each pixel per row)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b);
    }
  }

  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 implementation for PNG
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate images with different colors
const colors = [
  [255, 100, 100], // red
  [100, 255, 100], // green
  [100, 100, 255], // blue
  [255, 255, 100], // yellow
  [255, 100, 255], // magenta
  [100, 255, 255], // cyan
  [255, 150, 100], // orange
  [150, 100, 255], // purple
  [100, 200, 150], // teal
  [200, 150, 100], // tan
  [255, 200, 200], // pink
  [200, 255, 200], // light green
  [200, 200, 255], // light blue
  [255, 220, 180], // peach
  [180, 220, 255], // sky blue
  [220, 180, 255], // lavender
  [255, 180, 220], // rose
  [180, 255, 220], // mint
  [220, 255, 180], // lime
  [255, 240, 200], // cream
  [200, 240, 255], // ice blue
];

console.log(`Generating ${NUM_IMAGES} test images in ${OUTPUT_DIR}...`);

for (let i = 0; i < NUM_IMAGES; i++) {
  const color = colors[i % colors.length];
  const png = createMinimalPNG(color[0], color[1], color[2]);
  const filename = `test-image-${String(i + 1).padStart(2, '0')}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, png);
  console.log(`  Created: ${filename}`);
}

console.log(`\nDone! ${NUM_IMAGES} images created in tests/data/test-images/`);
