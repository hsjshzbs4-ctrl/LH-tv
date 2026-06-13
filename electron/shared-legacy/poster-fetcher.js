// poster-fetcher.js — 影视海报爬取模块
// 使用 Microsoft Edge 浏览器，从 Bing 图片搜索获取海报 URL
// 运行在 Electron 主进程（Node.js 环境）

const fs = require('fs');
const path = require('path');
const { getDataPath, ensureDir } = require('./data-paths.js');

// puppeteer-core 是 ESM 模块，需要动态 import
let puppeteerModule = null;

async function getPuppeteer() {
    if (!puppeteerModule) {
        puppeteerModule = await import('puppeteer-core');
    }
    return puppeteerModule;
}

// Edge 浏览器路径
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// 海报缓存文件（使用可写数据目录，避免 asar 只读问题）
var CACHE_FILE = getDataPath('_poster_cache.json');
// 海报本地存储目录
var POSTER_DIR = getDataPath('posters');
ensureDir(POSTER_DIR);

// 海报缓存 { "showName::year": "imageUrl", ... }
var posterCache = {};

// 是否正在运行
var isRunning = false;
var shouldStop = false;

// ==================== 缓存管理 ====================

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            posterCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            console.log('[海报] 缓存已加载:', Object.keys(posterCache).length, '条');
            // 自动修复：检测并修正因项目搬家导致的 file:// 路径失效
            autoFixLocalPaths();
        }
    } catch (e) {
        posterCache = {};
    }
}

/**
 * 自动修复缓存中的本地文件路径
 * 当项目目录迁移（如 E: → D:）时，自动更新 file:// 路径为当前 POSTER_DIR
 * 同时清理指向不存在文件的过期条目
 */
function autoFixLocalPaths() {
    var keys = Object.keys(posterCache);
    var fixedCount = 0;
    var removedCount = 0;

    for (var i = 0; i < keys.length; i++) {
        var url = posterCache[keys[i]];
        // 只处理本地 file:// 路径
        if (!url || url.indexOf('file:///') !== 0) continue;

        // 从缓存 URL 中提取文件名（路径最后一段）
        var cachedPath = url.replace('file:///', '');
        // Windows: 转换 file:///D:/path/file.jpg → D:/path/file.jpg
        var fileName = path.basename(cachedPath);

        // 在当前 POSTER_DIR 下查找同名文件
        var currentPath = path.join(POSTER_DIR, fileName);

        if (fs.existsSync(currentPath)) {
            try {
                if (fs.statSync(currentPath).size > 0) {
                    var correctUrl = 'file:///' + currentPath.replace(/\\/g, '/');
                    if (url !== correctUrl) {
                        posterCache[keys[i]] = correctUrl;
                        fixedCount++;
                    }
                } else {
                    // 0 字节文件，删除并清除缓存
                    fs.unlinkSync(currentPath);
                    delete posterCache[keys[i]];
                    removedCount++;
                }
            } catch (e2) {
                // 无法读取，保留原样
            }
        } else if (!fs.existsSync(cachedPath)) {
            // 文件在当前路径和缓存路径都不存在 → 过期条目，清除
            delete posterCache[keys[i]];
            removedCount++;
        }
    }

    // 第二轮：远程 URL 重新尝试下载到本地（限流：最多重试 10 个）
    var retryDownloadCount = 0;
    var MAX_RETRY = 10;
    for (var j = 0; j < keys.length && retryDownloadCount < MAX_RETRY; j++) {
        var remoteUrl = posterCache[keys[j]];
        // 只处理远程 URL（尚未本地化的）
        if (!remoteUrl || remoteUrl.indexOf('file:///') === 0) continue;
        if (remoteUrl.indexOf('http') !== 0) continue;
        var parts = keys[j].split('::');
        // 异步重新下载，不阻塞，间隔 2 秒避免洪泛
        var delayMs = retryDownloadCount * 2000;
        retryDownloadCount++;
        (function (name, year, url, delay) {
            setTimeout(function () {
                downloadToLocal(name, year, url);
            }, delay);
        })(parts[0], parts[1] || '', remoteUrl, delayMs);
    }

    if (fixedCount > 0 || removedCount > 0 || retryDownloadCount > 0) {
        console.log('[海报] 路径修复:', fixedCount, '条, 清除过期:', removedCount, '条, 重试下载:', retryDownloadCount, '条');
        saveCache();
    }
}

// 防抖保存计时器 — 避免多异步竞态同时写文件导致数据丢失
var _saveTimer = null;

function saveCache() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
        try {
            var dir = path.dirname(CACHE_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(CACHE_FILE, JSON.stringify(posterCache, null, 2), 'utf-8');
        } catch (e) {
            console.log('[海报] 缓存保存失败:', e.message);
        }
    }, 500);  // 500ms 防抖窗口，多次调用合并为一次写入
}

function getCacheKey(showName, year) {
    return (showName || '') + '::' + (year || '');
}

function getCachedPoster(showName, year) {
    return posterCache[getCacheKey(showName, year)] || null;
}

/**
 * 按名称搜索缓存海报（忽略年份）
 * 当 name::year 精确匹配失败时，尝试匹配任意年份的同一剧名
 * @param {string} showName - 剧名
 * @returns {string|null} 海报URL
 */
