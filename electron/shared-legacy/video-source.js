// video-source.js - 多源视频搜索层
// 职责：整合 AppleCMS + B站，统一搜索/详情/播放，验证 m3u8 有效性
// 运行在 Electron 主进程（Node.js 环境）

const api = require('./api-client.js');
const config = require('./config.js');

// 内容过滤
function isBlocked(name) {
    var list = (config.CONTENT_FILTER && config.CONTENT_FILTER.blockedTitles) || [];
    for (var i = 0; i < list.length; i++) {
        if (name.indexOf(list[i]) !== -1) return true;
    }
    return false;
}
const bilibili = require('./bilibili-scraper.js');
const log = require('./logger.js').createLogger('VideoSource');

// ==================== URL 验证 ====================

/**
 * 快速验证 m3u8 URL 是否可访问
 */
function validateUrl(url) {
    return new Promise(function (resolve) {
        var urlObj;
        try { urlObj = new URL(url); } catch (e) { resolve(false); return; }

        var transport = urlObj.protocol === 'https:' ? require('https') : require('http');
        var req = transport.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 3000
        }, function (res) {
            resolve(res.statusCode === 200 || res.statusCode === 206 || res.statusCode === 302);
        });
        req.on('error', function () { resolve(false); });
        req.on('timeout', function () { req.destroy(); resolve(false); });
        req.end();
    });
}

// ==================== 搜索 ====================

/**
 * 搜索剧集：AppleCMS 优先 → B站补充
 * @param {string} showName - 剧名
 * @param {number} episodeNum - 集数
 * @returns {Promise<Array>} 播放源列表
 */
async function searchEpisode(showName, episodeNum) {
    log.info('搜索: ' + showName + ' 第' + episodeNum + '集');

    // CMS 和 B站并行搜索，谁先返回用谁的结果
    var [cmsResults, biliResult] = await Promise.all([
        searchAppleCMSMulti(showName, episodeNum),
        bilibili.searchBilibiliEpisode(showName, episodeNum).catch(function (e) {
            console.log('[VideoSource] B站搜索失败:', e.message);
            return null;
        })
    ]);

    var results = cmsResults;
    if (biliResult) {
        biliResult.priority = 10; // B站优先级低于直链
        results.push(biliResult);
    }

    // 排序：有效的 m3u8 优先，然后 iframe
    results.sort(function (a, b) {
        return (a.priority || 5) - (b.priority || 5);
    });

    // 去重
    var seen = {};
    var unique = [];
    for (var i = 0; i < results.length; i++) {
        if (!seen[results[i].url]) {
            seen[results[i].url] = true;
            unique.push(results[i]);
        }
    }

    log.info('返回 ' + unique.length + ' 个播放源');
    return unique.slice(0, 8);
}

/**
 * 多站 AppleCMS 搜索
 */
async function searchAppleCMSMulti(showName, episodeNum) {
    var results = [];

    // 并行搜索全部站点
    var sites = api.SITES;

    var promises = sites.map(function (site) {
        return api.searchVideos(site, showName)
            .then(function (videos) {
                var siteResults = [];
                for (var i = 0; i < videos.length; i++) {
                    var v = videos[i];
                    // 名称匹配评分
                    var matchScore = scoreShowMatch(v.vod_name, showName);
                    if (matchScore <= 0) continue;

                    // 解析播放地址
                    var playInfo = api.getEpisodePlayUrl(
                        v.vod_play_url || '',
                        v.vod_play_from || '',
                        episodeNum
                    );

                    if (!playInfo || !playInfo.url) continue;

                    var isM3u8 = playInfo.url.indexOf('.m3u8') !== -1;
                    // 正剧加分：非短剧、非解说
                    var isDrama = isTVDrama(v.type_name || '');
                    var year = parseInt(v.vod_year, 10) || 0;

                    // 综合优先级：匹配分 + 类型分 + 年份分 + m3u8分
                    var priority = 1;
                    if (matchScore >= 100) priority = 1;      // 精确匹配
                    else if (matchScore >= 40) priority = 2;  // 词边界匹配
                    else priority = 5;                         // 模糊匹配
                    if (!isM3u8) priority += 2;
                    if (!isDrama && matchScore < 100) priority += 2; // 非电视剧降权

                    siteResults.push({
                        type: 'direct',
                        url: playInfo.url,
                        title: v.vod_name + ' 第' + episodeNum + '集',
                        source: 'applecms',
                        sourceLabel: site.name + '·' + playInfo.sourceName,
                        priority: priority,
                        extra: {
                            siteName: site.name,
                            sourceName: playInfo.sourceName,
                            isM3u8: isM3u8,
                            vodId: v.vod_id,
                            vodRemarks: v.vod_remarks || '',
                            vodYear: v.vod_year || '',
                            typeName: v.type_name || '',
                            matchScore: matchScore,
                            referer: site.apiUrl.replace(/\/api\.php.*$/, '')
                        }
                    });
                }

                // 站点内按匹配分排序
                siteResults.sort(function (a, b) {
                    var sa = a.extra.matchScore || 0;
                    var sb = b.extra.matchScore || 0;
                    if (sa !== sb) return sb - sa;
                    return (a.priority || 5) - (b.priority || 5);
                });

                return siteResults;
            })
            .catch(function (err) {
                console.log('[VideoSource]', site.name, '搜索失败:', err.message);
                return [];
            });
    });

    var allSiteResults = await Promise.all(promises);
    for (var j = 0; j < allSiteResults.length; j++) {
        results = results.concat(allSiteResults[j]);
    }

    // 后台非阻塞验证 m3u8 URL（fire-and-forget，不阻塞返回）
    var urlsToValidate = [];
    for (var k = 0; k < Math.min(results.length, 3); k++) {
        if (results[k].type === 'direct' && results[k].extra && results[k].extra.isM3u8) {
            urlsToValidate.push({ idx: k, url: results[k].url });
        }
    }
    if (urlsToValidate.length > 0) {
        // 后台异步验证，2s 短超时，不阻塞主返回
        urlsToValidate.forEach(function (item) {
            validateUrl(item.url).then(function (valid) {
                if (!valid) {
                    results[item.idx]._invalid = true;
                    console.log('[VideoSource] 无效URL:', results[item.idx].sourceLabel);
                }
            });
        });
    }

    return results;
}

