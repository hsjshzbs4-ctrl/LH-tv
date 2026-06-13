// storage.js - 本地存储模块（单用户模式）
// 职责：收藏夹、观看历史、播放进度
// 双环境兼容：浏览器用 localStorage，Node.js 主进程用 JSON 文件

var _cfg = (typeof require !== 'undefined' ? require('./config.js') : null) || {};
var FAVORITES_KEY = (_cfg.STORAGE_KEYS && _cfg.STORAGE_KEYS.favorites) || 'tv_app_favorites';
var HISTORY_KEY = (_cfg.STORAGE_KEYS && _cfg.STORAGE_KEYS.history) || 'tv_app_history';
var MAX_HISTORY = (_cfg.STORAGE_LIMITS && _cfg.STORAGE_LIMITS.maxHistory) || 200;

// 判断运行环境
var _isNode = typeof require !== 'undefined' && typeof localStorage === 'undefined';
var _fs = null;
var _path = null;
var _dataDir = null;

if (_isNode) {
    _fs = require('fs');
    _path = require('path');
    _dataDir = _path.join((require('electron') && require('electron').app ? require('electron').app.getPath('userData') : _path.join(__dirname, '..', 'downloads')), 'storage');
    // 确保目录存在
    if (!_fs.existsSync(_dataDir)) {
        _fs.mkdirSync(_dataDir, { recursive: true });
    }
}

// ==================== 文件系统存储（Node.js 主进程） ====================

function _getStoreFile(key) {
    return _path.join(_dataDir, key + '.json');
}

function _fileGet(key) {
    try {
        var fp = _getStoreFile(key);
        if (_fs.existsSync(fp)) {
            return JSON.parse(_fs.readFileSync(fp, 'utf-8'));
        }
    } catch (e) { /* 忽略损坏文件 */ }
    return null;
}

function _fileSet(key, value) {
    try {
        var fp = _getStoreFile(key);
        _fs.writeFileSync(fp, JSON.stringify(value, null, 2), 'utf-8');
    } catch (e) { /* 写入失败静默 */ }
}

// ==================== 统一存储接口 ====================

function _storageGet(key) {
    if (_isNode) {
        return JSON.stringify(_fileGet(key));
    }
    return localStorage.getItem(key);
}

function _storageSet(key, value) {
    if (_isNode) {
        _fileSet(key, JSON.parse(value));
        return;
    }
    localStorage.setItem(key, value);
}

// ==================== 收藏功能 ====================

/**
 * 获取全部收藏列表
 * @returns {Array}
 */
function getFavorites() {
    if (_isNode) {
        return _fileGet(FAVORITES_KEY) || [];
    }
    var data = localStorage.getItem(FAVORITES_KEY);
    if (!data) return [];
    try { return JSON.parse(data); } catch (e) { return []; }
}

/**
 * 添加收藏
 * @param {Object} show - 剧集简要信息 { id, name, image, genres, rating }
 */
function addFavorite(show) {
    var favorites = getFavorites();
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].id === show.id) return; // 已收藏
    }
    favorites.unshift({
        id: show.id,
        name: show.name,
        image: show.image || '',
        genres: show.genres || [],
        rating: show.rating || null,
        addedAt: new Date().toISOString()
    });
    if (_isNode) {
        _fileSet(FAVORITES_KEY, favorites);
    } else {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
}

/**
 * 取消收藏
 * @param {number} showId - 剧集 ID
 */
function removeFavorite(showId) {
    if (_isNode) {
        var favs = _fileGet(FAVORITES_KEY) || [];
        _fileSet(FAVORITES_KEY, favs.filter(function (item) { return item.id !== showId; }));
        return;
    }
    var favorites = getFavorites();
    var newList = favorites.filter(function (item) { return item.id !== showId; });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newList));
}

/**
 * 检查某部剧是否已收藏
 * @param {number} showId
 * @returns {boolean}
 */
function isFavorited(showId) {
    var favorites = getFavorites();
    for (var i = 0; i < favorites.length; i++) {
        if (favorites[i].id === showId) return true;
    }
    return false;
}

// ==================== 观看历史 ====================

/**
 * 获取观看历史列表
 * @returns {Array}
 */
function getHistory() {
    if (_isNode) {
        return _fileGet(HISTORY_KEY) || [];
    }
    var data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    try { return JSON.parse(data); } catch (e) { return []; }
}

/**
 * 添加观看记录
 * @param {Object} show - 剧集信息 { id, name, image }
 * @param {Object} episode - 分集信息 { id, season, number, name }
 */
function addHistory(show, episode) {
    var history = getHistory();
    // 如果已有同一剧集同一集的记录，先移除
    history = history.filter(function (item) {
        return !(item.showId === show.id && item.episodeId === episode.id);
    });
    // 新记录放在最前面
    history.unshift({
        showId: show.id,
        showName: show.name,
        showImage: show.image || '',
        episodeId: episode.id,
        episodeName: episode.name || '',
        season: episode.season,
        episodeNumber: episode.number,
        playbackPosition: 0,
        watchedAt: new Date().toISOString()
    });
    // 限制最大条数
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    if (_isNode) {
        _fileSet(HISTORY_KEY, history);
    } else {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
}

/**
 * 获取剧集的上次播放位置（断点续播）
 * @param {string} showName
 * @param {number} episodeNum
 * @returns {number} 上次播放秒数，0 表示从头开始
 */
function getPlaybackPosition(showName, episodeNum) {
    var history = getHistory();
    for (var i = 0; i < history.length; i++) {
        if (history[i].showName === showName && history[i].episodeNumber === episodeNum) {
            return history[i].playbackPosition || 0;
        }
    }
    return 0;
}

/**
 * 保存播放进度（断点续播）
 * @param {string} showName
 * @param {number} episodeNum
 * @param {number} positionSeconds
 */
function savePlaybackPosition(showName, episodeNum, positionSeconds) {
    var history = getHistory();
    for (var i = 0; i < history.length; i++) {
        if (history[i].showName === showName && history[i].episodeNumber === episodeNum) {
            history[i].playbackPosition = positionSeconds;
            history[i].watchedAt = new Date().toISOString();
            if (_isNode) {
                _fileSet(HISTORY_KEY, history);
            } else {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
            return;
        }
    }
    // 兜底：没有历史记录时自动创建条目，确保断点续播不丢失进度
    var newEntry = {
        showId: showName,
        showName: showName,
        showImage: '',
        episodeId: showName + '_' + episodeNum,
        episodeName: '第' + episodeNum + '集',
        season: 1,
        episodeNumber: episodeNum,
        playbackPosition: positionSeconds,
        watchedAt: new Date().toISOString()
    };
    history.unshift(newEntry);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    if (_isNode) {
        _fileSet(HISTORY_KEY, history);
    } else {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
}
