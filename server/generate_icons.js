const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, bgColor, text) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines (each row starts with filter byte 0)
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  const [rBg, gBg, bBg] = bgColor; // [255, 69, 0] brand orange
  const [rFg, gFg, bFg] = [255, 255, 255]; // white

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Draw rounded rectangle & "FG" badge pattern
      const margin = Math.round(width * 0.08);
      const isInner = x >= margin && x < (width - margin) && y >= margin && y < (height - margin);

      // Simple centered icon mark
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      const radius = width * 0.38;

      if (dist <= radius) {
        // Center circle / rounded badge
        const isLetterF = (x >= cx - width * 0.22 && x <= cx - width * 0.05 && y >= cy - height * 0.22 && y <= cy + height * 0.22) ||
                         (x >= cx - width * 0.22 && x <= cx + width * 0.02 && y >= cy - height * 0.22 && y <= cy - height * 0.12) ||
                         (x >= cx - width * 0.22 && x <= cx - width * 0.02 && y >= cy - height * 0.04 && y <= cy + height * 0.04);

        const isLetterG = (x >= cx + width * 0.05 && x <= cx + width * 0.24 && y >= cy - height * 0.22 && y <= cy - height * 0.12) ||
                         (x >= cx + width * 0.05 && x <= cx + width * 0.14 && y >= cy - height * 0.22 && y <= cy + height * 0.22) ||
                         (x >= cx + width * 0.05 && x <= cx + width * 0.24 && y >= cy + height * 0.12 && y <= cy + height * 0.22) ||
                         (x >= cx + width * 0.16 && x <= cx + width * 0.24 && y >= cy && y <= cy + height * 0.22) ||
                         (x >= cx + width * 0.10 && x <= cx + width * 0.24 && y >= cy && y <= cy + height * 0.08);

        if (isLetterF || isLetterG) {
          rawData[pxOffset] = rFg;
          rawData[pxOffset + 1] = gFg;
          rawData[pxOffset + 2] = bFg;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = rBg;
          rawData[pxOffset + 1] = gBg;
          rawData[pxOffset + 2] = bBg;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Dark background outer corner
        rawData[pxOffset] = 10;
        rawData[pxOffset + 1] = 10;
        rawData[pxOffset + 2] = 11;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeInt32BE(crc, len + 8);
  return chunk;
}

// Simple CRC32 for PNG chunks
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return crc ^ -1;
}

// Ensure directory
const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 192x192 and 512x512
const png192 = createPng(192, 192, [255, 69, 0], 'FG');
fs.writeFileSync(path.join(iconsDir, 'fg-icon-192.png'), png192);

const png512 = createPng(512, 512, [255, 69, 0], 'FG');
fs.writeFileSync(path.join(iconsDir, 'fg-icon-512.png'), png512);

// Generate favicon.ico (copy 192 png as favicon)
fs.writeFileSync(path.join(__dirname, '..', 'favicon.ico'), png192);

console.log('[Icons] ✅ Generated valid fg-icon-192.png, fg-icon-512.png, and favicon.ico!');
