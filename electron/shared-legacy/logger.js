// logger.js - 结构化日志模块
// 职责：分级日志（DEBUG/INFO/WARN/ERROR），带时间戳和模块名
// 替换散落的 console.log，方便调试和问题追踪

var LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
var currentLevel = LEVELS.DEBUG; // 默认全开

function setLevel(level) {
    if (LEVELS[level] !== undefined) {
        currentLevel = LEVELS[level];
    }
}

function formatTime() {
    var now = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return now.getFullYear() + '-' +
        pad(now.getMonth() + 1) + '-' +
        pad(now.getDate()) + ' ' +
        pad(now.getHours()) + ':' +
        pad(now.getMinutes()) + ':' +
        pad(now.getSeconds());
}

function log(level, module, message, data) {
    if (LEVELS[level] === undefined || LEVELS[level] < currentLevel) return;

    var prefix = '[' + formatTime() + '] [' + level + '] [' + module + ']';
    var line = prefix + ' ' + message;

    if (data !== undefined) {
        if (level === 'ERROR') {
            console.error(line, data);
        } else if (level === 'WARN') {
            console.warn(line, data);
        } else {
            console.log(line, data);
        }
    } else {
        if (level === 'ERROR') {
            console.error(line);
        } else if (level === 'WARN') {
            console.warn(line);
        } else {
            console.log(line);
        }
    }
}

// 便捷方法
function debug(module, message, data) { log('DEBUG', module, message, data); }
function info(module, message, data)  { log('INFO',  module, message, data); }
function warn(module, message, data)  { log('WARN',  module, message, data); }
function error(module, message, data) { log('ERROR', module, message, data); }

/**
 * 创建一个带模块名的 logger 实例
 * var log = createLogger('Downloader');
 * log.info('下载完成', { file: 'x.mp4' });
 */
function createLogger(moduleName) {
    return {
        debug: function (msg, data) { debug(moduleName, msg, data); },
        info:  function (msg, data) { info(moduleName, msg, data); },
        warn:  function (msg, data) { warn(moduleName, msg, data); },
        error: function (msg, data) { error(moduleName, msg, data); }
    };
}

module.exports = {
    LEVELS: LEVELS,
    setLevel: setLevel,
    debug: debug,
    info: info,
    warn: warn,
    error: error,
    createLogger: createLogger
};
