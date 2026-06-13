// scripts/generate-icon.js - 生成 LH 影视图标
// 纯 Node.js，无需额外依赖。生成 256x256 PNG + ICO

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const SIZE = 256;
const RESOURCES = path.join(__dirname, '..', 'resources');

if (!fs.existsSync(RESOURCES)) fs.mkdirSync(RESOURCES, { recursive: true });

// ============ 像素数据生成 ============

// 颜色定义
const BG = [0x0a, 0x0a, 0x0f];        // 暗色背景
const ACCENT = [0xe8, 0xa8, 0x50];     // 暖金色
const ACCENT2 = [0xf0, 0xb8, 0x60];    // 亮金色
const SHADOW = [0x06, 0x06, 0x0a];     // 阴影

function blend(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ];
}

function drawCircle(buf, cx, cy, r, color) {
  for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(SIZE, Math.ceil(cy + r)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(SIZE, Math.ceil(cx + r)); x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < r) {
        // 抗锯齿边缘
        const alpha = dist > r - 1 ? r - dist : 1;
        const idx = (y * SIZE + x) * 3;
        buf[idx] = Math.round(buf[idx] + (color[0] - buf[idx]) * alpha);
        buf[idx + 1] = Math.round(buf[idx + 1] + (color[1] - buf[idx + 1]) * alpha);
        buf[idx + 2] = Math.round(buf[idx + 2] + (color[2] - buf[idx + 2]) * alpha);
      }
    }
  }
}

// 背景
const rawData = Buffer.alloc(SIZE * SIZE * 3);
for (let i = 0; i < SIZE * SIZE * 3; i += 3) {
  rawData[i] = BG[0];
  rawData[i + 1] = BG[1];
  rawData[i + 2] = BG[2];
}

// 渐变色圆环
const cx = SIZE / 2, cy = SIZE / 2;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // 外圈：金色圆环
    if (dist > SIZE * 0.32 && dist < SIZE * 0.44) {
      const t = (dist - SIZE * 0.32) / (SIZE * 0.12);
      const glow = Math.sin(angle * 2 + Math.PI / 4) * 0.2 + 0.8;
      const c = blend(ACCENT, ACCENT2, glow);
      const idx = (y * SIZE + x) * 3;
      const alpha = (dist > SIZE * 0.43 || dist < SIZE * 0.33) ? 0.6 : 1;
      rawData[idx] = Math.round(rawData[idx] + (c[0] - rawData[idx]) * alpha);
      rawData[idx + 1] = Math.round(rawData[idx + 1] + (c[1] - rawData[idx + 1]) * alpha);
      rawData[idx + 2] = Math.round(rawData[idx + 2] + (c[2] - rawData[idx + 2]) * alpha);
    }

    // 内圈填充
    if (dist < SIZE * 0.30) {
      const t = dist / (SIZE * 0.30);
      const c = blend([0x1a, 0x1a, 0x24], [0x2a, 0x2a, 0x3a], t);
      const idx = (y * SIZE + x) * 3;
      rawData[idx] = Math.round(rawData[idx] + (c[0] - rawData[idx]) * 0.85);
      rawData[idx + 1] = Math.round(rawData[idx + 1] + (c[1] - rawData[idx + 1]) * 0.85);
      rawData[idx + 2] = Math.round(rawData[idx + 2] + (c[2] - rawData[idx + 2]) * 0.85);
    }
  }
}

// 画 LH 字母形状（简化）
function drawLetter(buf, x0, y0, letter, color, scale) {
  const s = scale || 1;
  // 字模：7x5 的简化字母
  const glyphs = {
    'L': [
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,1],
    ],
    'H': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ]
  };

  const glyph = glyphs[letter];
  if (!glyph) return;

  const pw = 5, ph = 7; // 字形宽高
  const cellW = 18 * s, cellH = 18 * s;
  const startX = x0 - (pw * cellW) / 2;
  const startY = y0 - (ph * cellH) / 2;

  for (let gy = 0; gy < ph; gy++) {
    for (let gx = 0; gx < pw; gx++) {
      if (!glyph[gy][gx]) continue;
      const px = Math.round(startX + gx * cellW);
      const py = Math.round(startY + gy * cellH);
      // 画一个圆角矩形像素块
      for (let dy = 0; dy < cellH; dy++) {
        for (let dx = 0; dx < cellW; dx++) {
          const x = px + dx, y = py + dy;
          if (x < 4 || y < 4 || x >= SIZE - 4 || y >= SIZE - 4) continue;
          const idx = (y * SIZE + x) * 3;
          rawData[idx] = color[0];
          rawData[idx + 1] = color[1];
          rawData[idx + 2] = color[2];
        }
      }
    }
  }
}

