// scripts/copy-shared.js - 将 shared-legacy 复制到 out/ 目录（打包时需要）
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'electron', 'shared-legacy');
const dest = path.join(__dirname, '..', 'out', 'shared-legacy');

// 递归复制
function copyDir(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(src)) {
  // 清理旧文件
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyDir(src, dest);
  console.log('[copy-shared] shared-legacy -> out/shared-legacy');
} else {
  console.log('[copy-shared] WARNING: electron/shared-legacy not found');
}

// 也复制 catalog JSON 文件到 out/
const rootFiles = ['jp-movie-catalog.json', 'kr-movie-catalog.json'];
for (const f of rootFiles) {
  const sf = path.join(__dirname, '..', f);
  const df = path.join(__dirname, '..', 'out', f);
  if (fs.existsSync(sf)) {
    fs.copyFileSync(sf, df);
    console.log('[copy-shared] ' + f + ' -> out/' + f);
  }
}
