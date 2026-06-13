// download-ipc.js - 下载+设置 IPC handlers
// 从 main.js 拆分

const downloader = require('../downloader.js');
const catalog = require('../show-catalog.js');
const { shell } = require('electron');
const { withValidation } = require('../validate.js');

var mainWindowRef = null;
var downloadIdCounter = 0;

function setMainWindow(win) { mainWindowRef = win; }

function registerDownloadIpc(ipcMain) {
    // 转发下载进度事件到渲染进程
    var emitter = downloader.getDownloadEmitter();
    emitter.on('progress', function (task) {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
            mainWindowRef.webContents.send('download-progress', {
                id: task.id,
                progress: task._progress || 0,
                detail: task._detail || ''
            });
        }
    });

    // 下载剧集
    ipcMain.handle('download-episode', withValidation([
        { name: 'task', required: true, type: 'object' }
    ], async function (e, task) {
        task.id = 'dl_' + (++downloadIdCounter) + '_' + Date.now();
        task._status = 'queued';
        console.log('[下载] 开始:', task.showName, task.episodeLabel);
        downloader.downloadEpisode(task)
            .then(function (fp) {
                if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                    mainWindowRef.webContents.send('download-complete', {
                        id: task.id, filePath: fp,
                        showName: task.showName, episodeLabel: task.episodeLabel
                    });
                }
            })
            .catch(function (err) {
                if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                    mainWindowRef.webContents.send('download-error', { id: task.id, error: err.message });
                }
            });
        return { id: task.id, status: 'started' };
    }));

    // 下载状态（无参数）
    ipcMain.handle('get-download-status', async function () { return downloader.getDownloadStatus(); });

    // 本地剧集（无参数）
    ipcMain.handle('get-local-shows', async function () { return downloader.getLocalShows(); });
    ipcMain.handle('get-local-library', async function () { return downloader.getLocalLibrary(); });

    // 删除本地剧集
    ipcMain.handle('delete-local-episode', withValidation([
        { name: 'filePath', required: true, type: 'string', maxLength: 1000 }
    ], async function (e, fp) {
        return downloader.deleteLocalEpisode(fp);
    }));

    // 本地文件路径
    ipcMain.handle('get-local-file-path', withValidation([
        { name: 'showName', required: true, type: 'string', maxLength: 200 },
        { name: 'epLabel', required: true, type: 'string', maxLength: 200 }
    ], async function (e, showName, epLabel) {
        var lib = downloader.getLocalLibrary();
        for (var i = 0; i < lib.length; i++) {
            if (lib[i].showName === showName && lib[i].episodeLabel === epLabel) return lib[i].filePath;
        }
        return null;
    }));

    // 打开下载目录（无参数）
    ipcMain.handle('open-download-dir', async function () {
        shell.openPath(downloader.DOWNLOAD_DIR);
    });

    // 清除搜索缓存（无参数）
    ipcMain.handle('clear-search-cache', async function () {
        catalog.clearSearchCache();
        return true;
    });
}

module.exports = { registerDownloadIpc: registerDownloadIpc, setMainWindow: setMainWindow };