function searchPosterByName(showName) {
    if (!showName) return null;
    var keys = Object.keys(posterCache);
    // 精确前缀：name:: 开头
    var prefix = showName + '::';
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(prefix) === 0) {
            return posterCache[keys[i]];
        }
    }
    // 降级：name 不在开头但包含（如"无职转生 第二季" vs "无职转生::2024"）
    var normalized = showName.replace(/\s+/g, '');
    for (var j = 0; j < keys.length; j++) {
        var keyName = keys[j].split('::')[0].replace(/\s+/g, '');
        if (keyName.indexOf(normalized) === 0 || normalized.indexOf(keyName) === 0) {
            return posterCache[keys[j]];
        }
    }
    return null;
}

// 海报元数据（缓存 fetch 时间，支持增量更新）
var POSTER_META_FILE = path.join(POSTER_DIR, '_poster_meta.json');
var posterMeta = {};  // { cacheKey: { fetchedAt: timestamp, source: 'tencent'|'ddg'|'import' } }
var POSTER_REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 天内不重新抓取

function loadPosterMeta() {
    try {
        if (fs.existsSync(POSTER_META_FILE)) {
            posterMeta = JSON.parse(fs.readFileSync(POSTER_META_FILE, 'utf-8')) || {};
        }
    } catch (e) { posterMeta = {}; }
}

function savePosterMeta() {
    try {
        fs.writeFileSync(POSTER_META_FILE, JSON.stringify(posterMeta, null, 2), 'utf-8');
    } catch (e) {}
}

function recordPosterFetch(showName, year, source) {
    var key = getCacheKey(showName, year);
    posterMeta[key] = {
        fetchedAt: Date.now(),
        source: source || 'unknown'
    };
    // 延迟保存（减少 I/O）
    if (_metaTimer) clearTimeout(_metaTimer);
    _metaTimer = setTimeout(savePosterMeta, 2000);
}
var _metaTimer = null;

function isPosterFresh(showName, year) {
    var key = getCacheKey(showName, year);
    var meta = posterMeta[key];
    if (!meta) return false;
    // 检查是否在刷新间隔内
    if ((Date.now() - meta.fetchedAt) < POSTER_REFRESH_INTERVAL) {
        // 还需要检查海报文件是否仍然存在
        var cached = posterCache[key];
        if (cached && cached.indexOf('file:///') === 0) {
            var fp = cached.replace('file:///', '');
            try { if (fs.existsSync(fp) && fs.statSync(fp).size > 0) return true; } catch (e) {}
        }
    }
    return false;
}

function setCachedPoster(showName, year, url) {
    if (!url) return;
    var cacheKey = getCacheKey(showName, year);
    var existing = posterCache[cacheKey];
    // 如果已有有效本地文件，不覆盖（远程URL下载可能失败导致降级）
    if (existing && existing.indexOf('file:///') === 0) {
        var fp = existing.replace('file:///', '');
        try { if (fs.existsSync(fp) && fs.statSync(fp).size > 0) return; } catch (e) {}
    }
    posterCache[cacheKey] = url;
    recordPosterFetch(showName, year, 'api');
    // 异步下载到本地文件夹
    downloadToLocal(showName, year, url);
}

var httpsModule = require('https');
var httpModule = require('http');

// 确保海报目录存在（只初始化一次）
function ensurePosterDir() {
    if (!fs.existsSync(POSTER_DIR)) {
        fs.mkdirSync(POSTER_DIR, { recursive: true });
    }
}
try { ensurePosterDir(); } catch (e) {
    console.error('[海报] 目录创建失败:', e.message);
}

