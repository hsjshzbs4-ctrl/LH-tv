// cache-manager.js - 统一缓存层
// 职责：LRU淘汰 + TTL过期，用于搜索缓存等场景

/**
 * @param {Object} opts - { maxSize, ttlMs }
 */
function CacheManager(opts) {
    if (!(this instanceof CacheManager)) return new CacheManager(opts);
    var options = opts || {};
    this.maxSize = options.maxSize || 200;
    this.ttlMs = options.ttlMs || 60 * 60 * 1000; // 默认1小时
    this.store = {};
    this.accessOrder = []; // LRU 访问顺序（最近访问在末尾）
}

CacheManager.prototype.get = function (key) {
    var entry = this.store[key];
    if (!entry) return null;
    // TTL 过期检查
    if (Date.now() - entry.timestamp > this.ttlMs) {
        this.delete(key);
        return null;
    }
    // 更新 LRU
    this._touch(key);
    return entry.value;
};

CacheManager.prototype.set = function (key, value) {
    // 已存在则更新
    if (this.store[key]) {
        this.store[key].value = value;
        this.store[key].timestamp = Date.now();
        this._touch(key);
        return;
    }
    // LRU 淘汰：超出容量时删除最早访问的
    while (this.accessOrder.length >= this.maxSize) {
        var oldest = this.accessOrder.shift();
        delete this.store[oldest];
    }
    this.store[key] = { value: value, timestamp: Date.now() };
    this.accessOrder.push(key);
};

CacheManager.prototype.delete = function (key) {
    delete this.store[key];
    var idx = this.accessOrder.indexOf(key);
    if (idx !== -1) this.accessOrder.splice(idx, 1);
};

CacheManager.prototype.clear = function () {
    this.store = {};
    this.accessOrder = [];
};

CacheManager.prototype.size = function () {
    return this.accessOrder.length;
};

CacheManager.prototype._touch = function (key) {
    var idx = this.accessOrder.indexOf(key);
    if (idx !== -1) this.accessOrder.splice(idx, 1);
    this.accessOrder.push(key);
};

module.exports = CacheManager;