/**
 * 剧名匹配评分（0=不匹配，越高越好）
 * - 精确匹配优先
 * - 完整词边界匹配
 * - 排除短剧/AI短剧干扰
 * - 排除解说/预告/花絮
 */
function scoreShowMatch(vodName, searchName) {
    if (!vodName || !searchName) return 0;
    var v = vodName.toLowerCase().replace(/\s+/g, '');
    var s = searchName.toLowerCase().replace(/\s+/g, '');

    // 完全不包含 → 0分
    if (v.indexOf(s) === -1) return 0;

    var score = 1; // 基础分：包含关键词

    // 精确完全匹配 → +200（压倒性优势）
    if (v === s) score += 200;
    // 名称以搜索词开头且紧接标点/空格/结束 → +100
    else if (v.indexOf(s) === 0) {
        var nextChar = v.charAt(s.length);
        if (!nextChar || /[\s·\-_【】《》、，。！？:：第]/.test(nextChar)) {
            score += 100;
        } else {
            score += 40; // 开头但紧接其他字（如"狂飙巨富"）
        }
    }
    // 搜索词≥3字且作为独立词出现 → +80
    else if (s.length >= 3) {
        var idx = v.indexOf(s);
        var charBefore = idx > 0 ? v.charAt(idx - 1) : ' ';
        var charAfter = (idx + s.length) < v.length ? v.charAt(idx + s.length) : ' ';
        if (/[\s·\-_【】《》、，。！？,:：]/.test(charBefore) && /[\s·\-_【】《》、，。！？,:：]/.test(charAfter)) {
            score += 80;
        }
    }

    // 排除词：AI/短剧/解说/预告/花絮 → 重罚
    var heavyPenalty = ['ai短剧', '动态漫画', '解说', '预告', '花絮', '混剪', 'reaction', 'cut'];
    for (var i = 0; i < heavyPenalty.length; i++) {
        if (v.indexOf(heavyPenalty[i]) !== -1) score -= 100;
    }
    // 短剧降分（如果不是 AI 短剧）
    if (v.indexOf('短剧') !== -1) score -= 60;
    // 游戏直播类降分
    if (v.indexOf('游戏') !== -1 || v.indexOf('直播') !== -1) score -= 40;

    // 名称长度合理性：仅当搜索词≤2字且结果名>10字（排除正常短剧名如"开端"）
    if (s.length <= 2 && v.length > 10) score -= 10;
    // 搜索词匹配但名称过长（搜索词3倍+8字）→ 降分（放宽阈值）
    if (v.length > s.length * 3 + 8) score -= 20;

    return Math.max(score, 0);
}

// 旧函数保留兼容
function isShowMatch(vodName, searchName) {
    return scoreShowMatch(vodName, searchName) > 0;
}

/**
 * 判断是否为高质量电视剧结果（非短剧、非动漫、非综艺）
 */
function isTVDrama(typeName) {
    if (!typeName) return false;
    var t = typeName.toLowerCase();
    // 排除非电视剧类型
    if (t.indexOf('动漫') !== -1) return false;
    if (t.indexOf('综艺') !== -1) return false;
    if (t.indexOf('短剧') !== -1) return false;
    if (t.indexOf('电影') !== -1) return false;
    if (t.indexOf('纪录片') !== -1) return false;
    // 电视剧标识
    if (t.indexOf('剧') !== -1) return true;
    return false;
}