// 异步下载海报到本地文件夹
function downloadToLocal(showName, year, url, _redirectCount) {
    if (!url || !url.startsWith('http')) return;
    var redirectCount = _redirectCount || 0;
    if (redirectCount > 5) return;

    var cacheKey = getCacheKey(showName, year);
    var safeName = cacheKey.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 80);
    var filePath = path.join(POSTER_DIR, safeName + '.png');
    var localUrl = 'file:///' + safeName + '.png';

    // 用 statSync 一次搞定：检查存在 + 检查大小
    try {
        var stat = fs.statSync(filePath);
        if (stat.size > 0) {
            if (posterCache[cacheKey] !== localUrl) {
                posterCache[cacheKey] = localUrl;
                saveCache();
            }
            return;
        }
        // 0 字节，删掉重下
        fs.unlinkSync(filePath);
    } catch (e) { /* 文件不存在，继续下载 */ }

    var parsedUrl = new URL(url);
    var transport = parsedUrl.protocol === 'https:' ? httpsModule : httpModule;

    // 针对不同CDN使用正确的Referer，防止防盗链403
    var referer = parsedUrl.protocol + '//' + parsedUrl.hostname + '/';
    if (parsedUrl.hostname && parsedUrl.hostname.indexOf('doubanio.com') !== -1) {
        referer = 'https://movie.douban.com/';
    } else if (parsedUrl.hostname && parsedUrl.hostname.indexOf('qpic.cn') !== -1) {
        referer = 'https://v.qq.com/';
    } else if (parsedUrl.hostname && parsedUrl.hostname.indexOf('iqiyipic.com') !== -1) {
        referer = 'https://www.iqiyi.com/';
    } else if (parsedUrl.hostname && (parsedUrl.hostname.indexOf('ykimg.com') !== -1)) {
        referer = 'https://www.youku.com/';
    }

    var reqOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': referer,
            'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8'
        }
    };

    try {
        var file = fs.createWriteStream(filePath);
        // 立即注册 error 处理器，防止 WriteStream 异步构造时的错误成为未捕获异常
        file.on('error', function () {
            try { file.close(); } catch (e3) {}
            try { fs.unlinkSync(filePath); } catch (e4) {}
        });

        var request = transport.get(reqOptions, function (res) {
            if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
                file.close();
                var location = res.headers.location;
                if (location) {
                    if (Array.isArray(location)) location = location[0];
                    var redirectUrl = new URL(location, url).href;
                    downloadToLocal(showName, year, redirectUrl, redirectCount + 1);
                }
                return;
            }
            if (res.statusCode === 200) {
                res.pipe(file);
                file.on('finish', function () {
                    file.close();
                    try {
                        if (fs.statSync(filePath).size > 0) {
                            posterCache[cacheKey] = localUrl;
                            saveCache();
                        } else { fs.unlinkSync(filePath); }
                    } catch (e2) {}
                });
            } else {
                file.close();
                try { fs.unlinkSync(filePath); } catch (e5) {}
            }
        });
        request.on('error', function () {
            file.close();
            try { fs.unlinkSync(filePath); } catch (e5) {}
        });
        request.on('timeout', function () {
            request.destroy();
            file.close();
            try { fs.unlinkSync(filePath); } catch (e6) {}
        });
    } catch (e) { /* 下载失败不影响主流程 */ }
}

// ==================== 浏览器实例 + Page 池 ====================

var browser = null;
var browserLaunchPromise = null; // 防止并发启动多个浏览器
var pagePool = [];
var MAX_POOL_SIZE = 3; // 海报搜索并行度

async function getBrowser() {
    if (browser && typeof browser.isConnected === 'function' && browser.isConnected()) return browser;

    // 如果已有启动中的 Promise，等待它完成（防止并发启动多个浏览器实例）
    if (browserLaunchPromise) return browserLaunchPromise;

    console.log('[海报] 启动 Edge 浏览器...');
    browserLaunchPromise = (async function () {
        var puppeteer = await getPuppeteer();
        browser = await puppeteer.launch({
            headless: true,
            executablePath: EDGE_PATH,
            userDataDir: 'D:/L-H/puppeteer-data',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
                '--mute-audio'
            ]
        });
        browserLaunchPromise = null;
        return browser;
    })();

    return browserLaunchPromise;
}

// Page 池：复用 Page，避免反复创建/销毁
async function getPageFromPool() {
    while (pagePool.length > 0) {
        var pg = pagePool.pop();
        try {
            await pg.goto('about:blank');
            return pg;
        } catch (e) {
            pg.close().catch(function () {});
        }
    }
    var browserInstance = await getBrowser();
    var page = await browserInstance.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0');
    await page.setViewport({ width: 1366, height: 768 });
    return page;
}

function returnPageToPool(page) {
    if (pagePool.length < MAX_POOL_SIZE) {
        pagePool.push(page);
    } else {
        page.close().catch(function () {});
    }
}

/**
 * 从腾讯视频搜索页直接获取官方封面海报
 * @param {string} showName - 剧名
 * @returns {Promise<string|null>} 全尺寸封面URL
 */
