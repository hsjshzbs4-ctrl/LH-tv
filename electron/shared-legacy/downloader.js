// downloader.js - 视频下载器（v2 增强断点续传）
// 职责：下载 m3u8/mp4 → 本地 MP4 文件，管理下载队列和本地剧集库
// 运行在 Electron 主进程
// v2: 增强断点续传 — 分段级恢复、指数退避重试、文件完整性校验

const { httpGet } = require('./http-client.js');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const log = require('./logger.js').createLogger('Downloader');
const { getDataPath, ensureDir } = require('./data-paths.js');

// ==================== 配置常量 ====================
var DOWNLOAD_DIR = getDataPath();
var MAX_SEGMENT_RETRIES = 3;        // 单段最大重试次数
var MAX_M3U8_RETRIES = 2;           // m3u8 播放列表最大重试次数
var TEMP_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 临时文件保留 24 小时（用于断点恢复）
var DOWNLOAD_SPEED_LIMIT = 0;       // 下载速度限制 (KB/s)，0 = 不限制
var downloadPaused = false;         // 全局下载暂停标志
var bytesThisSecond = 0;            // 当前秒已下载字节数
var speedTimer = null;              // 速率重置定时器

function ensureDownloadDir() {
    ensureDir(DOWNLOAD_DIR);
}
ensureDownloadDir();

// 剧集下载目录: downloads/剧名/
function getShowDir(showName) {
    var dir = path.join(DOWNLOAD_DIR, sanitizeFileName(showName));
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (e) {
        console.error('[下载] 创建剧集目录失败:', dir, e.message);
    }
    return dir;
}

