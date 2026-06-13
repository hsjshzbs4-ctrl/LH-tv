// api-client.js - AppleCMS V10 完整 API 客户端
// 职责：分类、列表、搜索、详情、m3u8 播放地址解析
// 运行在 Electron 主进程（Node.js 环境）

const { httpGet } = require('./http-client.js');

// ==================== 资源站点配置 ====================

var config = require('./config.js');
var SITES = config.API_SITES;

// HTTP 请求已迁移至 shared/http-client.js（通过顶部的 require('./http-client.js') 引入）
// 调用方式：httpGet(url) 或 httpGet(url, { timeout: 15000 })

// ==================== 分类接口 ====================

/**
 * 获取站点分类列表
 * @param {Object} site - 站点配置
 * @returns {Promise<Array>} 分类数组 [{type_id, type_name, type_pid}]
 */
async function getCategories(site) {
    var url = site.apiUrl + '?ac=list';
    var resp = await httpGet(url);
    if (resp.data && resp.data.code === 1 && resp.data.class) {
        return resp.data.class;
    }
    return [];
}

/**
 * 获取所有站点的合并分类（以第一个成功站点为准）
 */
async function getMergedCategories() {
    for (var i = 0; i < SITES.length; i++) {
        try {
            var cats = await getCategories(SITES[i]);
            if (cats.length > 0) {
                console.log('[API] 从', SITES[i].name, '获取到', cats.length, '个分类');
                return { categories: cats, site: SITES[i] };
            }
        } catch (e) {
            console.log('[API]', SITES[i].name, '分类获取失败:', e.message);
        }
    }
    return { categories: [], site: null };
}

// ==================== 视频列表接口 ====================

/**
 * 获取视频列表（按分类/分页）
 * @param {Object} site - 站点
 * @param {number} categoryId - 分类ID，0=全部
 * @param {number} page - 页码，从1开始
 * @returns {Promise<Object>} { list, total, page, pagecount }
 */
async function getVideoList(site, categoryId, page) {
    var params = '?ac=list&pg=' + (page || 1);
    if (categoryId && categoryId > 0) {
        params += '&t=' + categoryId;
    }
    var url = site.apiUrl + params;
    var resp = await httpGet(url);
    if (resp.data && resp.data.code === 1) {
        return {
            list: resp.data.list || [],
            total: resp.data.total || 0,
            page: resp.data.page || 1,
            pagecount: resp.data.pagecount || 0,
            class: resp.data.class || []
        };
    }
    return { list: [], total: 0, page: 1, pagecount: 0 };
}

/**
 * 获取首页数据（从第一个可用站点）
 */
async function getHomeData() {
    for (var i = 0; i < SITES.length; i++) {
        try {
            var result = await getVideoList(SITES[i], 0, 1);
            if (result.list.length > 0) {
                console.log('[API] 首页数据来自', SITES[i].name, '共', result.total, '个视频');
                return {
                    site: SITES[i],
                    categories: result.class || [],
                    videos: result.list,
                    total: result.total,
                    pagecount: result.pagecount
                };
            }
        } catch (e) {
            console.log('[API]', SITES[i].name, '首页获取失败:', e.message);
        }
    }
    return { site: null, categories: [], videos: [], total: 0, pagecount: 0 };
}

// ==================== 搜索接口 ====================

/**
 * 搜索视频（使用 detail 模式获取完整数据含播放URL）
 * @param {Object} site - 站点
 * @param {string} keyword - 关键词
 * @returns {Promise<Array>} 视频列表（含 vod_play_url）
 */
async function searchVideos(site, keyword) {
    var url = site.apiUrl + '?ac=detail&wd=' + encodeURIComponent(keyword);
    var resp = await httpGet(url);
    if (resp.data && resp.data.code === 1 && resp.data.list) {
        return resp.data.list;
    }
    return [];
}

// ==================== 详情接口 ====================

/**
 * 获取视频详情（含完整播放地址）
 * @param {Object} site - 站点
 * @param {number} videoId - 视频ID
 * @returns {Promise<Object|null>} 完整视频对象
 */
async function getVideoDetail(site, videoId) {
    var url = site.apiUrl + '?ac=detail&ids=' + videoId;
    var resp = await httpGet(url);
    if (resp.data && resp.data.code === 1 && resp.data.list && resp.data.list.length > 0) {
        return resp.data.list[0];
    }
    return null;
}

// ==================== 播放地址解析 ====================

/**
 * 从 vod_play_url 解析所有剧集的播放地址
 *
 * 格式: "第01集$url1#第02集$url2#...$$$第01集$alt_url1#..."
 *
 * @param {string} playUrl - vod_play_url 原始字符串
 * @param {string} playFrom - vod_play_from 来源名称
 * @returns {Array} 播放源数组 [{name, episodes: [{label, number, url}]}]
 */
// 播放源代号 → 可读名称映射
var SOURCE_NAME_MAP = {
    // 光速资源
    'gsyun': '光速云', 'gsm3u8': '光速M3U8', 'guangsu': '光速',
    // 360资源
    '360m3u8': '360 M3U8', '360yun': '360云', '360zy': '360',
    // 量子资源
    'lzm3u8': '量子M3U8', 'liangzi': '量子云', 'lz': '量子',
    // 非凡资源
    'fsm3u8': '非凡M3U8', 'feisu': '非凡云', 'feisuzy': '非凡'
};

