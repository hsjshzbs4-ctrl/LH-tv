// bilibili-scraper.js - B站视频搜索模块
// 职责：WBI签名认证、剧集搜索、嵌入URL构建
// 运行在 Electron 主进程（Node.js 环境）

const { httpGet } = require('./http-client.js');
const crypto = require('crypto');

// WBI 密钥缓存
var wbiCache = {
    keys: null,
    fetchedAt: 0,
    ttlMs: 60 * 60 * 1000  // 1小时有效期
};

// HTTP 请求已迁移至 shared/http-client.js
// 调用方式：httpGet(url, { headers, timeout })
// 返回值：{ status, data, headers }，其中 data 为解析后的 JSON 对象或字符串

/**
 * 从 B站 nav 接口获取 WBI 密钥
 * 返回 { imgKey, subKey, mixinKey }
 */
async function getWbiKeys() {
    var now = Date.now();
    if (wbiCache.keys && (now - wbiCache.fetchedAt) < wbiCache.ttlMs) {
        return wbiCache.keys;
    }

    try {
        var resp = await httpGet('https://api.bilibili.com/x/web-interface/nav', {
            headers: { 'Referer': 'https://www.bilibili.com/' }
        });
        var data = resp.data;

        if (!data.data || !data.data.wbi_img) {
            throw new Error('WBI密钥获取失败: 响应缺少 wbi_img');
        }

        // wbi_img 格式: { img_url: "https://.../bfs/wbi/xxx.png", sub_url: "https://.../bfs/wbi/yyy.png" }
        var imgUrl = data.data.wbi_img.img_url || '';
        var subUrl = data.data.wbi_img.sub_url || '';

        // 从 URL 提取密钥: 最后一个 / 和 .png 之间的部分
        function extractKey(url) {
            var lastSlash = url.lastIndexOf('/');
            var dotPng = url.lastIndexOf('.png');
            if (lastSlash === -1 || dotPng === -1) return '';
            return url.substring(lastSlash + 1, dotPng);
        }

        var imgKey = extractKey(imgUrl);
        var subKey = extractKey(subUrl);

        if (!imgKey || !subKey) {
            throw new Error('WBI密钥解析失败');
        }

        // 拼接 mixinKey: subKey前4位 + imgKey前4位 + subKey剩余
        var mixinKey = subKey.substring(0, 4) + imgKey.substring(0, 4) + subKey.substring(4);

        var keys = { imgKey: imgKey, subKey: subKey, mixinKey: mixinKey };
        wbiCache.keys = keys;
        wbiCache.fetchedAt = now;
        console.log('[B站] WBI密钥已更新, mixinKey:', mixinKey);
        return keys;
    } catch (e) {
        console.log('[B站] WBI密钥获取失败:', e.message);
        // 如果有旧缓存就继续使用
        if (wbiCache.keys) {
            console.log('[B站] 使用旧的WBI密钥');
            return wbiCache.keys;
        }
        throw e;
    }
}

/**
 * WBI 签名
 * @param {Object} params - 查询参数对象
 * @param {string} mixinKey - WBI混合密钥
 * @returns {Object} 加入 w_rid 和 wts 的参数
 */