function sanitizeFileName(name) {
    return (name || 'unknown').replace(/[<>:"/\\|?*]/g, '_').trim();
}

// ==================== 下载状态跟踪 ====================

var downloadQueue = [];        // 待下载列表
var activeDownloads = {};      // 正在下载的任务 {id: DownloadTask}
var completedDownloads = [];   // 已完成

var downloadEmitter = new EventEmitter();

// 加载下载记录
var DOWNLOAD_RECORD_FILE = path.join(DOWNLOAD_DIR, '_records.json');

function loadRecords() {
    try {
        if (fs.existsSync(DOWNLOAD_RECORD_FILE)) {
            var data = JSON.parse(fs.readFileSync(DOWNLOAD_RECORD_FILE, 'utf-8'));
            completedDownloads = data.downloads || [];
        }
    } catch (e) {
        completedDownloads = [];
    }
}

function saveRecords() {
    try {
        fs.writeFileSync(DOWNLOAD_RECORD_FILE, JSON.stringify({
            downloads: completedDownloads,
            updatedAt: new Date().toISOString()
        }, null, 2), 'utf-8');
    } catch (e) {
        console.log('[下载] 保存记录失败:', e.message);
    }
}

// ==================== 断点续传（v2 增强）====================
var RESUME_FILE = path.join(DOWNLOAD_DIR, '_resume.json');

function saveResumeState(taskId, filePath, tempFiles, segmentUrls) {
    try {
        var data = {};
        if (fs.existsSync(RESUME_FILE)) {
            data = JSON.parse(fs.readFileSync(RESUME_FILE, 'utf-8'));
        }
        // 只保存实际存在的临时文件路径
        var existingTemps = {};
        for (var i = 0; i < tempFiles.length; i++) {
            if (tempFiles[i] && fs.existsSync(tempFiles[i])) {
                existingTemps[String(i)] = tempFiles[i];
            }
        }
        data[taskId] = {
            filePath: filePath,
            tempFiles: existingTemps,
            segmentUrls: segmentUrls || [],
            totalSegments: tempFiles.length,
            downloadedCount: Object.keys(existingTemps).length,
            updatedAt: Date.now()
        };
        fs.writeFileSync(RESUME_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.log('[下载] 保存断点状态失败:', e.message);
    }
}

function getResumeState(taskId) {
    try {
        if (fs.existsSync(RESUME_FILE)) {
            var data = JSON.parse(fs.readFileSync(RESUME_FILE, 'utf-8'));
            var state = data[taskId] || null;
            // 校验断点状态是否过期（24小时）
            if (state && (Date.now() - state.updatedAt) < TEMP_FILE_MAX_AGE_MS) {
                // 校验保存的临时文件是否仍然存在
                var validCount = 0;
                if (state.tempFiles) {
                    var indices = Object.keys(state.tempFiles);
                    for (var i = 0; i < indices.length; i++) {
                        var fp = state.tempFiles[indices[i]];
                        // 检查临时文件是否存在且非空
                        try {
                            if (fs.existsSync(fp) && fs.statSync(fp).size > 0) {
                                validCount++;
                            } else {
                                // 清除无效的临时文件引用
                                delete state.tempFiles[indices[i]];
                                try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (e) {}
                            }
                        } catch (e) {
                            delete state.tempFiles[indices[i]];
                        }
                    }
                }
                if (validCount > 0) {
                    console.log('[下载] 恢复断点: 已完成 ' + validCount + '/' + state.totalSegments + ' 段');
                    return state;
                }
            }
            // 过期或无效，清除
            delete data[taskId];
            try { fs.writeFileSync(RESUME_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e) {}
        }
    } catch (e) {}
    return null;
}

function clearResumeState(taskId) {
    try {
        if (fs.existsSync(RESUME_FILE)) {
            var data = JSON.parse(fs.readFileSync(RESUME_FILE, 'utf-8'));
            delete data[taskId];
            fs.writeFileSync(RESUME_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
    } catch (e) {}
}

// ==================== 下载单集 ====================

/**
 * 下载视频到本地（v2 断点续传）
 * @param {Object} task - { id, showName, episodeLabel, episodeNum, url, type:'m3u8'|'mp4' }
 * @returns {Promise<string>} 本地文件路径
 */
function downloadEpisode(task) {
    return new Promise(function (resolve, reject) {
        ensureDownloadDir();
        var showDir = getShowDir(task.showName);

        var fileName = sanitizeFileName(task.episodeLabel || ('第' + task.episodeNum + '集')) + '.mp4';
        var filePath = path.join(showDir, fileName);

        // 检查是否已下载完成
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            log.info('已存在: ' + filePath);
            // 清除可能残留的断点状态
            clearResumeState(task.id);
            resolve(filePath);
            return;
        }

        task._status = 'downloading';
        task._progress = 0;
        task._filePath = filePath;
        activeDownloads[task.id] = task;

        downloadEmitter.emit('progress', task);

        log.info('开始: ' + task.showName + ' ' + task.episodeLabel + ' URL片段: ' + task.url.substring(0, 60));

        if (task.url.indexOf('.m3u8') !== -1) {
            downloadM3u8(task, filePath, resolve, reject);
        } else {
            downloadDirect(task, filePath, resolve, reject);
        }
    });
}

/**
 * 下载 m3u8 → 合并为 mp4（v2 断点续传）
 */
function downloadM3u8(task, filePath, resolve, reject, _retryCount) {
    var retryCount = _retryCount || 0;

    // 第一步：获取 m3u8 播放列表
    httpGet(task.url).then(function (resp) {
        var m3u8Content = resp.data;
        var segments = parseM3u8(m3u8Content, task.url);

        if (segments.length === 0) {
            reject(new Error('m3u8 解析失败：未找到视频片段'));
            return;
        }

        log.info('共 ' + segments.length + ' 个片段');
        task._totalSegments = segments.length;

        // 第二步：下载所有片段（支持断点续传）
        downloadSegments(task, segments, filePath, resolve, reject);
    }).catch(function (err) {
        if (retryCount < MAX_M3U8_RETRIES) {
            var delay = Math.pow(2, retryCount) * 1000;
            console.log('[下载] m3u8 获取失败，' + delay + 'ms 后重试 (' + (retryCount + 1) + '/' + MAX_M3U8_RETRIES + '):', err.message);
            setTimeout(function () {
                downloadM3u8(task, filePath, resolve, reject, retryCount + 1);
            }, delay);
        } else {
            reject(new Error('获取 m3u8 失败（已重试 ' + MAX_M3U8_RETRIES + ' 次）: ' + err.message));
        }
    });
}

/**
 * 解析 m3u8 文件，提取 .ts 或媒体片段 URL
 */
function parseM3u8(content, baseUrl) {
    var lines = content.split('\n');
    var segments = [];
    var basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        // 跳过注释和标签
        if (line === '' || line[0] === '#') continue;
        // 跳过 #EXT 开头的行
        if (line.indexOf('#') === 0) continue;

        // 构建完整 URL
        var url;
        if (line.indexOf('http') === 0) {
            url = line;
        } else if (line[0] === '/') {
            var urlObj = new URL(baseUrl);
            url = urlObj.protocol + '//' + urlObj.host + line;
        } else {
            url = basePath + line;
        }

        segments.push(url);
    }

    return segments;
}

/**
 * 逐个下载片段：每个片段写入临时文件，最后流式合并（避免OOM）
 * v2: 支持断点续传 — 恢复已下载的片段，只下载缺失的
 */
function downloadSegments(task, segments, filePath, resolve, reject) {
    var total = segments.length;
    var concurrency = (require('./config.js').DOWNLOAD.concurrency) || 5;
    var tempFiles = new Array(total);

    // ---- 断点恢复：检查之前的下载进度 ----
    var resumeState = getResumeState(task.id);
    var completedFromResume = 0;

    if (resumeState && resumeState.tempFiles) {
        var resumeIndices = Object.keys(resumeState.tempFiles);
        for (var ri = 0; ri < resumeIndices.length; ri++) {
            var idx = parseInt(resumeIndices[ri], 10);
            var tmpPath = resumeState.tempFiles[resumeIndices[ri]];
            if (idx >= 0 && idx < total &&
                tmpPath && fs.existsSync(tmpPath) && fs.statSync(tmpPath).size > 0) {
                tempFiles[idx] = tmpPath;
                completedFromResume++;
            }
        }
        console.log('[下载] 断点恢复: ' + completedFromResume + '/' + total + ' 段已完成');
    }

    var completed = completedFromResume;
    var failed = false;
    var index = 0;

    // 定期保存断点（每 10 段或每 15 秒）
    var lastSaveTime = Date.now();
    var segmentsSinceSave = 0;

    function maybeSaveResume() {
        segmentsSinceSave++;
        var now = Date.now();
        if (segmentsSinceSave >= 10 || (now - lastSaveTime) > 15000) {
            saveResumeState(task.id, filePath, tempFiles, segments);
            segmentsSinceSave = 0;
            lastSaveTime = now;
        }
    }

    function downloadNext() {
        if (failed) return;

        // 跳过已完成的段（断点恢复）
        while (index < total && tempFiles[index]) {
            index++;
            completed++; // 已计入了 completedFromResume，这里不再重复计数
        }

        if (index >= total) {
            if (completed >= total) {
                clearResumeState(task.id);
                mergeTempFiles();
            }
            return;
        }

        var segIdx = index++;
        downloadSingleSegmentToFile(segments[segIdx], segIdx, task.id, function (err, tmpPath) {
            if (failed) return;

            if (err) {
                // 指数退避重试（最多 MAX_SEGMENT_RETRIES 次）
                retrySegment(segIdx, MAX_SEGMENT_RETRIES, function (err2, tmpPath2) {
                    if (err2) {
                        failed = true;
                        cleanupTempFiles();
                        reject(new Error('片段 ' + segIdx + ' 下载失败（已重试 ' + MAX_SEGMENT_RETRIES + ' 次）: ' + err2.message));
                        return;
                    }
                    tempFiles[segIdx] = tmpPath2;
                    completed++;
                    updateProgress(task, completed, total);
                    maybeSaveResume();
                    downloadNext();
                });
                return;
            }

            tempFiles[segIdx] = tmpPath;
            completed++;
            updateProgress(task, completed, total);
            maybeSaveResume();
            downloadNext();
        });
    }

    // 递归重试（指数退避: 1s, 2s, 4s）
    function retrySegment(segIdx, retriesLeft, callback) {
        console.log('[下载] 片段', segIdx, '失败，剩余重试:', retriesLeft);
        var delay = Math.pow(2, MAX_SEGMENT_RETRIES - retriesLeft) * 1000;
        setTimeout(function () {
            downloadSingleSegmentToFile(segments[segIdx], segIdx, task.id, function (err, tmpPath) {
                if (err && retriesLeft > 1) {
                    retrySegment(segIdx, retriesLeft - 1, callback);
                } else {
                    callback(err, tmpPath);
                }
            });
        }, delay);
    }

    // 启动并发下载
    for (var c = 0; c < concurrency; c++) {
        downloadNext();
    }

    function mergeTempFiles() {
        try {
            // 合并前先统计总大小（用于校验）
            var expectedSize = 0;
            for (var si = 0; si < tempFiles.length; si++) {
                if (tempFiles[si] && fs.existsSync(tempFiles[si])) {
                    expectedSize += fs.statSync(tempFiles[si]).size;
                }
            }

            var writeStream = fs.createWriteStream(filePath);
            var mergeIndex = 0;
            var mergedSize = 0;

            function pipeNext() {
                if (mergeIndex >= tempFiles.length) {
                    writeStream.end();
                    return;
                }
                var tmpPath = tempFiles[mergeIndex];
                if (!tmpPath || !fs.existsSync(tmpPath)) {
                    mergeIndex++;
                    pipeNext();
                    return;
                }
                var segSize = fs.statSync(tmpPath).size;
                var readStream = fs.createReadStream(tmpPath);
                var chunkCount = 0;
                readStream.on('data', function (chunk) {
                    mergedSize += chunk.length;
                    chunkCount++;
                    // 每 20 个 chunk 更新一次合并进度（避免过于频繁的 I/O）
                    if (chunkCount % 20 === 0) {
                        updateMergeProgress();
                    }
                });
                readStream.pipe(writeStream, { end: false });
                readStream.on('end', function () {
                    // 删除临时文件
                    try { fs.unlinkSync(tmpPath); } catch (e) {}
                    mergeIndex++;
                    pipeNext();
                });
                readStream.on('error', function (err) {
                    cleanupTempFiles();
                    reject(new Error('合并文件失败: ' + err.message));
                });
            }

            function updateMergeProgress() {
                if (expectedSize > 0) {
                    task._progress = Math.min(99, Math.round((mergedSize / expectedSize) * 100));
                    task._detail = '合并中 ' + Math.round(mergedSize / 1024 / 1024) + 'MB';
                    downloadEmitter.emit('progress', task);
                }
            }

            pipeNext();

            writeStream.on('finish', function () {
                // 完整性校验
                var finalSize = 0;
                try { finalSize = fs.statSync(filePath).size; } catch (e) {}

                if (finalSize === 0) {
                    reject(new Error('文件完整性校验失败：合并后文件大小为 0'));
                    return;
                }

                // 大小偏差超过 10% 且差异大于 1MB 时警告
                var sizeDiff = Math.abs(finalSize - expectedSize);
                if (expectedSize > 0 && sizeDiff > Math.max(expectedSize * 0.1, 1048576)) {
                    console.log('[下载] 警告：合并后大小偏差 ' + Math.round(sizeDiff / 1024) + 'KB (' +
                        Math.round(finalSize / 1024 / 1024) + 'MB vs 预期 ' + Math.round(expectedSize / 1024 / 1024) + 'MB)');
                }

                task._status = 'completed';
                task._progress = 100;
                delete activeDownloads[task.id];

                completedDownloads.push({
                    id: task.id,
                    showName: task.showName,
                    episodeLabel: task.episodeLabel,
                    episodeNum: task.episodeNum,
                    filePath: filePath,
                    fileSize: finalSize,
                    downloadedAt: new Date().toISOString(),
                    sourceUrl: task.url
                });
                saveRecords();
                clearResumeState(task.id);

                downloadEmitter.emit('complete', task);
                log.info('完成: ' + filePath + ' (' + Math.round(finalSize / 1024 / 1024) + 'MB)');
                resolve(filePath);
            });

            writeStream.on('error', function (err) {
                clearResumeState(task.id);
                reject(new Error('写入文件失败: ' + err.message));
            });
        } catch (e) {
            cleanupTempFiles();
            reject(new Error('合并文件失败: ' + e.message));
        }
    }

    function cleanupTempFiles() {
        for (var i = 0; i < tempFiles.length; i++) {
            if (tempFiles[i]) {
                try { fs.unlinkSync(tempFiles[i]); } catch (e) {}
            }
        }
    }
}

function downloadSingleSegmentToFile(url, index, taskId, callback) {
    // backward compat: if taskId is the callback (old 3-arg pattern)
    if (typeof taskId === 'function') {
        callback = taskId;
        taskId = undefined;
    }

    var urlObj;
    try { urlObj = new URL(url); } catch (e) {
        callback(e);
        return;
    }

    var transport = urlObj.protocol === 'https:' ? require('https') : require('http');

    var req = transport.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': urlObj.protocol + '//' + urlObj.host
        },
        timeout: 30000
    }, function (res) {
        if (res.statusCode >= 400) {
            callback(new Error('HTTP ' + res.statusCode));
            return;
        }

        // 临时文件名: _dl_<taskId>_<index>_<timestamp>.part（便于断点匹配和清理）
        var taskPrefix = taskId ? '_dl_' + sanitizeFileName(String(taskId)) : '_tmp';
        var tmpPath = path.join(DOWNLOAD_DIR, taskPrefix + '_seg' + index + '_' + Date.now() + '.part');
        var tmpCreated = true;
        var ws = fs.createWriteStream(tmpPath);
        res.pipe(ws);
        ws.on('finish', function () { callback(null, tmpPath); });
        ws.on('error', function (e) {
            if (tmpCreated) { try { fs.unlinkSync(tmpPath); } catch (e2) {} }
            callback(e);
        });
    });

    req.on('error', function (e) { callback(e); });
    req.on('timeout', function () { req.destroy(); callback(new Error('超时')); });
    req.end();
}

function updateProgress(task, completed, total) {
    task._progress = Math.round((completed / total) * 100);
    task._detail = completed + '/' + total;
    downloadEmitter.emit('progress', task);
}

/**
 * 直接下载 mp4 或其他格式（流式写入，避免大文件 OOM）
 */
function downloadDirect(task, filePath, resolve, reject) {
    var urlObj;
    try { urlObj = new URL(task.url); } catch (e) { reject(e); return; }

    var transport = urlObj.protocol === 'https:' ? require('https') : require('http');
    var ws = fs.createWriteStream(filePath);
    var downloaded = 0;

    var req = transport.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': urlObj.protocol + '//' + urlObj.host
        },
        timeout: 300000
    }, function (res) {
        if (res.statusCode >= 400) {
            ws.close();
            try { fs.unlinkSync(filePath); } catch (e2) {}
            reject(new Error('HTTP ' + res.statusCode));
            return;
        }

        res.on('data', function (chunk) {
            downloaded += chunk.length;
            task._progress = Math.min(99, Math.round(downloaded / 1024 / 1024)); // MB 进度
            task._detail = Math.round(downloaded / 1024 / 1024) + 'MB';
            downloadEmitter.emit('progress', task);
        });

        res.pipe(ws);

        ws.on('finish', function () {
            task._status = 'completed';
            task._progress = 100;
            task._filePath = filePath;
            delete activeDownloads[task.id];

            completedDownloads.push({
                id: task.id,
                showName: task.showName,
                episodeLabel: task.episodeLabel,
                episodeNum: task.episodeNum,
                filePath: filePath,
                fileSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
                downloadedAt: new Date().toISOString(),
                sourceUrl: task.url
            });
            saveRecords();

            downloadEmitter.emit('complete', task);
            log.info('完成: ' + filePath);
            resolve(filePath);
        });

        ws.on('error', function (err) {
            try { fs.unlinkSync(filePath); } catch (e2) {}
            reject(new Error('写入文件失败: ' + err.message));
        });
    });

    req.on('error', function (e) {
        try { fs.unlinkSync(filePath); } catch (e2) {}
        reject(e);
    });
    req.on('timeout', function () {
        req.destroy();
        ws.close();
        try { fs.unlinkSync(filePath); } catch (e2) {}
        reject(new Error('下载超时'));
    });
    req.end();
}

