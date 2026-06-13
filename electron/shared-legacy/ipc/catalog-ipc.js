// catalog-ipc.js - 目录+电影数据 IPC handlers
// 从 main.js 拆分，自动补充海报缓存

const catalog = require('../show-catalog.js');
const yearCatalog = require('../year-catalog.js');
const posterFetcher = require('../poster-fetcher.js');
const jpMovieCatalog = require('../../jp-movie-catalog.json');
const krMovieCatalog = require('../../kr-movie-catalog.json');
const { withValidation } = require('../validate.js');

function enrichWithPosters(items) {
    if (!items || !Array.isArray(items)) return items;
    return items.map(function (item) {
        // 先精确匹配 name::year
        var posterUrl = posterFetcher.getCachedPoster(item.name, item.year);
        // 失败时用 name 模糊搜索（忽略年份差异）
        if (!posterUrl) {
            posterUrl = posterFetcher.searchPosterByName(item.name);
        }
        return posterUrl ? Object.assign({}, item, { image: posterUrl }) : item;
    });
}

function registerCatalogIpc(ipcMain) {
    // 目录更新状态（无参数）
    ipcMain.handle('get-catalog-status', async function () { return catalog.getUpdateStatus(); });

    // 触发更新（无参数）
    ipcMain.handle('trigger-update', async function () { return catalog.performUpdate(); });

    // 日本/韩国电影目录（无参数）
    ipcMain.handle('get-jp-movies', async function () { return enrichWithPosters(jpMovieCatalog); });
    ipcMain.handle('get-kr-movies', async function () { return enrichWithPosters(krMovieCatalog); });

    // ==================== 年份目录 ====================
    ipcMain.handle('get-year-catalog', withValidation([
        { name: 'year', required: true, type: 'string', maxLength: 10 },
        { name: 'type', required: true, type: 'string', maxLength: 20 }
    ], async function (e, year, type) {
        return enrichWithPosters(yearCatalog.getByYear(year, type));
    }));

    ipcMain.handle('get-type-catalog', withValidation([
        { name: 'type', required: true, type: 'string', maxLength: 20 },
        { name: 'sub', required: true, type: 'string', maxLength: 20 }
    ], async function (e, type, sub) {
        return enrichWithPosters(yearCatalog.getByType(type, sub));
    }));

    ipcMain.handle('search-year-catalog', withValidation([
        { name: 'keyword', required: true, type: 'string', maxLength: 200 }
    ], async function (e, keyword) {
        return enrichWithPosters(yearCatalog.searchCatalog(keyword));
    }));

    // 年份范围（无参数）
    ipcMain.handle('get-year-range', async function () {
        return yearCatalog.getYearRange();
    });

    // 全量目录（无参数）
    ipcMain.handle('get-full-catalog', async function () {
        return yearCatalog.CATALOG;
    });
}

module.exports = { registerCatalogIpc: registerCatalogIpc };
