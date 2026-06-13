// show-catalog.js - 本地剧集目录 + 实时更新 + 搜索缓存
// 职责：自动同步最新上架剧集、维护本地目录、搜索缓存加速
// 每隔3小时从AppleCMS拉取最近24小时更新的剧集

const fs = require('fs');
const path = require('path');
const api = require('./api-client.js');
const { getDataPath } = require('./data-paths.js');

var CATALOG_FILE = getDataPath('_catalog.json');
var UPDATE_INTERVAL = 3 * 60 * 60 * 1000; // 3小时

// 目录结构
var catalog = {
    lastUpdated: null,       // ISO时间戳
    totalShows: 0,
    recentUpdates: [],       // 最近更新的剧集
    hotShows: [],            // 热门剧集（首页显示）
    categories: [],          // 分类列表
    updateLog: []            // 更新日志
};

// 搜索缓存（LRU + TTL）
var CacheManager = require('./cache-manager.js');
var searchCache = new CacheManager({ maxSize: 100, ttlMs: 60 * 60 * 1000 });

// 更新定时器
var updateTimer = null;

// 海报获取引用（延迟加载，避免 puppeteer ESM 导入问题）
var posterFetcher = null;
function getPosterFetcher() {
    if (!posterFetcher) {
        try { posterFetcher = require('./poster-fetcher.js'); } catch (e) {}
    }
    return posterFetcher;
}

/**
 * 后台静默获取新剧集海报
 * 不阻塞更新流程
 */
function autoFetchPosters(newShows) {
    var fetcher = getPosterFetcher();
    if (!fetcher) return;

    // 过滤需要获取海报的剧集
    var needPoster = [];
    for (var i = 0; i < newShows.length; i++) {
        var s = newShows[i];
        if (!s.name) continue;
        var cached = fetcher.getCachedPoster(s.name, s.year);
        if (!cached) {
            needPoster.push({ name: s.name, year: s.year || '' });
        }
    }

    if (needPoster.length === 0) return;

    console.log('[目录] 后台获取 ' + needPoster.length + ' 部新剧集海报...');

    // 异步执行，不阻塞
    fetcher.batchFetchPosters(needPoster, function (current, total, name, url) {
        // 静默进行，不打印每个进度
    }, 3000).then(function (results) {
        console.log('[目录] 新剧集海报获取完成:', Object.keys(results).length + '张');
    }).catch(function (e) {
        console.log('[目录] 海报获取异常:', e.message);
    });
}

// ==================== 加载/保存 ====================

function loadCatalog() {
    try {
        if (fs.existsSync(CATALOG_FILE)) {
            var data = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
            catalog = Object.assign(catalog, data);
            console.log('[目录] 已加载，上次更新:', catalog.lastUpdated,
                '剧集数:', catalog.totalShows);
        }
    } catch (e) {
        console.log('[目录] 加载失败，使用空目录:', e.message);
    }
}

