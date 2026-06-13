// http-client.js - 统一 HTTP 请求客户端
// 职责：GET 请求、重定向跟随、超时控制、自动重试
// 替代 api-client/downloader/bilibili-scraper/anime-scraper 中各自实现的 httpGet

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * HTTP GET 请求
 * @param {string} url - 请求URL
 * @param {Object} opts - 可选配置
 * @param {Object} opts.headers - 额外请求头
 * @param {number} opts.timeout - 超时ms (默认8000)
 * @param {boolean} opts.binary - 返回Buffer (默认false返回string)
 * @param {number} opts.maxRedirects - 最大重定向次数 (默认5)
 * @returns {Promise<{status, data, headers}>} 响应对象，data为JSON对象/字符串/Buffer
 */
function httpGet(url, opts) {
    return new Promise(function (resolve, reject) {
        var options = opts || {};
        var timeout = options.timeout || require('./config.js').HTTP.timeout;
        var binary = options.binary || false;
        var maxRedirects = options.maxRedirects || 5;
        var redirectCount = 0;

        function doRequest(targetUrl, inheritedHeaders) {
            var urlObj;
            try { urlObj = new URL(targetUrl); } catch (e) { reject(e); return; }

            var transport = urlObj.protocol === 'https:' ? https : http;

            var req = transport.request({
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: Object.assign({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': '*/*'
                }, inheritedHeaders || {}, options.headers || {}),
                timeout: timeout
            }, function (res) {
                // 处理重定向
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    redirectCount++;
                    if (redirectCount > maxRedirects) {
                        reject(new Error('重定向次数过多'));
                        return;
                    }
                    // 解析重定向目标：支持相对路径（如 /new-path）和绝对 URL
                    var redirectUrl = res.headers.location;
                    try {
                        redirectUrl = new URL(redirectUrl, targetUrl).href;
                    } catch (e) {
                        reject(new Error('重定向URL解析失败: ' + e.message));
                        return;
                    }
                    // 传递已合并的请求头，确保重定向链不丢失自定义头
                    doRequest(redirectUrl, Object.assign({}, options.headers || {}, inheritedHeaders || {}));
                    return;
                }

                var chunks = [];
                res.on('data', function (c) { chunks.push(c); });
                res.on('end', function () {
                    var buf = Buffer.concat(chunks);

                    if (binary) {
                        resolve({ status: res.statusCode, data: buf, headers: res.headers });
                    } else {
                        var body = buf.toString('utf-8');
                        // 尝试解析 JSON（仅当响应以 { 或 [ 开头）
                        if (body && (body.trim()[0] === '{' || body.trim()[0] === '[')) {
                            try {
                                resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
                            } catch (e) {
                                console.log('[HTTP] JSON解析失败:', targetUrl, e.message);
                                resolve({ status: res.statusCode, data: body, headers: res.headers });
                            }
                        } else {
                            resolve({ status: res.statusCode, data: body, headers: res.headers });
                        }
                    }
                });
            });

            req.on('error', function (e) { reject(e); });
            req.on('timeout', function () { req.destroy(); reject(new Error('HTTP请求超时 (' + timeout + 'ms)')); });
            req.end();
        }

        doRequest(url);
    });
}

/**
 * 带自动重试的 HTTP GET
 * @param {string} url
 * @param {Object} opts - 同 httpGet，额外支持 retries
 * @param {number} opts.retries - 最大重试次数 (默认2)
 * @returns {Promise}
 */
function httpGetWithRetry(url, opts) {
    var retries = (opts && opts.retries) || 2;
    var lastErr = null;

    function attempt(n) {
        return httpGet(url, opts).catch(function (err) {
            lastErr = err;
            if (n > 0) {
                return new Promise(function (r) {
                    setTimeout(function () { r(attempt(n - 1)); }, 1000);
                });
            }
            throw lastErr;
        });
    }

    return attempt(retries);
}

// 懒加载队列（避免循环依赖）
var _queue = null;
function getQueue() {
    if (!_queue) {
        try { _queue = require('./request-queue.js'); } catch (e) { _queue = null; }
    }
    return _queue;
}

/**
 * 通过请求队列发送 HTTP GET（限流 + 优先级）
 * @param {string} url
 * @param {Object} opts - 同 httpGet，额外支持 priority 和 label
 * @returns {Promise}
 */
function httpGetQueued(url, opts) {
    var queue = getQueue();
    if (!queue) {
        // 队列不可用时回退到直接请求
        return httpGet(url, opts);
    }

    return queue.enqueue(
        function () { return httpGet(url, opts); },
        {
            priority: (opts && opts.priority) || queue.PRIORITY.NORMAL,
            retries: (opts && opts.retries) || 2,
            label: (opts && opts.label) || url.substring(0, 60)
        }
    );
}

module.exports = {
    httpGet: httpGet,
    httpGetWithRetry: httpGetWithRetry,
    httpGetQueued: httpGetQueued
};