// HTTP 请求已迁移至 shared/http-client.js
// 调用方式：httpGet(url) 返回 { status, data, headers }，data 为响应内容

// ==================== 本地库管理 ====================

/**
 * 获取本地已下载的剧集列表
 * @returns {Array}
 */
function getLocalLibrary() {
    loadRecords();

    // 更新：检查文件是否仍然存在
    var valid = [];
    for (var i = 0; i < completedDownloads.length; i++) {
        var item = completedDownloads[i];
        if (fs.existsSync(item.filePath)) {
            valid.push(item);
        } else {
            item._deleted = true;
        }
    }

    // 如果有文件被删除，更新记录
    if (valid.length !== completedDownloads.length) {
        completedDownloads = valid;
        saveRecords();
    }

    return valid;
}

/**
 * 按剧名分组本地库
 * @returns {Object} { 剧名: [episodes] }
 */
function getLocalShows() {
    var library = getLocalLibrary();
    var shows = {};

    for (var i = 0; i < library.length; i++) {
        var item = library[i];
        var showName = item.showName;
        if (!shows[showName]) {
            shows[showName] = [];
        }
        shows[showName].push(item);
    }

    // 每部剧按集数排序
    var keys = Object.keys(shows);
    for (var k = 0; k < keys.length; k++) {
        shows[keys[k]].sort(function (a, b) {
            return (a.episodeNum || 0) - (b.episodeNum || 0);
        });
    }

    return shows;
}