function signWbi(params, mixinKey) {
    // 添加时间戳
    var signed = Object.assign({}, params);
    signed.wts = Math.floor(Date.now() / 1000);

    // 按 key 排序
    var sortedKeys = Object.keys(signed).sort();
    var queryParts = [];
    for (var i = 0; i < sortedKeys.length; i++) {
        var key = sortedKeys[i];
        var value = signed[key];
        // 过滤掉不需要签名的特殊字符（保留原值）
        queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
    var queryStr = queryParts.join('&');

    // MD5(queryStr + mixinKey)
    var hash = crypto.createHash('md5').update(queryStr + mixinKey).digest('hex');
    signed.w_rid = hash;

    return signed;
}

/**
 * 构建 B站 搜索 URL
 */
function buildSearchUrl(params, mixinKey) {
    var signed = signWbi(params, mixinKey);
    var parts = [];
    var keys = Object.keys(signed);
    for (var i = 0; i < keys.length; i++) {
        parts.push(encodeURIComponent(keys[i]) + '=' + encodeURIComponent(signed[keys[i]]));
    }
    return 'https://api.bilibili.com/x/web-interface/wbi/search/all/v2?' + parts.join('&');
}

/**
 * 搜索 B站 视频
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array>} 搜索结果列表
 */
async function searchBilibili(keyword) {
    var keys = await getWbiKeys();

    var params = {
        keyword: keyword,
        search_type: 'video',
        page: 1,
        page_size: 20
    };

    var url = buildSearchUrl(params, keys.mixinKey);
    console.log('[B站] 搜索:', keyword);

    var resp = await httpGet(url, {
        headers: {
            'Referer': 'https://www.bilibili.com/',
            'Cookie': 'buvid3=auto-generated-buvid3-placeholder;'
        },
        timeout: 10000
    });

    var data = resp.data;

    if (data.code !== 0) {
        console.log('[B站] API返回错误码:', data.code, data.message);
        return [];
    }

    // 提取视频结果
    var results = [];
    var resultItems = (data.data && data.data.result) || [];

    for (var i = 0; i < resultItems.length; i++) {
        var item = resultItems[i];
        // 只取 video 类型，data 是数组
        if (item.result_type === 'video' && item.data && item.data.length > 0) {
            var v = item.data[0];
            results.push({
                bvid: v.bvid || '',
                aid: v.aid || 0,
                title: stripBiliHtml(v.title || ''),
                duration: v.duration || '',
                author: v.author || '',
                play: v.play || 0,
                pic: v.pic || ''
            });
        }
    }

    console.log('[B站] 找到', results.length, '个视频结果');
    return results;
}

/**
 * 剧集评分 — 评估视频标题与目标剧集的匹配度
 * @param {string} videoTitle - 视频标题
 * @param {string} showName - 剧名
 * @param {number} episodeNum - 目标集数
 * @returns {number} 匹配分数（越高越好）
 */
function scoreEpisodeMatch(videoTitle, showName, episodeNum, duration) {
    var score = 0;
    var cleanTitle = videoTitle.toLowerCase();
    var cleanShow = showName.toLowerCase();

    // 剧名匹配（需要词边界，避免"血路狂飙"匹配"狂飙"）
    var showIdx = cleanTitle.indexOf(cleanShow);
    if (showIdx !== -1) {
        var charBefore = showIdx > 0 ? cleanTitle.charAt(showIdx - 1) : ' ';
        var charAfter = (showIdx + cleanShow.length) < cleanTitle.length
            ? cleanTitle.charAt(showIdx + cleanShow.length) : ' ';
        var isWordBoundary = /[\s\[\]【】《》、，。！？,\.!\?\-_——]/.test(charBefore) &&
                             /[\s\[\]【】《》、，。！？,\.!\?\-_——]/.test(charAfter);

        if (isWordBoundary || cleanShow.length >= 3) {
            score += 15;
        } else if (cleanShow.length <= 2) {
            score += 5;
        } else {
            score += 10;
        }
    }

    // 排除明显不相关的内容
    var excludeKeywords = ['解说', '游戏', '直播', '预告', '花絮', 'cut', '混剪', 'reaction'];
    for (var k = 0; k < excludeKeywords.length; k++) {
        if (cleanTitle.indexOf(excludeKeywords[k]) !== -1) {
            score -= 10;
        }
    }

    // 集数关键词匹配
    var epStr = String(episodeNum);
    var epPatterns = [
        '第' + epStr + '集',
        '第' + epStr + '话',
        '第' + epStr + '回',
        'EP' + (epStr.length === 1 ? '0' + epStr : epStr),
        'E' + epStr,
        'P' + epStr,
        '#' + epStr
    ];

    for (var i = 0; i < epPatterns.length; i++) {
        if (cleanTitle.indexOf(epPatterns[i].toLowerCase()) !== -1) {
            score += 20;
            break;
        }
    }

    // 如果标题含"集"字但没有精确的集数匹配也加分
    if (cleanTitle.indexOf('集') !== -1) {
        score += 3;
    }

    // 时长加分：电视剧集通常10-120分钟，合集/电影降分
    try {
        var parts = (duration || '').split(':');
        var totalMinutes = 0;
        if (parts.length === 3) {
            totalMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        } else if (parts.length === 2) {
            totalMinutes = parseInt(parts[0], 10);
        }
        if (totalMinutes >= 10 && totalMinutes <= 120) {
            score += 8;
        } else if (totalMinutes > 120) {
            score += 1;
        }
    } catch (e) {
        // ignore
    }

    return score;
}

/**
 * 搜索 B站 上的指定剧集
 * @param {string} showName - 剧名
 * @param {number} episodeNum - 集数
 * @returns {Promise<Object|null>} 最佳匹配结果
 */
async function searchBilibiliEpisode(showName, episodeNum) {
    var epStr = String(episodeNum);

    // 多种搜索词按优先级尝试
    var queries = [
        showName + ' 第' + epStr + '集',
        showName + ' EP' + (epStr.length === 1 ? '0' + epStr : epStr),
        showName + ' ' + epStr
    ];

    var allResults = [];
    var seenBvids = {};

    // 并行搜索3个query（最大耗时 = 最慢请求 ≈ 3s）
    var queryResults = await Promise.all(
        queries.map(function (q) {
            return searchBilibili(q).catch(function (e) {
                console.log('[B站] 搜索词"' + q + '"失败:', e.message);
                return [];
            });
        })
    );

    for (var q = 0; q < queryResults.length; q++) {
        for (var i = 0; i < queryResults[q].length; i++) {
            var r = queryResults[q][i];
            if (!seenBvids[r.bvid]) {
                seenBvids[r.bvid] = true;
                allResults.push(r);
            }
        }
    }

    if (allResults.length === 0) {
        console.log('[B站] 未找到', showName, '第', episodeNum, '集');
        return null;
    }

    // 评分排序
    var scored = [];
    for (var j = 0; j < allResults.length; j++) {
        var s = scoreEpisodeMatch(allResults[j].title, showName, episodeNum, allResults[j].duration);
        scored.push({ result: allResults[j], score: s });
    }

    scored.sort(function (a, b) { return b.score - a.score; });

    var best = scored[0];
    console.log('[B站] 最佳匹配:', best.result.title, '分数:', best.score);

    if (best.score < 10) {
        console.log('[B站] 匹配度过低，不推荐');
        return null;
    }

    return {
        type: 'iframe',
        url: getBilibiliEmbedUrl(best.result.bvid),
        title: best.result.title,
        source: 'bilibili',
        sourceLabel: 'B站播放器',
        priority: 2,
        extra: {
            bvid: best.result.bvid,
            aid: best.result.aid,
            author: best.result.author,
            pic: best.result.pic
        }
    };
}

/**
 * 构建 B站 播放器嵌入 URL
 * @param {string} bvid - B站视频 BV 号
 * @returns {string} 嵌入播放器 URL
 */
function getBilibiliEmbedUrl(bvid) {
    return 'https://player.bilibili.com/player.html?bvid=' + bvid +
        '&page=1&autoplay=1&danmaku=0&high_quality=1';
}

/**
 * 去除 B站返回的 HTML 标签
 */
function stripBiliHtml(text) {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '');
}

module.exports = {
    searchBilibili: searchBilibili,
    searchBilibiliEpisode: searchBilibiliEpisode,
    getBilibiliEmbedUrl: getBilibiliEmbedUrl,
    getWbiKeys: getWbiKeys
};
