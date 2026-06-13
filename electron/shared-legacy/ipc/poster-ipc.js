// poster-ipc.js - 海报获取 IPC handlers
// 从 main.js 引入

const posterFetcher = require('../poster-fetcher.js');
const yearCatalog = require('../year-catalog.js');
const { withValidation } = require('../validate.js');

function registerPosterIpc(ipcMain) {
    // 获取缓存统计（无参数）
    ipcMain.handle('get-poster-stats', async function () {
        return posterFetcher.getCacheStats();
    });

    // 获取单个海报（传递 type 和 tags）
    ipcMain.handle('fetch-poster', withValidation([
        { name: 'showName', required: true, type: 'string', maxLength: 200 },
        { name: 'year', required: false, type: 'string', maxLength: 10 },
        { name: 'type', required: false, type: 'string', maxLength: 10 },
        { name: 'tags', required: false, type: 'array' }
    ], async function (e, showName, year, type, tags) {
        return posterFetcher.fetchPosterUrl(showName, year, type, tags);
    }));

    // 批量获取海报（传递 type 和 tags）
    ipcMain.handle('batch-fetch-posters', async function (e) {
        var allShows = [];
        var types = ['tv', 'movie', 'anime'];
        for (var t = 0; t < types.length; t++) {
            var cat = yearCatalog.CATALOG[types[t]];
            if (!cat) continue;
            var subs = Object.keys(cat);
            for (var s = 0; s < subs.length; s++) {
                var items = cat[subs[s]];
                if (Array.isArray(items)) {
                    for (var i = 0; i < items.length; i++) {
                        items[i]._type = types[t];
                        items[i]._sub = subs[s];
                        allShows.push(items[i]);
                    }
                }
            }
        }

        var needPoster = [];
        for (var j = 0; j < allShows.length; j++) {
            var show = allShows[j];
            if (!posterFetcher.getCachedPoster(show.name, show.year)) {
                needPoster.push({
                    name: show.name,
                    year: show.year,
                    type: show._type,
                    tags: show.tags || []
                });
            }
        }

        console.log('[PosterIPC] 需要获取海报:', needPoster.length, '部（共', allShows.length, '部）');

        if (needPoster.length === 0) {
            return { fetched: 0, total: 0, message: '所有海报已缓存' };
        }

        var fetchedCount = 0;
        var results = await posterFetcher.batchFetchPosters(needPoster, function (current, total, name, url) {
            if (url) fetchedCount++;
            // 推送进度到渲染进程
            if (e.sender && !e.sender.isDestroyed()) {
                try { e.sender.send('poster-refresh-progress', { current: current, total: total, name: name, hasUrl: !!url }); } catch (e2) {}
            }
        }, 500);

        return {
            fetched: Object.keys(results).length,
            total: needPoster.length,
            results: results
        };
    });

    // 获取带海报的目录
    ipcMain.handle('get-catalog-with-posters', withValidation([
        { name: 'type', required: true, type: 'string', maxLength: 20 },
        { name: 'sub', required: true, type: 'string', maxLength: 20 }
    ], async function (e, type, sub) {
        var items = yearCatalog.getByType(type, sub);
        return posterFetcher.enrichCatalogWithPosters(items);
    }));

    // 清理损坏海报
    ipcMain.handle('clean-corrupted-posters', withValidation([
        { name: 'dryRun', required: false, type: 'boolean', default: false }
    ], async function (e, dryRun) {
        return posterFetcher.cleanCorruptedPosters(dryRun || false);
    }));

    // 重刷指定类型的海报（消除缓存重新搜索）
    ipcMain.handle('refetch-type-posters', withValidation([
        { name: 'type', required: true, type: 'string', maxLength: 10 }
    ], async function (e, type) {
        var items = yearCatalog.getByType(type, 'all');
        if (!items || items.length === 0) return { fetched: 0, total: 0, message: '无条目' };

        var needRefetch = [];
        for (var i = 0; i < items.length; i++) {
            needRefetch.push({
                name: items[i].name,
                year: items[i].year,
                type: type,
                tags: items[i].tags || []
            });
        }

        console.log('[PosterIPC] 重刷 ' + type + ' 海报:', needRefetch.length, '部');
        var results = await posterFetcher.batchFetchPosters(needRefetch, function (current, total, name, url) {
            // 推送进度事件
            if (e && e.sender && !e.sender.isDestroyed()) {
                try { e.sender.send('poster-refresh-progress', { current: current, total: total, name: name, hasUrl: !!url }); } catch (e2) {}
            }
        }, 500);
        return {
            fetched: Object.keys(results).length,
            total: needRefetch.length,
            results: results
        };
    }));

    // 停止海报获取（无参数）
    ipcMain.handle('stop-poster-fetch', async function () {
        posterFetcher.stop();
        return { stopped: true };
    });
}

module.exports = { registerPosterIpc: registerPosterIpc };
