// request-queue.js - 优先级请求队列
// 职责：控制并发请求数，支持优先级调度和指数退避重试
// v1: 基本队列 + 并发控制 + 状态监控

const { EventEmitter } = require('events');

// ==================== 配置 ====================
var MAX_CONCURRENT = 3;           // 最大并发数
var DEFAULT_RETRIES = 2;         // 默认重试次数
var RETRY_BASE_DELAY = 500;      // 重试基础延迟 (ms)
var STALE_TIMEOUT = 30000;       // 请求过期时间 (ms)

// ==================== 队列状态 ====================
var pending = [];                // 待处理队列 [{priority, fn, resolve, reject, retries, createdAt, label}]
var active = [];                 // 正在处理的请求
var stats = {
    total: 0,
    completed: 0,
    failed: 0,
    activeCount: 0,
    pendingCount: 0
};
var queueEmitter = new EventEmitter();

// ==================== 优先级常量 ====================
var PRIORITY = {
    HIGH: 0,      // 用户搜索请求
    NORMAL: 1,    // 详情/分类
    LOW: 2,       // 海报/后台同步
    IDLE: 3       // 预加载/缓存预热
};

// ==================== 核心入队 ====================

/**
 * 将请求加入队列
 * @param {Function} fn - 返回 Promise 的异步函数
 * @param {Object} options
 * @param {number} options.priority - PRIORITY.HIGH/NORMAL/LOW/IDLE
 * @param {number} options.retries - 最大重试次数
 * @param {string} options.label - 请求标签（用于日志和监控）
 * @returns {Promise}
 */
function enqueue(fn, options) {
    var opts = options || {};
    var priority = opts.priority != null ? opts.priority : PRIORITY.NORMAL;
    var maxRetries = opts.retries != null ? opts.retries : DEFAULT_RETRIES;
    var label = opts.label || 'unknown';

    stats.total++;

    return new Promise(function (resolve, reject) {
        var task = {
            fn: fn,
            priority: priority,
            maxRetries: maxRetries,
            retryCount: 0,
            label: label,
            resolve: resolve,
            reject: reject,
            createdAt: Date.now()
        };

        // 按优先级插入
        var inserted = false;
        for (var i = 0; i < pending.length; i++) {
            if (priority < pending[i].priority) {
                pending.splice(i, 0, task);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            pending.push(task);
        }

        updateStats();
        processQueue();
    });
}

// ==================== 队列处理 ====================

function processQueue() {
    while (active.length < MAX_CONCURRENT && pending.length > 0) {
        // 检查是否有过期任务
        var now = Date.now();
        while (pending.length > 0 && (now - pending[0].createdAt) > STALE_TIMEOUT) {
            var stale = pending.shift();
            stale.reject(new Error('请求超时（队列等待超过 ' + STALE_TIMEOUT + 'ms）'));
            stats.failed++;
        }

        if (pending.length === 0) break;

        var task = pending.shift();
        active.push(task);
        stats.activeCount = active.length;
        stats.pendingCount = pending.length;

        executeTask(task);
    }
    updateStats();
}

function executeTask(task) {
    var startTime = Date.now();

    task.fn().then(function (result) {
        // 成功
        removeActive(task);
        stats.completed++;
        updateStats();
        task.resolve(result);
    }).catch(function (err) {
        task.retryCount++;

        if (task.retryCount <= task.maxRetries) {
            // 重试：指数退避 + jitter
            var baseDelay = RETRY_BASE_DELAY * Math.pow(2, task.retryCount - 1);
            var jitter = Math.floor(Math.random() * baseDelay * 0.3);
            var delay = baseDelay + jitter;

            console.log('[队列] 重试 ' + task.label + ' (' + task.retryCount + '/' + task.maxRetries + ') ' + delay + 'ms 后:', err.message);
            removeActive(task);

            setTimeout(function () {
                // 重新入队（保持原优先级）
                pending.unshift(task);
                updateStats();
                processQueue();
            }, delay);
        } else {
            // 耗尽重试
            removeActive(task);
            stats.failed++;
            updateStats();
            task.reject(err);
        }
    });
}

function removeActive(task) {
    var idx = active.indexOf(task);
    if (idx !== -1) active.splice(idx, 1);
    stats.activeCount = active.length;
    stats.pendingCount = pending.length;
    processQueue();
}

function updateStats() {
    stats.activeCount = active.length;
    stats.pendingCount = pending.length;
    queueEmitter.emit('stats', getStats());
}

// ==================== 公开 API ====================

function getStats() {
    return {
        total: stats.total,
        completed: stats.completed,
        failed: stats.failed,
        activeCount: stats.activeCount,
        pendingCount: stats.pendingCount,
        concurrency: MAX_CONCURRENT,
        timestamp: Date.now()
    };
}

function setConcurrency(n) {
    MAX_CONCURRENT = Math.max(1, Math.min(n, 10));
    processQueue();
}

function getEmitter() {
    return queueEmitter;
}

function clearPending() {
    var count = pending.length;
    for (var i = 0; i < pending.length; i++) {
        pending[i].reject(new Error('队列已清空'));
        stats.failed++;
    }
    pending = [];
    updateStats();
    return count;
}

module.exports = {
    enqueue: enqueue,
    getStats: getStats,
    setConcurrency: setConcurrency,
    getEmitter: getEmitter,
    clearPending: clearPending,
    PRIORITY: PRIORITY
};