function friendlySourceName(raw) {
    if (!raw) return '';
    // 直接命中映射
    if (SOURCE_NAME_MAP[raw]) return SOURCE_NAME_MAP[raw];
    // 去掉常见后缀再试
    var cleaned = raw.replace(/m3u8$/i, '').replace(/yun$/i, '');
    if (SOURCE_NAME_MAP[cleaned]) return SOURCE_NAME_MAP[cleaned];
    // 尝试匹配站点名
    for (var i = 0; i < SITES.length; i++) {
        if (raw.indexOf(SITES[i].key) !== -1) return SITES[i].name;
    }
    // 兜底：保留原名但去掉纯乱码特征
    return raw;
}

function parseAllPlaySources(playUrl, playFrom) {
    if (!playUrl) return [];

    // 按 $$$ 分隔不同播放源
    var sourceGroups = playUrl.split('$$$');
    var sourceNames = (playFrom || '').split('$$$');

    var sources = [];

    for (var g = 0; g < sourceGroups.length; g++) {
        var group = sourceGroups[g].trim();
        if (!group) continue;

        var sourceName = friendlySourceName(sourceNames[g]) || '源' + (g + 1);
        var episodes = [];

        // 按 # 分隔剧集
        var epSegments = group.split('#');

        for (var e = 0; e < epSegments.length; e++) {
            var seg = epSegments[e].trim();
            if (!seg) continue;

            // 按第一个 $ 分隔标签和URL
            var dollarIdx = seg.indexOf('$');
            if (dollarIdx === -1) continue;

            var label = seg.substring(0, dollarIdx).trim();
            var url = seg.substring(dollarIdx + 1).trim();

            if (!url || !isPlayableUrl(url)) continue;

            episodes.push({
                label: label,
                number: extractEpNumber(label),
                url: url
            });
        }

        if (episodes.length > 0) {
            sources.push({
                name: sourceName,
                episodes: episodes,
                count: episodes.length
            });
        }
    }

    // 排序：m3u8 源优先
    sources.sort(function (a, b) {
        var aM3u8 = hasM3u8(a);
        var bM3u8 = hasM3u8(b);
        if (aM3u8 && !bM3u8) return -1;
        if (!aM3u8 && bM3u8) return 1;
        return b.count - a.count;
    });

    return sources;
}

/**
 * 获取指定剧集的播放URL
 * @param {string} playUrl - vod_play_url
 * @param {string} playFrom - vod_play_from
 * @param {number} targetEp - 目标集数
 * @returns {Object|null} {url, sourceName, label}
 */
function getEpisodePlayUrl(playUrl, playFrom, targetEp) {
    var sources = parseAllPlaySources(playUrl, playFrom);

    for (var s = 0; s < sources.length; s++) {
        var eps = sources[s].episodes;
        // 精确匹配
        for (var e = 0; e < eps.length; e++) {
            if (eps[e].number === targetEp) {
                return {
                    url: eps[e].url,
                    sourceName: sources[s].name,
                    label: eps[e].label
                };
            }
        }
        // 兜底：第一个URL
        if (eps.length > 0 && targetEp === 1) {
            return {
                url: eps[0].url,
                sourceName: sources[s].name,
                label: eps[0].label
            };
        }
    }

    return null;
}

function hasM3u8(source) {
    for (var i = 0; i < source.episodes.length; i++) {
        if (source.episodes[i].url.indexOf('.m3u8') !== -1) return true;
    }
    return false;
}

function isPlayableUrl(url) {
    if (!url) return false;
    var lower = url.toLowerCase();
    if (lower.indexOf('.jpg') !== -1 || lower.indexOf('.png') !== -1) return false;
    if (lower.indexOf('.gif') !== -1 || lower.indexOf('.webp') !== -1) return false;
    return lower.indexOf('http') === 0;
}

function extractEpNumber(label) {
    if (!label) return 0;
    var m = label.match(/第?\s*(\d+)\s*[集话回]/);
    if (m) return parseInt(m[1], 10);
    m = label.match(/[Ee][Pp]?\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = label.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
    return 0;
}

// ==================== 快捷函数 ====================

/**
 * 从第一个可用站点获取数据
 */
async function getFromFirstSite(fn, expectArray) {
    for (var i = 0; i < SITES.length; i++) {
        try {
            var result = await fn(SITES[i]);
            if (result && (Array.isArray(result) ? result.length > 0 : true)) {
                return { site: SITES[i], data: result };
            }
        } catch (e) {
            // 尝试下一个
        }
    }
    return { site: null, data: expectArray ? [] : null };
}

module.exports = {
    SITES: SITES,
    getCategories: getCategories,
    getMergedCategories: getMergedCategories,
    getVideoList: getVideoList,
    getHomeData: getHomeData,
    searchVideos: searchVideos,
    getVideoDetail: getVideoDetail,
    parseAllPlaySources: parseAllPlaySources,
    getEpisodePlayUrl: getEpisodePlayUrl,
    getFromFirstSite: getFromFirstSite,
    httpGet: httpGet
};