/**
 * 删除本地剧集文件
 */
function deleteLocalEpisode(filePath) {
    // 安全检查：确保路径在 DOWNLOAD_DIR 内，防止路径遍历攻击
    var resolvedPath = path.resolve(filePath);
    var resolvedBase = path.resolve(DOWNLOAD_DIR);
    if (resolvedPath.indexOf(resolvedBase) !== 0) {
        console.log('[下载] 拒绝删除: 路径不在下载目录内 —', filePath);
        return false;
    }
    if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
    }
    completedDownloads = completedDownloads.filter(function (item) {
        return item.filePath !== filePath && item.filePath !== resolvedPath;
    });
    saveRecords();
    return true;
}

/**
 * 获取下载进度事件发射器
 */
function getDownloadEmitter() {
    return downloadEmitter;
}

/**
 * 获取当前下载状态
 */
function getDownloadStatus() {
    var active = [];
    var keys = Object.keys(activeDownloads);
    for (var i = 0; i < keys.length; i++) {
        var t = activeDownloads[keys[i]];
        active.push({
            id: t.id,
            showName: t.showName,
            episodeLabel: t.episodeLabel,
            progress: t._progress,
            detail: t._detail
        });
    }
    return { active: active, completed: completedDownloads.length };
}

// 初始化
loadRecords();
ensureDownloadDir();
cleanupTempFiles();