function saveCatalog() {
    try {
        var dir = path.dirname(CATALOG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
    } catch (e) {
        console.log('[目录] 保存失败:', e.message);
    }
}

// ==================== 自动更新 ====================

/**
 * 从 AppleCMS 拉取最新上架剧集
 * 使用 h=24 参数获取最近24小时更新的内容
 */
async function fetchLatestUpdates() {
    console.log('[目录] 开始拉取最新上架...');
    var startTime = Date.now();
    var allNew = [];

    // 从主站点获取最近更新
    var sites = api.SITES.slice(0, 2); // 光速+360

    for (var s = 0; s < sites.length; s++) {
        try {
            var url = sites[s].apiUrl + '?ac=detail&h=24';
            var resp = await api.httpGet(url, { timeout: 15000 });
            if (resp.data && resp.data.code === 1 && resp.data.list) {
                var items = resp.data.list;
                console.log('[目录]', sites[s].name, '近24h更新:', items.length, '条');
                for (var i = 0; i < items.length; i++) {
                    allNew.push(formatCatalogItem(items[i], sites[s].name));
                }
            }
        } catch (e) {
            console.log('[目录]', sites[s].name, '拉取失败:', e.message);
        }
    }

    // 去重
    var seen = {};
    var unique = [];
    for (var j = 0; j < allNew.length; j++) {
        var key = allNew[j].name + '|' + allNew[j].year;
        if (!seen[key]) {
            seen[key] = true;
            unique.push(allNew[j]);
        }
    }

    // 按更新时间倒序
    unique.sort(function (a, b) {
        return (b.updateTime || '').localeCompare(a.updateTime || '');
    });

    var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('[目录] 拉取完成，去重后', unique.length, '条，耗时', elapsed + 's');

    return unique;
}

/**
 * 执行完整更新
 */
async function performUpdate() {
    try {
        var latestUpdates = await fetchLatestUpdates();

        // 记录新增的剧集
        var newCount = 0;
        var existingNames = {};
        for (var i = 0; i < catalog.hotShows.length; i++) {
            existingNames[catalog.hotShows[i].name] = true;
        }

        for (var j = 0; j < latestUpdates.length; j++) {
            if (!existingNames[latestUpdates[j].name]) {
                newCount++;
                existingNames[latestUpdates[j].name] = true;
            }
        }

        // 更新目录
        catalog.lastUpdated = new Date().toISOString();
        catalog.recentUpdates = latestUpdates.slice(0, 50);

        // 更新热门列表（保留旧的+新的，去重）
        var merged = {};
        // 先加旧的
        for (var k = 0; k < catalog.hotShows.length; k++) {
            merged[catalog.hotShows[k].name] = catalog.hotShows[k];
        }
        // 再加新的
        for (var l = 0; l < latestUpdates.length; l++) {
            merged[latestUpdates[l].name] = latestUpdates[l];
        }

        // LRU: 按 updateTime 倒序，保留最新 200 条
        catalog.hotShows = Object.values(merged);
        catalog.hotShows.sort(function (a, b) {
            return (b.updateTime || '').localeCompare(a.updateTime || '');
        });
        catalog.hotShows = catalog.hotShows.slice(0, 200);

        // 更新总量（使用合并后的真实总数）
        catalog.totalShows = catalog.hotShows.length;

        // 更新分类
        try {
            var catResult = await api.getMergedCategories();
            if (catResult.categories && catResult.categories.length > 0) {
                catalog.categories = catResult.categories;
            }
        } catch (e) { /* ignore */ }

        // 记录更新日志
        catalog.updateLog.unshift({
            time: catalog.lastUpdated,
            newCount: newCount,
            totalFetched: latestUpdates.length
        });
        if (catalog.updateLog.length > 20) catalog.updateLog = catalog.updateLog.slice(0, 20);

        saveCatalog();
        console.log('[目录] 更新完成，新增', newCount, '部剧集');

        // 自动获取新剧集海报（后台静默进行）
        if (newCount > 0) {
            autoFetchPosters(latestUpdates);
        }

        return { newCount: newCount, totalShows: catalog.totalShows };
    } catch (e) {
        console.log('[目录] 更新失败:', e.message);
        return { newCount: 0, totalShows: catalog.totalShows };
    }
}

function formatCatalogItem(item, siteName) {
    return {
        id: item.vod_id || 0,
        name: item.vod_name || '',
        image: item.vod_pic || '',
        genres: (item.type_name || '').split(/[,，]/),
        rating: parseFloat(item.vod_douban_score) || parseFloat(item.vod_score) || null,
        year: item.vod_year || '',
        remarks: item.vod_remarks || '',
        typeName: item.type_name || '',
        updateTime: item.vod_time || '',
        siteName: siteName
    };
}

// ==================== 定时更新 ====================

function startAutoUpdate() {
    loadCatalog();

    // 如果从未更新或超过3小时，立即更新
    var shouldUpdate = !catalog.lastUpdated ||
        (Date.now() - new Date(catalog.lastUpdated).getTime()) > UPDATE_INTERVAL;

    if (shouldUpdate) {
        performUpdate().then(function () {
            console.log('[目录] 初始更新完成');
        });
    }

    // 定时更新
    updateTimer = setInterval(function () {
        console.log('[目录] 定时更新触发');
        performUpdate();
    }, UPDATE_INTERVAL);

    console.log('[目录] 自动更新已启动，间隔:', UPDATE_INTERVAL / 3600000, '小时');
}

function stopAutoUpdate() {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
}

// ==================== 搜索缓存 ====================

/**
 * 带缓存的搜索
 * @param {string} keyword
 * @param {Function} searchFn - 实际搜索函数
 * @param {number} timeoutMs - 超时(默认15s)
 */
function cachedSearch(keyword, searchFn, timeoutMs) {
    var cacheKey = keyword.toLowerCase().trim();
    var timeout = timeoutMs || 15000;

    // 检查缓存（TTL 由 CacheManager 自动处理）
    var cached = searchCache.get(cacheKey);
    if (cached) {
        console.log('[搜索缓存] 命中:', keyword);
        return Promise.resolve(cached);
    }

    // 带超时的新搜索
    return new Promise(function (resolve) {
        var settled = false;

        var timer = setTimeout(function () {
            if (!settled) {
                settled = true;
                console.log('[搜索] 超时:', keyword);
                // 超时返回缓存或空
                var fallback = searchCache.get(cacheKey);
                resolve(fallback || []);
            }
        }, timeout);

        searchFn(keyword).then(function (results) {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                searchCache.set(cacheKey, results);
                console.log('[搜索缓存] 已缓存:', keyword, results.length, '条');
                resolve(results);
            }
        }).catch(function (err) {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                console.log('[搜索] 失败:', keyword, err.message);
                resolve([]);
            }
        });
    });
}

/**
 * 清除搜索缓存
 */
function clearSearchCache() {
    searchCache.clear();
    console.log('[搜索缓存] 已清除');
}

// ==================== 查询接口 ====================

/**
 * 获取首页数据（优先本地目录）
 */
function getHomepageData() {
    // 如果有最近更新的数据，优先返回
    if (catalog.recentUpdates.length > 0) {
        return {
            lastUpdated: catalog.lastUpdated,
            recentUpdates: catalog.recentUpdates.slice(0, 20),
            hotShows: catalog.hotShows.slice(0, 40),
            categories: catalog.categories,
            totalShows: catalog.totalShows
        };
    }

    // 否则返回热门
    return {
        lastUpdated: catalog.lastUpdated,
        recentUpdates: [],
        hotShows: catalog.hotShows.slice(0, 40),
        categories: catalog.categories,
        totalShows: catalog.totalShows
    };
}

/**
 * 获取更新状态
 */
function getUpdateStatus() {
    return {
        lastUpdated: catalog.lastUpdated,
        totalShows: catalog.totalShows,
        recentCount: catalog.recentUpdates.length,
        nextUpdateIn: updateTimer ? UPDATE_INTERVAL : 0,
        log: catalog.updateLog.slice(0, 5)
    };
}

module.exports = {
    startAutoUpdate: startAutoUpdate,
    stopAutoUpdate: stopAutoUpdate,
    performUpdate: performUpdate,
    getHomepageData: getHomepageData,
    getUpdateStatus: getUpdateStatus,
    cachedSearch: cachedSearch,
    clearSearchCache: clearSearchCache,
    loadCatalog: loadCatalog
};
