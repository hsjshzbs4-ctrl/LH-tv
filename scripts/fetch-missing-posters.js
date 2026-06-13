// scripts/fetch-missing-posters.js - 增量抓取缺失海报
// 使用 poster-fetcher 模块（Puppeteer + Edge），自动搜索并下载缺失海报
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHARED = path.join(ROOT, 'electron', 'shared-legacy');

// 加载 poster-fetcher 模块
const posterFetcher = require(path.join(SHARED, 'poster-fetcher.js'));
const yearCatalog = require(path.join(SHARED, 'year-catalog.js'));
const animeCatalog = require(path.join(SHARED, 'anime-catalog.js'));
let jpMovies = [];
let krMovies = [];
try { jpMovies = require(path.join(ROOT, 'jp-movie-catalog.json')); } catch (e) {}
try { krMovies = require(path.join(ROOT, 'kr-movie-catalog.json')); } catch (e) {}

// 收集全部条目
const allShows = [];

for (const type of ['tv', 'movie', 'anime']) {
  const cat = yearCatalog.CATALOG[type];
  if (!cat) continue;
  for (const sub of Object.keys(cat)) {
    for (const item of cat[sub]) {
      allShows.push({
        name: item.name,
        year: item.year ? Number(item.year) : undefined,
        type,
        tags: item.tags || []
      });
    }
  }
}

for (const item of animeCatalog.HOT_ANIME) {
  allShows.push({
    name: item.name,
    year: item.year ? Number(item.year) : undefined,
    type: 'anime',
    tags: item.tags || []
  });
}

for (const item of jpMovies) {
  allShows.push({ name: item.name, year: undefined, type: 'movie', tags: [] });
}
for (const item of krMovies) {
  allShows.push({ name: item.name, year: undefined, type: 'movie', tags: [] });
}

// 去重
const seen = new Set();
const uniqueShows = [];
for (const s of allShows) {
  const key = `${s.name}::${s.year || ''}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueShows.push(s);
  }
}

// 过滤：只保留没有缓存海报的
const needFetch = [];
for (const show of uniqueShows) {
  const cached = posterFetcher.getCachedPoster(show.name, show.year);
  if (!cached) {
    needFetch.push(show);
  }
}

console.log('═══════════════════════════════════════════');
console.log('  海 报 增 量 抓 取');
console.log('═══════════════════════════════════════════');
console.log(`总条目 (去重): ${uniqueShows.length}`);
console.log(`已有海报: ${uniqueShows.length - needFetch.length}`);
console.log(`需抓取: ${needFetch.length}`);
console.log('');

if (needFetch.length === 0) {
  console.log('✅ 所有海报已就绪');
  process.exit(0);
}

// 按类型统计
const byType = {};
for (const s of needFetch) {
  byType[s.type] = (byType[s.type] || 0) + 1;
}
console.log('需抓取分布:', JSON.stringify(byType));
console.log('');

console.log('开始批量抓取 (间隔 800ms，并发 3)...');
console.log('将打开 Edge 浏览器搜索海报，请勿关闭浏览器窗口...\n');

const startTime = Date.now();
let lastLog = 0;

function onProgress(current, total, name, hasUrl) {
  const now = Date.now();
  if (now - lastLog > 2000 || current >= total) {
    const pct = total > 0 ? (current / total * 100).toFixed(1) : 0;
    const elapsed = ((now - startTime) / 1000).toFixed(0);
    const rate = elapsed > 0 ? (current / Math.max(Number(elapsed), 1)).toFixed(1) : '0';
    console.log(`  [${current}/${total}] ${pct}% | ${rate}部/秒 | ${hasUrl ? '✅' : '❌'} ${name || ''}`);
    lastLog = now;
  }
}

posterFetcher.batchFetchPosters(needFetch, onProgress, 800)
  .then((results) => {
    const fetched = Object.keys(results).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`\n✅ 完成！成功 ${fetched}/${needFetch.length} 部，耗时 ${elapsed}s`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 出错了:', err.message);
    process.exit(1);
  });