// 清理残留临时文件（上次崩溃可能留下的 .part 文件）
function cleanupTempFiles() {
    try {
        var files = fs.readdirSync(DOWNLOAD_DIR);
        var now = Date.now();
        var cleaned = 0;
        for (var i = 0; i < files.length; i++) {
            // 匹配两种临时文件命名模式: _tmp_*_<n>.part (旧) 和 _dl_*_seg<n>_<ts>.part (新)
            if (files[i].indexOf('.part') !== -1 &&
                (files[i].indexOf('_tmp_') === 0 || files[i].indexOf('_dl_') === 0)) {
                var fp = path.join(DOWNLOAD_DIR, files[i]);
                try {
                    var stat = fs.statSync(fp);
                    // 只清理超过 24 小时的旧临时文件（新断点续传允许更长时间的恢复窗口）
                    if (now - stat.mtimeMs > TEMP_FILE_MAX_AGE_MS) {
                        fs.unlinkSync(fp);
                        cleaned++;
                    }
                } catch (e) { /* 无法读取就跳过 */ }
            }
        }
        if (cleaned > 0) console.log('[下载] 清理了 ' + cleaned + ' 个过期临时文件');
    } catch (e) { /* downloads 目录可能不存在 */ }
}

// ==================== 速度限制与队列控制 ====================

