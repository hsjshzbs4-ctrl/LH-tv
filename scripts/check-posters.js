// scripts/check-posters.js - 检查所有影视条目海报状态
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHARED = path.join(ROOT, 'electron', 'shared-legacy');

// 1. 加载海报缓存
const cacheFile = path.join(ROOT, 'data', '_poster_cache.json');
let posterCache = {};
try { posterCache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')); } catch (e) {}

// 2. 加载所有目录数据
const yearCatalog = require(path.join(SHARED, 'year-catalog.js'));
const animeCatalog = require(path.join(SHARED, 'anime-catalog.js'));
let jpMovies = [];
let krMovies = [];
try { jpMovies = require(path.join(ROOT, 'jp-movie-catalog.json')); } catch (e) {}
try { krMovies = require(path.join(ROOT, 'kr-movie-catalog.json')); } catch (e) {}

// 3. 收集所有条目
const allShows = [];

// year-catalog 中的条目
const types = ['tv', 'movie', 'anime'];
for (const type of types) {
  const cat = yearCatalog.CATALOG[type];
  if (!cat) continue;
  for (const sub of Object.keys(cat)) {
    for (const item of cat[sub]) {
      allShows.push({ name: item.name, year: item.year, type, sub, source: 'year-catalog' });
    }
  }
}

// anime-catalog 中的条目
for (const item of animeCatalog.HOT_ANIME) {
  allShows.push({ name: item.name, year: item.year, type: 'anime', sub: item.cat, source: 'anime-catalog' });
}

// 日本电影目录
for (const item of jpMovies) {
  allShows.push({ name: item.name, year: null, type: 'movie', sub: 'jp', source: 'jp-movie-catalog' });
}

// 韩国电影目录
for (const item of krMovies) {
  allShows.push({ name: item.name, year: null, type: 'movie', sub: 'kr', source: 'kr-movie-catalog' });
}

// 4. 检查每个条目的海报状态
const missingPosters = [];
const fileMissing = [];
const hasPoster = [];

for (const show of allShows) {
  const cacheKey = show.year ? `${show.name}::${show.year}` : `${show.name}__::`;
  const cachedUrl = posterCache[cacheKey];

  if (!cachedUrl) {
    missingPosters.push(show);
    continue;
  }

  // 检查文件是否存在
  if (cachedUrl.startsWith('file:///')) {
    const filePath = cachedUrl.replace('file:///', '');
    // Windows 路径修正
    const absPath = filePath.replace(/\//g, path.sep);
    if (!fs.existsSync(absPath)) {
      fileMissing.push({ ...show, cachedUrl, filePath: absPath });
      continue;
    }
  }

  hasPoster.push(show);
}

// 5. 输出报告
console.log('═══════════════════════════════════════════');
console.log('  海 报 状 态 检 查 报 告');
console.log('═══════════════════════════════════════════');
console.log('');
console.log(`总条目数: ${allShows.length}`);
console.log(`  ✅ 有海报: ${hasPoster.length} (${(hasPoster.length / allShows.length * 100).toFixed(1)}%)`);
console.log(`  ❌ 缓存缺失: ${missingPosters.length} (${(missingPosters.length / allShows.length * 100).toFixed(1)}%)`);
console.log(`  ⚠️  缓存存在但文件缺失: ${fileMissing.length}`);
console.log('');

// 按类型/模块分类缺失
console.log('--- 按模块分类的缓存缺失详情 ---');
const modules = [
  { label: '📺 电视剧', filter: s => s.type === 'tv' },
  { label: '🎬 电影 (year-catalog)', filter: s => s.type === 'movie' && s.source === 'year-catalog' },
  { label: '🎌 动漫 (year-catalog)', filter: s => s.type === 'anime' && s.source === 'year-catalog' },
  { label: '🎌 动漫 (anime-catalog)', filter: s => s.source === 'anime-catalog' },
  { label: '🇯🇵 日本电影 (外部)', filter: s => s.source === 'jp-movie-catalog' },
  { label: '🇰🇷 韩国电影 (外部)', filter: s => s.source === 'kr-movie-catalog' },
];

for (const mod of modules) {
  const miss = missingPosters.filter(mod.filter);
  const total = allShows.filter(mod.filter);
  if (total.length === 0) continue;
  console.log(`\n  ${mod.label}: ${miss.length}/${total.length} 缺失`);

  // 按子分类分组
  if (miss.length > 0 && miss.length <= 50) {
    const bySub = {};
    for (const s of miss) {
      const sub = s.sub || '(无)';
      if (!bySub[sub]) bySub[sub] = [];
      bySub[sub].push(s);
    }
    for (const [sub, items] of Object.entries(bySub)) {
      console.log(`    ${sub}: ${items.length} 部`);
      for (const item of items.slice(0, 10)) {
        console.log(`      - ${item.name}${item.year ? ' (' + item.year + ')' : ''}`);
      }
      if (items.length > 10) console.log(`      ... 还有 ${items.length - 10} 部`);
    }
  } else if (miss.length > 50) {
    const bySub = {};
    for (const s of miss) {
      const sub = s.sub || '(无)';
      if (!bySub[sub]) bySub[sub] = 0;
      bySub[sub]++;
    }
    for (const [sub, count] of Object.entries(bySub)) {
      console.log(`    ${sub}: ${count} 部`);
    }
  }
}

// 文件缺失详情
if (fileMissing.length > 0) {
  console.log(`\n⚠️  缓存存在但海报文件缺失 (${fileMissing.length} 部):`);
  for (const s of fileMissing.slice(0, 20)) {
    console.log(`  - ${s.name}${s.year ? ' (' + s.year + ')' : ''}`);
  }
  if (fileMissing.length > 20) console.log(`  ... 还有 ${fileMissing.length - 20} 部`);
}

// 统计会显示首字占位的条目（缓存缺失的会在 UI 中显示首字）
console.log(`\n═══════════════════════════════════════════`);
console.log(`总结: ${missingPosters.length + fileMissing.length} 部影视将在 UI 中以「首字」占位显示`);
console.log(`═══════════════════════════════════════════`);
