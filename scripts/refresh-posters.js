// scripts/refresh-posters.js - 强制刷新全部海报为网络最新版
// 用法：node scripts/refresh-posters.js [--dry-run]

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ==================== 配置 ====================
const DATA_DIR = path.join(process.env.APPDATA || '', 'lh-tv');
const POSTER_DIR = path.join(DATA_DIR, 'posters');
const CACHE_FILE = path.join(DATA_DIR, '_poster_cache.json');
const META_FILE = path.join(POSTER_DIR, '_poster_meta.json');
const CATALOG_FILE = path.join(DATA_DIR, '_catalog.json');
const BACKUP_DIR = path.join(DATA_DIR, 'posters_backup_' + Date.now());

const DRY_RUN = process.argv.includes('--dry-run');

// ==================== HTTP 请求 ====================
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const transport = urlObj.protocol === 'https:' ? https : http;
    const req = transport.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/json'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href)
          .then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        resolve({ status: res.statusCode, data: body, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ==================== 海报搜索 ====================
async function searchBingImages(showName, year) {
  const query = encodeURIComponent(`${showName} ${year || ''} 海报`);
  const url = `https://www.bing.com/images/search?q=${query}&first=1&tsc=ImageBasicHover`;

  try {
    const resp = await httpGet(url);
    // 从 HTML 中提取图片 URL
    const imgUrls = [];
    const murlRegex = /murl&quot;:&quot;(https?:\\?\/\\?\/[^&]+\.(?:jpg|jpeg|png|webp))/gi;
    let match;
    while ((match = murlRegex.exec(resp.data)) !== null) {
      let imgUrl = match[1].replace(/\\\//g, '/');
      if (imgUrl.startsWith('http') && !imgUrl.includes('favicon')) {
        imgUrls.push(imgUrl);
      }
    }
    return imgUrls.slice(0, 5); // 最多取 5 个
  } catch (e) {
    return [];
  }
}

async function searchTencentVideo(showName) {
  try {
    const query = encodeURIComponent(showName);
    const url = `https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getPage?video_appid=3000010&vplatform=2`;
    // 腾讯视频搜索 API（简化版）
    const searchUrl = `https://iwan.qq.com/api/search?keyword=${query}&source=pc`;
    const resp = await httpGet(searchUrl);
    if (resp.status === 200 && resp.data) {
      try {
        const json = JSON.parse(resp.data);
        const items = json?.data?.list || json?.list || [];
        for (const item of items) {
          const pic = item.pic || item.cover || item.image || item.poster || '';
          if (pic && pic.startsWith('http')) return pic;
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return null;
}

// ==================== 主流程 ====================
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   LH 影视 — 海报全量刷新工具 v1.0       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log('数据目录:', DATA_DIR);
  console.log('海报目录:', POSTER_DIR);
  console.log('缓存文件:', CACHE_FILE);
  console.log('模式:', DRY_RUN ? '🔍 DRY RUN (仅预览)' : '🔄 执行刷新');
  console.log('');

  // ====== 1. 检查数据目录 ======
  if (!fs.existsSync(DATA_DIR)) {
    console.log('❌ 数据目录不存在:', DATA_DIR);
    console.log('   请先运行一次 LH 影视后再执行此脚本');
    process.exit(1);
  }

  // ====== 2. 备份旧缓存 ======
  if (!DRY_RUN) {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    if (fs.existsSync(CACHE_FILE)) {
      fs.copyFileSync(CACHE_FILE, path.join(BACKUP_DIR, '_poster_cache.json'));
      console.log('✅ 已备份旧缓存 → ' + BACKUP_DIR);
    }
    if (fs.existsSync(META_FILE)) {
      fs.copyFileSync(META_FILE, path.join(BACKUP_DIR, '_poster_meta.json'));
      console.log('✅ 已备份元数据 → ' + BACKUP_DIR);
    }
  }

  // ====== 3. 清除元数据（强制所有海报过期）======
  if (fs.existsSync(META_FILE)) {
    if (!DRY_RUN) {
      fs.unlinkSync(META_FILE);
      console.log('🗑️  已清除海报元数据（所有海报标记为过期）');
    } else {
      console.log('🔍 [DRY] 将清除海报元数据');
    }
  }

  // ====== 4. 读取当前缓存统计 ======
  let currentCache = {};
  let posterFiles = [];
  try {
    if (fs.existsSync(CACHE_FILE)) {
      currentCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
    if (fs.existsSync(POSTER_DIR)) {
      posterFiles = fs.readdirSync(POSTER_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
    }
  } catch (e) {
    console.log('⚠️  读取缓存失败:', e.message);
  }

  const cacheCount = Object.keys(currentCache).length;
  console.log('');
  console.log(`📊 当前海报: ${cacheCount} 条缓存, ${posterFiles.length} 个本地文件`);

  // ====== 5. 读取影视目录获取所有剧名 ======
  let allShows = [];
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
      // 解析目录结构
      if (catalog.shows) {
        allShows = catalog.shows;
      } else if (Array.isArray(catalog)) {
        allShows = catalog;
      }
    }
  } catch (e) {
    console.log('⚠️  读取目录失败，尝试其他来源...');
  }

  // 如果目录为空，尝试从 year-catalog 加载
  if (allShows.length === 0) {
    try {
      const yearCatalogPath = path.join(__dirname, '..', 'out', 'shared-legacy', 'year-catalog.js');
      if (fs.existsSync(yearCatalogPath)) {
        const yearCatalog = require(yearCatalogPath);
        const allTypes = ['tv', 'movie', 'anime'];
        for (const type of allTypes) {
          const cat = yearCatalog.CATALOG[type];
          if (!cat) continue;
          const subs = Object.keys(cat);
          for (const sub of subs) {
            const items = cat[sub];
            if (Array.isArray(items)) {
              for (const item of items) {
                allShows.push({ name: item.name, year: item.year, type, tags: item.tags || [] });
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('⚠️  从 year-catalog 加载失败:', e.message);
    }
  }

  if (allShows.length === 0) {
    console.log('❌ 无法加载影视目录，请先运行一次 LH 影视');
    process.exit(1);
  }
  console.log(`📋 影视目录: ${allShows.length} 部`);

  // ====== 6. 统计需要刷新的条目 ======
  const needRefresh = [];
  for (const show of allShows) {
    if (!show.name) continue;
    const cacheKey = `${show.name}::${show.year || ''}`;
    const cached = currentCache[cacheKey];
    // 只刷新有缓存但可能是旧的，以及没有缓存的
    needRefresh.push(show);
  }

  console.log(`🔄 待刷新: ${needRefresh.length} 部`);

  if (DRY_RUN) {
    console.log('');
    console.log('🔍 DRY RUN 模式 — 不执行实际操作');
    console.log('   示例前 10 部:');
    for (let i = 0; i < Math.min(10, needRefresh.length); i++) {
      console.log(`   ${i + 1}. ${needRefresh[i].name} (${needRefresh[i].year || '-'})`);
    }
    console.log('');
    console.log('   运行 "node scripts/refresh-posters.js" 执行实际刷新');
    process.exit(0);
  }

  // ====== 7. 执行刷新 ======
  console.log('');
  console.log('━━━ 开始刷新海报 ━━━');
  console.log('   策略: 腾讯视频优先 → Bing 图片搜索降级');
  console.log('   间隔: 2 秒/部（避免被限流）');
  console.log('');

  let updated = 0;
  let failed = 0;
  let skipped = 0;
  const batchSize = 50;

  for (let i = 0; i < needRefresh.length; i++) {
    const show = needRefresh[i];
    const cacheKey = `${show.name}::${show.year || ''}`;
    const pct = ((i + 1) / needRefresh.length * 100).toFixed(1);

    try {
      // 1. 尝试腾讯视频 API
      let imageUrl = await searchTencentVideo(show.name);

      // 2. 降级到 Bing
      if (!imageUrl) {
        const bingResults = await searchBingImages(show.name, show.year);
        imageUrl = bingResults[0] || null;
      }

      if (imageUrl) {
        // 验证 URL 可访问
        try {
          const checkResp = await httpGet(imageUrl);
          if (checkResp.status === 200) {
            currentCache[cacheKey] = imageUrl;
            updated++;
            process.stdout.write(`\r  [${pct}%] ✅ ${show.name} → ${imageUrl.substring(0, 60)}...                `);
          } else {
            failed++;
            process.stdout.write(`\r  [${pct}%] ⚠️ ${show.name} → HTTP ${checkResp.status}                    `);
          }
        } catch {
          failed++;
          process.stdout.write(`\r  [${pct}%] ❌ ${show.name} → 无法访问                                  `);
        }
      } else {
        skipped++;
        process.stdout.write(`\r  [${pct}%] 🔍 ${show.name} → 未找到海报                                 `);
      }
    } catch {
      failed++;
    }

    // 每 batchSize 部保存一次
    if ((i + 1) % batchSize === 0) {
      try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(currentCache, null, 2), 'utf-8');
        process.stdout.write(` [已保存]`);
      } catch { /* ignore */ }
    }

    // 限速
    if (i < needRefresh.length - 1) {
      await sleep(2000);
    }
  }

  // 最终保存
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(currentCache, null, 2), 'utf-8');
    console.log('');
    console.log('💾 缓存已保存');
  } catch (e) {
    console.log('⚠️  保存失败:', e.message);
  }

  // ====== 8. 报告 ======
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('           刷新完成！');
  console.log('═══════════════════════════════════════');
  console.log(`   ✅ 已更新: ${updated} 部`);
  console.log(`   ❌ 失败:   ${failed} 部`);
  console.log(`   🔍 未找到: ${skipped} 部`);
  console.log(`   📦 总缓存: ${Object.keys(currentCache).length} 条`);
  console.log(`   💾 备份:   ${BACKUP_DIR}`);
  console.log('');
  console.log('下次启动 LH 影视时将使用新海报');
}

main().catch(e => {
  console.error('脚本异常:', e.message);
  process.exit(1);
});