function setSpeedLimit(kbps) {
    DOWNLOAD_SPEED_LIMIT = Math.max(0, kbps || 0);
    console.log('[下载] 速度限制: ' + (DOWNLOAD_SPEED_LIMIT > 0 ? DOWNLOAD_SPEED_LIMIT + ' KB/s' : '无限制'));
}

function getSpeedLimit() {
    return DOWNLOAD_SPEED_LIMIT;
}

function pauseAll() {
    downloadPaused = true;
    console.log('[下载] 全部暂停');
    downloadEmitter.emit('paused');
}

function resumeAll() {
    downloadPaused = false;
    console.log('[下载] 全部恢复');
    downloadEmitter.emit('resumed');
    // 恢复后重新处理队列（重新启动 pending 中的下载）
}

function isPaused() {
    return downloadPaused;
}

// 按速度限制计算延迟（毫秒）
function getThrottleDelay(bytesDownloaded) {
    if (DOWNLOAD_SPEED_LIMIT <= 0) return 0;
    // 每秒速率桶重置
    if (!speedTimer) {
        speedTimer = setInterval(function () { bytesThisSecond = 0; }, 1000);
        if (speedTimer.unref) speedTimer.unref(); // 不阻止进程退出
    }
    bytesThisSecond += bytesDownloaded;
    var limitBytes = DOWNLOAD_SPEED_LIMIT * 1024;
    if (bytesThisSecond > limitBytes) {
        return Math.ceil((bytesThisSecond - limitBytes) / limitBytes * 1000);
    }
    return 0;
}

module.exports = {
    downloadEpisode: downloadEpisode,
    getLocalLibrary: getLocalLibrary,
    getLocalShows: getLocalShows,
    deleteLocalEpisode: deleteLocalEpisode,
    getDownloadStatus: getDownloadStatus,
    getDownloadEmitter: getDownloadEmitter,
    setSpeedLimit: setSpeedLimit,
    getSpeedLimit: getSpeedLimit,
    pauseAll: pauseAll,
    resumeAll: resumeAll,
    isPaused: isPaused,
    DOWNLOAD_DIR: DOWNLOAD_DIR
};