async function fetchFromTencentVideo(showName) {
    var searchUrl = 'https://v.qq.com/x/search/?q=' + encodeURIComponent(showName);
    var page = null;
    try {
        var browserInstance = await getBrowser();
        page = await browserInstance.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        // 等待搜索结果渲染（puppeteer v25 无 waitForTimeout）
        await new Promise(function (resolve) { setTimeout(resolve, 3000); });
        await page.waitForSelector('img', { timeout: 5000 }).catch(function () {});

        var bestUrl = await page.evaluate(function () {
            var imgs = document.querySelectorAll('img');
            for (var i = 0; i < imgs.length; i++) {
                var src = imgs[i].src || '';
                // 匹配 vcover_vt_pic（竖版封面）或 vcover_hz_pic（横版封面）
                var match = src.match(/(vcover-(?:vt|hz)-pic\.puui\.qpic\.cn\/vcover_\w+_pic\/0\/[a-z0-9]+)\//);
                if (match && !src.includes('blank')) {
                    return 'https://' + match[1] + '/0';
                }
            }
            return '';
        });

        if (page) await page.close();
        page = null;

        if (bestUrl) {
            console.log('[海报] 腾讯视频 ✓', showName, bestUrl.substring(0, 70) + '...');
            return bestUrl;
        }
        return null;
    } catch (e) {
        console.log('[海报] 腾讯视频 ✗', showName, e.message);
        if (page) { try { await page.close(); } catch (e2) {} }
        return null;
    }
}

/**
 * 从豆瓣搜索获取官方海报（海报质量和主流平台一致）
 * @param {string} showName - 剧名
 * @param {string} year - 年份（可选，用于精确匹配）
 * @returns {Promise<string|null>} 全尺寸海报URL
 */
async function fetchFromDouban(showName, year) {
    var searchText = showName + (year ? ' ' + year : '');
    var searchUrl = 'https://search.douban.com/movie/subject_search?search_text=' + encodeURIComponent(searchText);
    var page = null;
    try {
        page = await getPageFromPool();
        await page.setRequestInterception(true);
        var reqHandler = function (req) {
            try {
                var resType = req.resourceType();
                if (resType === 'image' || resType === 'document' || resType === 'xhr' || resType === 'fetch') {
                    req.continue();
                } else {
                    req.abort();
                }
            } catch (e) {
                // 页面池复用可能导致请求已被处理，忽略即可
            }
        };
        page.on('request', reqHandler);

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(function (resolve) { setTimeout(resolve, 2000); });
        // 等待搜索结果加载
        await page.waitForSelector('.sc-bZQynM, .item-root, .result', { timeout: 5000 }).catch(function () {});

        var bestUrl = await page.evaluate(function () {
            // 豆瓣搜索页面的海报图片（多种选择器适配）
            var selectors = [
                '.sc-bZQynM img',        // 新版豆瓣搜索
                '.item-root .cover img', // 旧版豆瓣
                '.result .pic img',      // 备用
                '.item .poster img'      // 备用
            ];

            var imgs = [];
            for (var s = 0; s < selectors.length; s++) {
                var els = document.querySelectorAll(selectors[s]);
                for (var i = 0; i < els.length; i++) {
                    var src = els[i].src || els[i].getAttribute('data-src') || '';
                    if (src && src.indexOf('doubanio.com') !== -1 && src.indexOf('/view/photo/') !== -1) {
                        // 将缩略图URL转为大图URL
                        // 缩略图: img1.doubanio.com/view/photo/s_ratio_poster/public/pXXXXX.jpg
                        // 大图:   img1.doubanio.com/view/photo/l/public/pXXXXX.jpg
                        var largeUrl = src.replace(/view\/photo\/[^\/]+\/public/, 'view/photo/l/public');
                        imgs.push(largeUrl);
                    }
                }
            }
            // 如果没找到 doubanio.com 的图，降级获取任意 img
            if (imgs.length === 0) {
                for (var s2 = 0; s2 < selectors.length; s2++) {
                    var els2 = document.querySelectorAll(selectors[s2]);
                    for (var j = 0; j < els2.length; j++) {
                        var src2 = els2[j].src || els2[j].getAttribute('data-src') || '';
                        if (src2 && src2.indexOf('http') === 0 && src2.indexOf('icon') === -1) {
                            imgs.push(src2);
                        }
                    }
                }
            }
            return imgs.length > 0 ? imgs[0] : '';
        });

        try { page.off('request', reqHandler); } catch (e) {}
        returnPageToPool(page);
        page = null;

        if (bestUrl) {
            console.log('[海报] 豆瓣 ✓', showName, year, bestUrl.substring(0, 70) + '...');
            return bestUrl;
        }
        return null;
    } catch (e) {
        console.log('[海报] 豆瓣 ✗', showName, e.message);
        if (page) {
            try { page.off('request', function () {}); returnPageToPool(page); } catch (e2) {}
        }
        return null;
    }
}

async function closeBrowser() {
    if (browser) {
        try { await browser.close(); } catch (e) {}
        browser = null;
        console.log('[海报] 浏览器已关闭');
    }
}

// ==================== 超时包装器 ====================

/**
 * 给异步操作添加硬超时，防止 Puppeteer 页面导航在网络异常时无限挂起
 * @param {Promise} promise - 异步操作
 * @param {number} ms - 超时毫秒
 * @param {*} fallback - 超时后返回的默认值
 * @returns {Promise}
 */
function withHardTimeout(promise, ms, fallback) {
    return Promise.race([
        promise,
        new Promise(function (resolve) {
            setTimeout(function () { resolve(fallback); }, ms);
        })
    ]);
}

// ==================== 海报搜索策略 ====================

// 域名评分：三大平台官方 CDN 优先，豆瓣次之，其他兜底
var DOMAIN_SCORES = {
    'puui.qpic.cn': 90,
    'iqiyipic.com': 88,
    'ykimg.com': 88,
    'vthumb.ykimg.com': 88,
    'm.ykimg.com': 88,
    'hdslb.com': 85,
    'i0.hdslb.com': 85,
    'i1.hdslb.com': 85,
    'i2.hdslb.com': 85,
    'doubanio.com': 82,
    'douban.com': 80,
    'img3.doubanio.com': 85,
    'img1.doubanio.com': 85,
    'img2.doubanio.com': 85,
    'img9.doubanio.com': 85,
    'wikipedia.org': 75,
    'wikimedia.org': 75,
    'tmdb.org': 80,
    'goldposter.com': 75,
    'sinaimg.cn': 65,
    'huaban.com': 50,
    'bing.com': 0,
    'th.bing.com': 0
};

// 按类型定制的搜索后缀
var TYPE_SEARCH_SUFFIX = {
    'anime': '动漫 海报 封面',
    'tv': '电视剧 海报 封面',
    'movie': '电影 海报 封面'
};

// 平台标签→搜索关键词+域名匹配
var PLATFORM_KEYWORDS = {
    '腾讯视频': { keyword: '腾讯视频', domain: 'puui.qpic.cn' },
    '爱奇艺': { keyword: '爱奇艺', domain: 'iqiyipic.com' },
    '优酷': { keyword: '优酷', domain: 'ykimg.com' },
    'B站': { keyword: 'B站 动漫', domain: 'hdslb.com' },
    '哔哩哔哩': { keyword: 'B站 动漫', domain: 'hdslb.com' },
    'Netflix': { keyword: 'Netflix', domain: 'netflix.com' }
};

/**
 * 为图片 URL 打分（值越高越可靠）
 */
function scoreImageUrl(url, type, tags) {
    var urlLower = (url || '').toLowerCase();
    var score = 20; // 基础分

    // 域名匹配
    var domainKeys = Object.keys(DOMAIN_SCORES);
    for (var d = 0; d < domainKeys.length; d++) {
        if (urlLower.indexOf(domainKeys[d]) !== -1) {
            score = Math.max(score, DOMAIN_SCORES[domainKeys[d]]);
            break;
        }
    }

    // 平台加分：tags 匹配到对应平台域名
    if (tags && tags.length > 0) {
        for (var t = 0; t < tags.length; t++) {
            var plat = PLATFORM_KEYWORDS[tags[t]];
            if (plat && urlLower.indexOf(plat.domain) !== -1) {
                score += 15;
                break;
            }
        }
    }

    // 类型关键词加分
    if (type === 'anime' && /anime|cartoon|动漫|donghua|anime/.test(urlLower)) score += 10;
    if (type === 'anime' && /cartoon/.test(urlLower)) score += 5;
    if (type === 'movie' && /movie|film|电影|poster|cover/.test(urlLower)) score += 10;
    if (type === 'tv' && /tv|电视剧|show|series/.test(urlLower)) score += 10;

    // 负向惩罚
    if (/favicon|icon|logo|avatar|thumbnail|thumb|sprite/.test(urlLower)) score -= 40;
    if (urlLower.indexOf('bing.com') !== -1 || urlLower.indexOf('th.bing.com') !== -1) score = 0;

    return score;
}

// ==================== 海报搜索 ====================

/**
 * 从 Bing 图片搜索获取单部剧集的封面图 URL（类型+平台感知）
 * @param {string} showName - 剧名
 * @param {string} year - 年份
 * @param {string} type - 类型: 'anime' | 'tv' | 'movie' (可选)
 * @param {Array} tags - 平台标签如 ['腾讯视频','B站'] (可选)
 * @returns {Promise<string|null>} 海报图片 URL
 */
async function fetchPosterUrl(showName, year, type, tags) {
    // 先检查缓存
    var cached = getCachedPoster(showName, year);
    if (cached) return cached;

    var t = type || 'tv';
    var tgs = tags || [];
    var typeSuffix = TYPE_SEARCH_SUFFIX[t] || '海报';

    // 第1优先级：豆瓣搜索（海报和主流平台一致，质量最高）
    try {
        var doubanUrl = await fetchFromDouban(showName, year);
        if (doubanUrl) {
            setCachedPoster(showName, year, doubanUrl);
            saveCache();
            return doubanUrl;
        }
    } catch (e) { /* 失败则继续 */ }

    // 第2优先级：腾讯视频直搜（国内平台官方封面）
    if (tgs.indexOf('腾讯视频') !== -1) {
        try {
            var tencentUrl = await fetchFromTencentVideo(showName);
            if (tencentUrl) {
                setCachedPoster(showName, year, tencentUrl);
                saveCache();
                return tencentUrl;
            }
        } catch (e) { /* 失败则继续 */ }
    }

    // 构造搜索词：合并为最多2轮（平台感知 → 通用兜底）
    var queries = [];
    var platformQuery = '';

    // 第1轮：平台感知搜索（合并所有平台标签到一个查询）
    for (var p = 0; p < tgs.length; p++) {
        var plat = PLATFORM_KEYWORDS[tgs[p]];
        if (plat) {
            platformQuery = (showName || '') + ' ' + (year || '') + ' ' + plat.keyword + ' ' + typeSuffix;
            queries.push({
                label: '平台匹配:' + tgs[p],
                q: platformQuery,
                threshold: 50 // 降低阈值，加快匹配
            });
            break; // 只取第一个匹配的标签
        }
    }

    // 如果没有平台匹配，直接上类型搜索
    if (queries.length === 0) {
        queries.push({
            label: '类型匹配:' + t,
            q: (showName || '') + ' ' + (year || '') + ' ' + typeSuffix,
            threshold: 40
        });
    }

    // 第2轮：通用兜底（降低阈值，匹配更多来源）
    queries.push({
        label: '通用兜底',
        q: (showName || '') + ' ' + (year || '') + ' 海报',
        threshold: 20
    });

    var page = null;
    try {
        page = await getPageFromPool();

        await page.setRequestInterception(true);
        var reqHandler = function (req) {
            try {
                var resType = req.resourceType();
                if (resType === 'image' || resType === 'document' || resType === 'xhr' || resType === 'fetch') {
                    req.continue();
                } else {
                    req.abort();
                }
            } catch (e) {
                // 页面池复用可能导致请求已被处理，忽略即可
            }
        };
        page.on('request', reqHandler);

        // 多轮搜索（最多2轮）
        for (var qr = 0; qr < queries.length; qr++) {
            var q = queries[qr];
            // 不使用 imageize filter，让 Bing 返回更多结果
            var searchUrl = 'https://www.bing.com/images/search?q='
                + encodeURIComponent(q.q)
                + '&form=HDRSC2&first=1';

            try {
                // 使用 networkidle2 等待图片完全加载
                await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
                // 额外等待确保图片渲染完成
                await new Promise(function (resolve) { setTimeout(resolve, 1500); });
            } catch (e2) { continue; }

            // 提取图片 URL（多策略兜底）
            var imageUrls = await page.evaluate(function () {
                var urls = [];

                // 策略1: Bing 新版 .iusc 元素（m 属性含 JSON）
                var iuscEls = document.querySelectorAll('.iusc');
                for (var i = 0; i < Math.min(iuscEls.length, 20); i++) {
                    try {
                        var m = JSON.parse(iuscEls[i].getAttribute('m'));
                        if (m.murl) urls.push(m.murl);
                    } catch (e3) {}
                }

                // 策略2: img.mimg（Bing 缩略图 src）
                if (urls.length === 0) {
                    var mimgs = document.querySelectorAll('img.mimg');
                    for (var j = 0; j < Math.min(mimgs.length, 20); j++) {
                        var src = mimgs[j].getAttribute('src') || mimgs[j].getAttribute('data-src') || '';
                        if (src && src.indexOf('http') === 0) urls.push(src);
                    }
                }

                // 策略3: 扫描所有 img 标签（通用兜底）
                if (urls.length === 0) {
                    var allImgs = document.querySelectorAll('img');
                    for (var k = 0; k < Math.min(allImgs.length, 30); k++) {
                        var s = allImgs[k].getAttribute('src') || allImgs[k].getAttribute('data-src') || '';
                        if (s && s.indexOf('http') === 0 && s.indexOf('data:') !== 0) {
                            urls.push(s);
                        }
                    }
                }
                return urls;
            });

            // 过滤 + 评分 + 排序
            var scoredUrls = [];
            for (var u = 0; u < imageUrls.length; u++) {
                var urlLower = imageUrls[u].toLowerCase();
                if (urlLower.indexOf('http') !== 0) continue;
                if (/favicon|icon|logo|avatar/.test(urlLower)) continue;
                var s = scoreImageUrl(imageUrls[u], t, tgs);
                if (s > 0) scoredUrls.push({ url: imageUrls[u], score: s });
            }
            scoredUrls.sort(function (a, b) { return b.score - a.score; });

            if (scoredUrls.length > 0 && scoredUrls[0].score >= q.threshold) {
                // 清理 request handler 并归还 page
                try { page.off('request', reqHandler); } catch (e) {}
                returnPageToPool(page);
                page = null;
                var bestUrl = scoredUrls[0].url;
                setCachedPoster(showName, year, bestUrl);
                saveCache();
                console.log('[海报] ✓', showName, year, '[' + q.label + ' 分数:' + scoredUrls[0].score + ']', bestUrl.substring(0, 60) + '...');
                return bestUrl;
            }
        }

        try { page.off('request', reqHandler); } catch (e) {}
        returnPageToPool(page);
        page = null;
        console.log('[海报] ✗', showName, year, '未找到海报');
        return null;

    } catch (e) {
        console.log('[海报] 搜索失败:', showName, e.message);
        if (page) {
            try { page.off('request', function () {}); returnPageToPool(page); } catch (e2) {}
        }
        return null;
    }
}

/**
 * 批量获取海报（受控并发处理，避免被 Bing 封禁）
 * @param {Array} shows - [{name, year}] 剧集列表
 * @param {Function} onProgress - 进度回调 (current, total, showName, imageUrl)
 * @param {number} delayMs - 批次间间隔
 * @returns {Promise<Object>} {name::year: url, ...}
 */
async function batchFetchPosters(shows, onProgress, delayMs) {
    if (isRunning) {
        console.log('[海报] 已有任务在运行');
        return {};
    }

    isRunning = true;
    shouldStop = false;
    loadCache();
    loadPosterMeta();

    // 增量过滤：跳过最近已更新的海报
    var freshCount = 0;
    var needFetch = [];
    for (var s = 0; s < shows.length; s++) {
        if (isPosterFresh(shows[s].name, shows[s].year)) {
            freshCount++;
        } else {
            needFetch.push(shows[s]);
        }
    }
    if (freshCount > 0) {
        console.log('[海报] 增量更新: 跳过 ' + freshCount + ' 部（7天内已更新），' + needFetch.length + ' 部需抓取');
    }

    var results = {};
    var total = needFetch.length;
    var delay = delayMs || 500;
    var CONCURRENCY = 3; // 受控并发数

    console.log('[海报] 开始批量获取，共 ' + total + ' 部，并发=' + CONCURRENCY + '，间隔 ' + delay + 'ms');

    var completed = 0;

    // 分批并发处理
    for (var batchStart = 0; batchStart < total; batchStart += CONCURRENCY) {
        if (shouldStop) {
            console.log('[海报] 任务被中止');
            break;
        }

        var batch = [];
        var batchEnd = Math.min(batchStart + CONCURRENCY, total);
        for (var j = batchStart; j < batchEnd; j++) {
            batch.push((function (show, idx) {
                // 硬超时包装：防止 Puppeteer 网络异常时无限挂起
                var task = fetchPosterUrl(show.name, show.year, show.type || show._type, show.tags)
                    .then(function (url) { return { url: url, error: null }; })
                    .catch(function (e) { return { url: null, error: e.message }; });
                return withHardTimeout(task, 60000, { url: null, error: '硬超时(60s)' }).then(function (result) {
                    completed++;
                    if (result.url) {
                        results[getCacheKey(show.name, show.year)] = result.url;
                    }
                    if (result.error) {
                        console.log('[海报] 单条失败:', show.name, result.error);
                    }
                    if (onProgress) {
                        onProgress(completed, total, show.name, result.url);
                    }
                });
            })(needFetch[j], j));
        }

        await Promise.all(batch);
        console.log('[海报] 批次完成: ' + (batchStart + 1) + '-' + batchEnd + '/' + total + ' (已完成 ' + completed + ')');

        // 批次间延迟
        if (batchEnd < total && !shouldStop) {
            await sleep(delay);
        }
    }

    isRunning = false;
    saveCache();
    console.log('[海报] 批量获取完成，成功 ' + Object.keys(results).length + '/' + total);
    return results;
}

/**
 * 为 year-catalog 的剧集列表补充海报
 * @param {Array} catalogItems - 目录条目 [{name, year, ...}]
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Array>} 补充了 image 字段的条目列表
 */
async function enrichCatalogWithPosters(catalogItems, onProgress) {
    loadCache();

    var total = catalogItems.length;
    var enriched = [];

    for (var i = 0; i < total; i++) {
        var item = Object.assign({}, catalogItems[i]);
        var cacheKey = getCacheKey(item.name, item.year);

        // 如果已有缓存，使用缓存
        if (posterCache[cacheKey]) {
            item.image = posterCache[cacheKey];
        }

        enriched.push(item);

        if (onProgress) {
            onProgress(i + 1, total, item.name, item.image || null);
        }
    }

    return enriched;
}

/**
 * 停止批量任务
 */
function stop() {
    shouldStop = true;
    isRunning = false;
}

function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/**
 * 获取当前缓存统计
 */
function getCacheStats() {
    var keys = Object.keys(posterCache);
    var localCount = 0;
    var remoteCount = 0;
    keys.forEach(function (k) {
        if (posterCache[k] && posterCache[k].indexOf('file:///') === 0) localCount++;
        else remoteCount++;
    });
    return {
        totalCached: keys.length,
        localCount: localCount,
        remoteCount: remoteCount,
        isRunning: isRunning
    };
}

/**
 * 清理损坏海报文件（0字节+已知坏图指纹）
 * @param {boolean} dryRun - true=仅扫描不删除
 * @returns {{ cleaned: Array, suspected: Array }}
 */
function cleanCorruptedPosters(dryRun) {
    loadCache();
    var cleaned = [];
    var suspected = [];
    if (!fs.existsSync(POSTER_DIR)) return { cleaned: cleaned, suspected: suspected };

    var files = fs.readdirSync(POSTER_DIR);
    var posterKeys = Object.keys(posterCache);

    for (var i = 0; i < files.length; i++) {
        var filePath = path.join(POSTER_DIR, files[i]);
        try {
            var stat = fs.statSync(filePath);
            var doDelete = false;
            var reason = '';

            // 0 字节文件
            if (stat.size === 0) {
                doDelete = true;
                reason = '零字节';
            } else if (stat.size < 5000) {
                // 小于 5KB 的图片很可能是占位图/坏图（常见坏图指纹：3875, 4096, 2048 字节等）
                suspected.push({ file: files[i], size: stat.size });
                doDelete = true;
                reason = '疑似坏图(' + stat.size + '字节)';
            }

            if (doDelete) {
                if (!dryRun) {
                    try { fs.unlinkSync(filePath); } catch (e2) {}
                    // 找对应缓存键并清除
                    for (var k = 0; k < posterKeys.length; k++) {
                        var cacheFile = posterKeys[k] + '.png';
                        cacheFile = cacheFile.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 80);
                        if (files[i] === cacheFile) {
                            delete posterCache[posterKeys[k]];
                            break;
                        }
                    }
                }
                cleaned.push({ file: files[i], reason: reason });
            }
        } catch (e) { /* 跳过无法读取的文件 */ }
    }

    if (!dryRun && cleaned.length > 0) saveCache();
    console.log('[海报] 清理完成:', cleaned.length, '个损坏文件', (dryRun ? '(dryRun)' : ''));
    return { cleaned: cleaned, suspected: suspected };
}