// 在中央画 "L H" 两个字母
const letterScale = 1.45;
const spacing = 90 * letterScale;
const letterY = cx + 5;
drawLetter(rawData, cx - spacing / 2, letterY, 'L', [0xe8, 0xa8, 0x50], letterScale);
drawLetter(rawData, cx + spacing / 2, letterY, 'H', [0xe8, 0xa8, 0x50], letterScale);

// ============ PNG 编码 ============

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function createPNG(width, height, rawRGB) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT: 每行加 filter byte (0 = None)
  const rowSize = 1 + width * 3;
  const filtered = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    filtered[y * rowSize] = 0; // filter: None
    rawRGB.copy(filtered, y * rowSize + 1, y * width * 3, (y + 1) * width * 3);
  }
  const compressed = zlib.deflateSync(filtered, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// ============ ICO 编码（Windows 图标）============

function createICO(pngData) {
  const pngSize = pngData.length;

  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: ICO
  header.writeUInt16LE(1, 4);      // count: 1 image

  // ICO entry
  const entry = Buffer.alloc(16);
  entry[0] = SIZE >= 256 ? 0 : SIZE;  // width (0 = 256)
  entry[1] = SIZE >= 256 ? 0 : SIZE;  // height (0 = 256)
  entry[2] = 0;                        // palette
  entry[3] = 0;                        // reserved
  entry.writeUInt16LE(1, 4);          // planes
  entry.writeUInt16LE(32, 6);         // bpp
  entry.writeUInt32LE(pngSize, 8);    // size
  entry.writeUInt32LE(22, 12);        // offset (6 header + 16 entry)

  return Buffer.concat([header, entry, pngData]);
}

// ============ 生成 ============

console.log('正在生成图标...');

// 256x256 PNG
const png256 = createPNG(SIZE, SIZE, rawData);
const pngPath = path.join(RESOURCES, 'icon.png');
fs.writeFileSync(pngPath, png256);
console.log(`  ✓ ${pngPath} (${(png256.length / 1024).toFixed(1)} KB)`);

// 64x64 小尺寸（缩放）
const smallRaw = Buffer.alloc(64 * 64 * 3);
for (let y = 0; y < 64; y++) {
  for (let x = 0; x < 64; x++) {
    const sx = Math.floor(x * SIZE / 64);
    const sy = Math.floor(y * SIZE / 64);
    const src = (sy * SIZE + sx) * 3;
    const dst = (y * 64 + x) * 3;
    smallRaw[dst] = rawData[src];
    smallRaw[dst + 1] = rawData[src + 1];
    smallRaw[dst + 2] = rawData[src + 2];
  }
}
const png64 = createPNG(64, 64, smallRaw);
const png64Path = path.join(RESOURCES, 'icon-64.png');
fs.writeFileSync(png64Path, png64);
console.log(`  ✓ ${png64Path} (${(png64.length / 1024).toFixed(1)} KB)`);

// ICO (Windows 图标)
const icoData = createICO(png256);
const icoPath = path.join(RESOURCES, 'icon.ico');
fs.writeFileSync(icoPath, icoData);
console.log(`  ✓ ${icoPath} (${(icoData.length / 1024).toFixed(1)} KB)`);

// 也复制一份到 build 资源
const buildIcoPath = path.join(__dirname, '..', 'build', 'icon.ico');
const buildDir = path.dirname(buildIcoPath);
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(buildIcoPath, icoData);
console.log(`  ✓ ${buildIcoPath}`);

console.log('图标生成完成！');
