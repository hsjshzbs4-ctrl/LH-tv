// search-ipc.js - 搜索+详情+首页 IPC handlers
// 从 main.js 拆分，15s 硬超时

const videoSource = require('../video-source.js');
const catalog = require('../show-catalog.js');
const { withValidation } = require('../validate.js');

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

function registerSearchIpc(ipcMain) {
    // 首页数据（无参数，无需校验）
    ipcMain.handle('get-home-data', async function () {
        var d = catalog.getHomepageData();
        if (d.hotShows.length > 0) return { lastUpdated: d.lastUpdated, categories: d.categories, videos: d.hotShows, recentUpdates: d.recentUpdates, total: d.totalShows };
        return T(videoSource.getHomeFeed(), 15000, { categories: [], videos: [] });
    });

    // 分类视频
    ipcMain.handle('get-category-videos', withValidation([
        { name: 'catId', required: true, type: 'number' },
        { name: 'page', required: false, type: 'number', default: 1, min: 1 }
    ], async function (e, catId, page) {
        return T(videoSource.getCategoryVideos(catId, page), 12000, { videos: [], total: 0 });
    }));

    // 搜索视频
    ipcMain.handle('search-video', withValidation([
        { name: 'showName', required: true, type: 'string', maxLength: 200 },
        { name: 'epNum', required: false, type: 'number', default: 1, min: 1 }
    ], async function (e, showName, epNum) {
        return catalog.cachedSearch(showName + '_' + epNum, function () {
            return videoSource.searchEpisode(showName, epNum);
        }, 15000);
    }));

    // 剧集详情
    ipcMain.handle('get-show-detail', withValidation([
        { name: 'showName', required: true, type: 'string', maxLength: 200 }
    ], async function (e, showName) {
        var r = await T(catalog.cachedSearch('d_' + showName, function () {
            return videoSource.getShowDetail(showName).then(function (d) { return d ? [d] : []; });
        }, 15000), 15000, []);
        return r.length > 0 ? r[0] : null;
    }));
}

module.exports = { registerSearchIpc: registerSearchIpc };