// ==================== 获取详情 ====================

/**
 * 获取剧集详情（并行搜索所有站点，优先精确匹配）
 */
async function getShowDetail(showName) {
    // 并行搜索所有站点（4站并发，最大耗时 = 最慢站点 ≈ 5s）
    var sitePromises = api.SITES.map(function (site) {
        return api.searchVideos(site, showName)
            .then(function (videos) {
                var siteResults = [];
                for (var j = 0; j < videos.length; j++) {
                    var matchScore = scoreShowMatch(videos[j].vod_name, showName);
                    if (matchScore <= 0) continue;

                    var detail = videos[j];
                    var sources = api.parseAllPlaySources(
                        detail.vod_play_url || '',
                        detail.vod_play_from || ''
                    );

                    var epCount = 0;
                    for (var si = 0; si < sources.length; si++) {
                        if (sources[si].count > epCount) epCount = sources[si].count;
                    }
                    var isDrama = isTVDrama(detail.type_name || '');

                    var year = parseInt(detail.vod_year, 10) || 0;
                    var yearBonus = year >= 2023 ? 15 : (year >= 2020 ? 8 : 0);
                    var typeBonus = isDrama ? 20 : 0;

                    siteResults.push({
                        id: detail.vod_name || detail.vod_id,
                        name: detail.vod_name,
                        image: detail.vod_pic || '',
                        summary: (detail.vod_content || detail.vod_blurb || '').replace(/<[^>]*>/g, ''),
                        genres: (detail.vod_class || detail.type_name || '').split(/[,，]/),
                        rating: parseFloat(detail.vod_douban_score) || parseFloat(detail.vod_score) || null,
                        year: detail.vod_year || '',
                        area: detail.vod_area || '',
                        remarks: detail.vod_remarks || '',
                        totalEpisodes: epCount,
                        playSources: sources,
                        siteName: site.name,
                        _score: matchScore * 2 + epCount + yearBonus + typeBonus
                    });
                }
                return siteResults;
            })
            .catch(function (err) {
                console.log('[VideoSource]', site.name, '搜索失败:', err.message);
                return [];
            });
    });

    var allSiteResults = await Promise.all(sitePromises);

    // 合并所有站点结果
    var allResults = [];
    for (var i = 0; i < allSiteResults.length; i++) {
        for (var k = 0; k < allSiteResults[i].length; k++) {
            allResults.push(allSiteResults[i][k]);
        }
    }

    // 排序：精确匹配+集数多的优先
    allResults.sort(function (a, b) { return b._score - a._score; });

    return allResults.length > 0 ? allResults[0] : null;
}

// ==================== 站点缓存 ====================

var _cachedSite = null;

async function getWorkingSite() {
    if (_cachedSite) return _cachedSite;
    for (var i = 0; i < api.SITES.length; i++) {
        try {
            var resp = await api.httpGet(api.SITES[i].apiUrl + '?ac=list');
            if (resp.data && resp.data.code === 1) {
                _cachedSite = api.SITES[i];
                return _cachedSite;
            }
        } catch (e) { /* next */ }
    }
    return api.SITES[0]; // 兜底
}

// ==================== 获取首页数据 ====================

/**
 * 获取首页视频列表
 */
async function getHomeFeed() {
    try {
        var homeData = await api.getHomeData();
        if (!homeData.site) return { categories: [], videos: [] };

        return {
            categories: homeData.categories,
            videos: homeData.videos.map(formatVideoItem).filter(Boolean),
            total: homeData.total,
            siteName: homeData.site.name
        };
    } catch (e) {
        log.warn('首页获取失败: ' + e.message);
        return { categories: [], videos: [] };
    }
}

/**
 * 获取分类视频列表
 */
async function getCategoryVideos(categoryId, page) {
    try {
        var site = await getWorkingSite();
        if (!site) return { videos: [], total: 0 };

        var result = await api.getVideoList(site, categoryId, page || 1);
        return {
            videos: result.list.map(formatVideoItem).filter(Boolean),
            total: result.total,
            pagecount: result.pagecount,
            categories: result.class || []
        };
    } catch (e) {
        return { videos: [], total: 0 };
    }
}

function formatVideoItem(item) {
    var name = item.vod_name || '';
    if (isBlocked(name)) return null;
    return {
        id: item.vod_id,
        name: name,
        image: item.vod_pic || '',
        genres: (item.type_name || '').split(/[,，]/),
        rating: parseFloat(item.vod_douban_score) || parseFloat(item.vod_score) || null,
        year: item.vod_year || '',
        remarks: item.vod_remarks || '',
        typeName: item.type_name || '',
        typeId: item.type_id || 0
    };
}

module.exports = {
    searchEpisode: searchEpisode,
    getShowDetail: getShowDetail,
    getHomeFeed: getHomeFeed,
    getCategoryVideos: getCategoryVideos,
    validateUrl: validateUrl
};