/**
 * 将缓存中的远程 URL 批量下载到本地
 * 只处理尚未本地化的海报
 */
async function localizeAllPosters(delayMs) {
    loadCache();
    var delay = delayMs || 2000;
    var keys = Object.keys(posterCache);
    var toDownload = [];

    for (var i = 0; i < keys.length; i++) {
        var url = posterCache[keys[i]];
        if (url && url.indexOf('file:///') !== 0 && url.indexOf('http') === 0) {
            // 解析 key: "showName::year"
            var parts = keys[i].split('::');
            toDownload.push({ key: keys[i], name: parts[0], year: parts[1] || '', url: url });
        }
    }

    if (toDownload.length === 0) {
        console.log('[海报] 所有海报已本地化');
        return { total: 0, downloaded: 0 };
    }

    console.log('[海报] 开始本地化 ' + toDownload.length + ' 张海报...');
    var alreadyLocal = 0;
    var queued = 0;

    for (var j = 0; j < toDownload.length; j++) {
        var item = toDownload[j];
        // 检查是否已经下载了
        var safeName = item.key.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 80);
        var filePath = path.join(POSTER_DIR, safeName + '.png');
        if (fs.existsSync(filePath)) {
            try {
                var stat = fs.statSync(filePath);
                if (stat.size > 0) {
                    posterCache[item.key] = 'file:///' + filePath.replace(/\\/g, '/');
                    alreadyLocal++;
                    continue;
                } else {
                    try { fs.unlinkSync(filePath); } catch (e) {}
                }
            } catch (e) {
                try { fs.unlinkSync(filePath); } catch (e2) {}
            }
        }

        downloadToLocal(item.name, item.year, item.url);
        queued++;  // 已发起异步下载（不阻塞，由 downloadToLocal 回调更新缓存）

        if (j % 10 === 0 && j > 0) {
            console.log('[海报] 本地化进度: ' + j + '/' + toDownload.length);
        }

        if (j < toDownload.length - 1) {
            await sleep(delay);
        }
    }

    saveCache();
    console.log('[海报] 本地化完成: 已有' + alreadyLocal + ' + 发起' + queued + '/' + toDownload.length);
    return { total: toDownload.length, alreadyLocal: alreadyLocal, queued: queued };
}

