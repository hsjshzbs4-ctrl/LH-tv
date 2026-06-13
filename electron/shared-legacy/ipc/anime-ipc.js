// anime-ipc.js - 动漫 IPC handlers
// 从 main.js 拆分，在线搜索 12-15s 超时

const animeScraper = require('../anime-scraper.js');
const tiantianScraper = require('../tiantian-scraper.js');
const animeCatalog = require('../anime-catalog.js');
const yearCatalog = require('../year-catalog.js');
const posterFetcher = require('../poster-fetcher.js');
const { withValidation } = require('../validate.js');

// playUrl 域名白名单 — 防止 SSRF 攻击
var ALLOWED_PLAY_URL_HOSTS = [
    'yinghuadongman.com.cn', 'www.yinghuadongman.com.cn',
    'tiantiandongman.com', 'm.tiantiandongman.com'
];

function isPlayUrlAllowed(playUrl) {
    try {
        var host = new (require('url').URL)(playUrl).hostname || '';
        for (var i = 0; i < ALLOWED_PLAY_URL_HOSTS.length; i++) {
            if (host === ALLOWED_PLAY_URL_HOSTS[i] || host.endsWith('.' + ALLOWED_PLAY_URL_HOSTS[i])) {
                return true;
            }
        }
        console.warn('[AnimeIPC] 拒绝非白名单 playUrl:', host, playUrl.substring(0, 60));
        return false;
    } catch (e) {
        return false;
    }
}

function enrichWithPosters(items) {
    if (!items || !Array.isArray(items)) return items;
    return items.map(function (item) {
        // 先精确匹配 name::year
        var posterUrl = posterFetcher.getCachedPoster(item.name, item.year);
        // 失败时用 name 模糊搜索（忽略年份差异，匹配"长期"等场景）
        if (!posterUrl) {
            posterUrl = posterFetcher.searchPosterByName(item.name);
        }
        // 再不行用 searchName 字段兜底
        if (!posterUrl && item.searchName) {
            posterUrl = posterFetcher.searchPosterByName(item.searchName);
        }
        return posterUrl ? Object.assign({}, item, { image: posterUrl }) : item;
    });
}

function T(promise, ms, fallback) {
    return Promise.race([promise, new Promise(function (r) {
        setTimeout(function () {
            var fb = fallback;
            // 浅拷贝，避免 _timeout 污染共享引用
            if (Array.isArray(fb)) {
                fb = fb.slice();
            } else if (fb && typeof fb === 'object') {
                fb = Object.assign({}, fb);
            }
            if (fb && typeof fb === 'object') {
                fb._timeout = true;
            }
            r(fb);
        }, ms);
    })]);
}

function registerAnimeIpc(ipcMain) {
    // 动漫列表
    ipcMain.handle('get-anime-list', withValidation([
        { name: 'catId', required: true, type: 'string', maxLength: 50 },
        { name: 'page', required: false, type: 'number', default: 1, min: 1 }
    ], async function (e, catId, page) {
        return T(animeScraper.getAnimeList(catId, page), 12000, { list: [], totalPages: 0 });
    }));

    // 动漫详情
    ipcMain.handle('get-anime-detail', withValidation([
        { name: 'animeId', required: true, type: 'number', min: 1 }
    ], async function (e, animeId) {
        return T(animeScraper.getAnimeDetail(animeId), 12000, null);
    }));

    // 动漫播放 URL
    ipcMain.handle('get-anime-play-url', withValidation([
        { name: 'playUrl', required: true, type: 'string', maxLength: 2000 }
    ], async function (e, playUrl) {
        if (!isPlayUrlAllowed(playUrl)) return null;
        return T(animeScraper.getPlayUrl(playUrl), 10000, null);
    }));

    // 搜索动漫
    ipcMain.handle('search-anime', withValidation([
        { name: 'keyword', required: true, type: 'string', maxLength: 100 }
    ], async function (e, keyword) {
        return T(animeScraper.searchAnime(keyword), 12000, []);
    }));

    // 本地动漫目录
    ipcMain.handle('get-anime-catalog', async function (e, catId) {
        var items;
        // 动漫剧场版：使用 year-catalog 中的 anime.movie 数据
        if (catId === 'movie') items = yearCatalog.getByType('anime', 'movie');
        else if (catId === 'all') items = animeCatalog.getAll();
        else {
            var catMap = { 'cn': '国漫', 'jp': '日漫', 'kr': '韩漫' };
            items = animeCatalog.getByCategory(catMap[catId] || '日漫');
        }
        var enriched = enrichWithPosters(items);

        // 后台异步搜索缺失的海报（不阻塞响应）
        var missingPosters = [];
        for (var i = 0; i < enriched.length; i++) {
            if (!enriched[i].image) {
                missingPosters.push({
                    name: enriched[i].name,
                    year: enriched[i].year,
                    type: 'anime',
                    tags: enriched[i].tags || []
                });
            }
        }
        if (missingPosters.length > 0) {
            console.log('[AnimeIPC] 后台搜索 ' + missingPosters.length + ' 部缺失海报...');
            setTimeout(function () {
                posterFetcher.batchFetchPosters(missingPosters, null, 3000).catch(function () {});
            }, 2000);
        }

        return enriched;
    });

    // 在线查找动漫
    ipcMain.handle('find-anime-online', withValidation([
        { name: 'animeName', required: true, type: 'string', maxLength: 200 },
        { name: 'animeId', required: false, type: 'number', default: 0 }
    ], async function (e, animeName, animeId) {
        return T((async function () {
            try { return await animeScraper.getAnimeDetail(animeId); } catch (e1) {
                try { var r = await animeScraper.searchAnime(animeName); if (r.length > 0) return await animeScraper.getAnimeDetail(r[0].id); } catch (e2) {}
                return null;
            }
        })(), 15000, null);
    }));

    // ==================== 天天动漫数据源 ====================
    ipcMain.handle('get-tiantian-list', withValidation([
        { name: 'catId', required: true, type: 'string', maxLength: 50 },
        { name: 'page', required: false, type: 'number', default: 1, min: 1 }
    ], async function (e, catId, page) {
        return T(tiantianScraper.getAnimeList(catId, page), 12000, { list: [], totalPages: 0 });
    }));

    ipcMain.handle('get-tiantian-detail', withValidation([
        { name: 'animeId', required: true, type: 'number', min: 1 }
    ], async function (e, animeId) {
        return T(tiantianScraper.getAnimeDetail(animeId), 12000, null);
    }));

    ipcMain.handle('get-tiantian-play-url', withValidation([
        { name: 'playUrl', required: true, type: 'string', maxLength: 2000 }
    ], async function (e, playUrl) {
        if (!isPlayUrlAllowed(playUrl)) return null;
        return T(tiantianScraper.getPlayUrl(playUrl), 10000, null);
    }));

    ipcMain.handle('search-tiantian', withValidation([
        { name: 'keyword', required: true, type: 'string', maxLength: 100 }
    ], async function (e, keyword) {
        return T(tiantianScraper.searchAnime(keyword), 12000, []);
    }));
}

module.exports = { registerAnimeIpc: registerAnimeIpc };