/**
 * 从 JSON 目录文件导入海报（直接写入缓存）
 * @param {string} jsonPath - JSON 文件路径
 * @param {string} nameField - 名称字段名 (默认 'name')
 * @param {string} imageField - 图片URL字段名 (默认 'image')
 * @param {string} type - 类型标签 (如 'jp-movie')
 * @returns {{ imported: number, skipped: number }}
 */
function importFromJsonCatalog(jsonPath, nameField, imageField, type) {
    loadCache();
    var nameKey = nameField || 'name';
    var imgKey = imageField || 'image';
    var imported = 0;
    var skipped = 0;

    try {
        if (!fs.existsSync(jsonPath)) {
            console.log('[海报] 目录不存在:', jsonPath);
            return { imported: 0, skipped: 0 };
        }
        var catalog = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        if (!Array.isArray(catalog)) {
            catalog = catalog.data || catalog.movies || catalog.items || [];
        }
        if (!Array.isArray(catalog) || catalog.length === 0) {
            console.log('[海报] 目录为空:', jsonPath);
            return { imported: 0, skipped: 0 };
        }

        console.log('[海报] 导入 ' + (type || '') + ': ' + catalog.length + ' 条');
        for (var i = 0; i < catalog.length; i++) {
            var item = catalog[i];
            var name = item[nameKey] || '';
            var imgUrl = item[imgKey] || item.img || '';
            if (!name || !imgUrl) { skipped++; continue; }

            var cacheKey = getCacheKey(name, '');
            // 已有本地文件的跳过
            var existing = posterCache[cacheKey];
            if (existing && existing.indexOf('file:///') === 0) { skipped++; continue; }

            posterCache[cacheKey] = imgUrl;
            // 异步下载到本地
            downloadToLocal(name, '', imgUrl);
            imported++;
        }

        saveCache();
        console.log('[海报] 导入完成: ' + imported + ' 条, 跳过: ' + skipped);
    } catch (e) {
        console.error('[海报] 导入失败:', e.message);
    }
    return { imported: imported, skipped: skipped };
}

// 初始化加载缓存
loadCache();
loadPosterMeta();

module.exports = {
    fetchPosterUrl: fetchPosterUrl,
    fetchFromTencentVideo: fetchFromTencentVideo,
    batchFetchPosters: batchFetchPosters,
    enrichCatalogWithPosters: enrichCatalogWithPosters,
    getCachedPoster: getCachedPoster,
    searchPosterByName: searchPosterByName,
    getCacheStats: getCacheStats,
    localizeAllPosters: localizeAllPosters,
    cleanCorruptedPosters: cleanCorruptedPosters,
    importFromJsonCatalog: importFromJsonCatalog,
    setPosterUrl: setCachedPoster,
    clearPosterMeta: function () {
        posterMeta = {};
        try { if (fs.existsSync(POSTER_META_FILE)) fs.unlinkSync(POSTER_META_FILE); } catch (e) {}
        console.log('[海报] 元数据已清除，所有海报标记为过期');
    },
    closeBrowser: closeBrowser,
    stop: stop
};
