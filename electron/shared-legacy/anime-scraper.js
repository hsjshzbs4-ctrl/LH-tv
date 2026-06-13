// anime-scraper.js - 樱花动漫爬虫
// 职责：解析 HTML 页面，提取动漫列表/详情/剧集/m3u8
// 来源：https://www.yinghuadongman.com.cn
//
// ⚠️ TODO: 与 tiantian-scraper.js 有 95%+ 代码重复（parseArticleItem, getAnimeList,
//    getAnimeDetail, getPlayUrl 等），应抽取公共基类 anime-base.js 避免双份维护。
//    差异仅在 BASE_URL、部分正则和详情页 HTML 结构。

const { httpGet } = require('./http-client.js');

var BASE_URL = 'https://www.yinghuadongman.com.cn';

// ==================== HTTP ====================

/**
 * HTTP GET 请求，自动拼接 BASE_URL，返回 HTML 字符串
 * 底层使用统一的 http-client.js
 */
function httpGetHtml(urlPath) {
    var fullUrl = urlPath.indexOf('http') === 0 ? urlPath : BASE_URL + urlPath;
    return httpGet(fullUrl, {
        timeout: 8000,
        headers: {
            'Referer': BASE_URL + '/',
            'Accept': 'text/html,application/xhtml+xml'
        }
    }).then(function (resp) { return resp.data; });
}

// ==================== 分类配置 ====================

var ANIME_CATEGORIES = [
    { id: '1', name: '日漫', slug: 'ri-man' },
    { id: '2', name: '国漫', slug: 'guo-man' },
    { id: '3', name: '美漫', slug: 'mei-man' },
    { id: '20', name: '动漫剧场', slug: 'dongman-juchang' }
];

// ==================== 获取动漫列表（按分类/分页） ====================

/**
 * 获取分类动漫列表
 * @param {string} catId - 分类ID (1=日漫 2=国漫 3=美漫 20=剧场)
 * @param {number} page - 页码
 */
async function getAnimeList(catId, page) {
    var url = '/h/' + catId + '/page/' + (page || 1) + '/';
    var html = await httpGetHtml(url);

    var items = [];
    // 匹配 <article class="u-movie">
    var articleRegex = /<article class="u-movie">[\s\S]*?<\/article>/g;
    var articles = html.match(articleRegex) || [];

    for (var i = 0; i < articles.length; i++) {
        var item = parseArticleItem(articles[i]);
        if (item) items.push(item);
    }

    // 提取页码信息
    var totalPages = 1;
    var pageMatch = html.match(/page\/(\d+)\/[^>]*>末页/);
    if (!pageMatch) pageMatch = html.match(/class=\"last\"[^>]*href=\"[^\"]*page\/(\d+)\//);
    if (pageMatch) totalPages = parseInt(pageMatch[1], 10);

    return { list: items, page: page || 1, totalPages: totalPages };
}

function parseArticleItem(articleHtml) {
    // 提取链接和标题
    var linkMatch = articleHtml.match(/href=\"(\/p\/\d+\/)\"/);
    var titleMatch = articleHtml.match(/<h2>([^<]+)<\/h2>/);
    var imgMatch = articleHtml.match(/data-original=\"([^\"]+)\"/) || articleHtml.match(/src=\"([^\"]*vod[^\"]*)\"/);
    var scoreMatch = articleHtml.match(/<span>([\d.]+分)<\/span>/);
    var statusMatch = articleHtml.match(/zhuangtai[^\"]*\">([^<]+)</);

    if (!linkMatch || !titleMatch) return null;

    var idMatch = linkMatch[1].match(/\/p\/(\d+)\//);
    return {
        id: idMatch ? parseInt(idMatch[1], 10) : 0,
        name: titleMatch[1].trim(),
        image: imgMatch ? imgMatch[1] : '',
        rating: scoreMatch ? parseFloat(scoreMatch[1]) : null,
        status: statusMatch ? statusMatch[1].trim() : ''
    };
}

// ==================== 获取动漫详情（含剧集列表） ====================

/**
 * 获取动漫详情
 * @param {number} animeId
 */
async function getAnimeDetail(animeId) {
    var url = '/p/' + animeId + '/';
    var html = await httpGetHtml(url);

    // 提取基本信息
    var titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    var imgMatch = html.match(/data-original=\"([^\"]+)\"/) || html.match(/<img[^>]*src=\"([^\"]*upload[^\"]*)\"/);
    var descMatch = html.match(/class=\"excerpt\"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/);
    var scoreMatch = html.match(/<span[^>]*>([\d.]+分)<\/span>/);

    // 提取剧集列表
    var episodes = [];
    var epRegex = /<a[^>]*href=\"(\/v\/(\d+)-(\d+)-(\d+)\/)\"[^>]*>第?\s*(\d+)\s*[集话]/g;
    var epMatch;

    while ((epMatch = epRegex.exec(html)) !== null) {
        episodes.push({
            url: epMatch[1],
            animeId: parseInt(epMatch[2], 10),
            season: parseInt(epMatch[3], 10),
            number: parseInt(epMatch[4], 10),
            label: '第' + epMatch[5] + '集'
        });
    }

    // 如果没有匹配到，尝试其他格式
    if (episodes.length === 0) {
        var altRegex = /<a[^>]*href=\"(\/v\/\d+-\d+-\d+\/)\"[^>]*>([^<]+)<\/a>/g;
        var altMatch;
        while ((altMatch = altRegex.exec(html)) !== null) {
            var parts = altMatch[1].match(/\/v\/(\d+)-(\d+)-(\d+)\//);
            if (parts) {
                episodes.push({
                    url: altMatch[1],
                    animeId: parseInt(parts[1], 10),
                    season: parseInt(parts[2], 10),
                    number: parseInt(parts[3], 10),
                    label: altMatch[2].trim()
                });
            }
        }
    }

    // 兜底：更宽松的 /v/ 格式 + 任意链接文本
    if (episodes.length === 0) {
        var looseRegex = /<a[^>]*href=\"(\/[^"]*\/v\/[^"]+)\"[^>]*>([^<]+)<\/a>/gi;
        var looseMatch;
        var epNumFallback = 1;
        while ((looseMatch = looseRegex.exec(html)) !== null) {
            var label = looseMatch[2].trim();
            var numMatch = label.match(/(\d+)/);
            var numFromLabel = numMatch ? parseInt(numMatch[0], 10) : epNumFallback;
            episodes.push({
                url: looseMatch[1],
                animeId: animeId,
                season: 1,
                number: numFromLabel,
                label: label || ('第' + epNumFallback + '集')
            });
            epNumFallback++;
        }
    }

    // 分类信息
    var catMatch = html.match(/href=\"\/h\/(\d+)\/[^\"]*\">([^<]+)</g);
    var categories = [];
    if (catMatch) {
        for (var c = 0; c < catMatch.length; c++) {
            var cm = catMatch[c].match(/\/h\/(\d+)\/[^\"]*\">([^<]+)</);
            if (cm) categories.push({ id: cm[1], name: cm[2] });
        }
    }

    return {
        id: animeId,
        name: titleMatch ? titleMatch[1].trim() : '',
        image: imgMatch ? imgMatch[1] : '',
        summary: descMatch ? descMatch[1].trim().replace(/<[^>]*>/g, '') : '',
        rating: scoreMatch ? parseFloat(scoreMatch[1]) : null,
        categories: categories,
        episodes: episodes,
        totalEpisodes: episodes.length
    };
}

// ==================== 获取播放 m3u8 URL ====================

/**
 * 从播放页提取 m3u8 URL
 * @param {string} playUrl - /v/{id}-{sid}-{nid}/
 */
async function getPlayUrl(playUrl) {
    var html = await httpGetHtml(playUrl);

    // 提取 player_aaaa 中的 url
    var playerMatch = html.match(/var player_aaaa\s*=\s*(\{[\s\S]*?\});/);
    if (!playerMatch) {
        // 尝试其他变量名
        playerMatch = html.match(/var\s+player\w*\s*=\s*(\{[\s\S]*?"url"\s*:\s*"[^"]+m3u8[^"]*"[\s\S]*?\});/);
    }

    if (playerMatch) {
        try {
            var playerData = JSON.parse(playerMatch[1]);
            if (playerData.url) {
                return {
                    url: playerData.url,
                    urlNext: playerData.url_next || '',
                    source: playerData.from || 'modum3u8',
                    animeId: playerData.id || '',
                    season: playerData.sid || 1,
                    episode: playerData.nid || 1
                };
            }
        } catch (e) {
            // JSON解析失败，用正则提取
            var urlMatch = playerMatch[1].match(/\"url\"\s*:\s*\"([^\"]+)\"/);
            if (urlMatch) {
                return { url: urlMatch[1].replace(/\\\//g, '/'), source: 'extracted' };
            }
        }
    }

    return null;
}

// ==================== 快捷搜索 ====================

/**
 * 搜索动漫（通过分类页提取匹配项）
 */
async function searchAnime(keyword) {
    // 搜索前几页日漫分类（包含大部分动漫）
    var results = [];
    for (var page = 1; page <= 3; page++) {
        try {
            var data = await getAnimeList('1', page);
            for (var i = 0; i < data.list.length; i++) {
                if (data.list[i].name.indexOf(keyword) !== -1) {
                    results.push(data.list[i]);
                }
            }
        } catch (e) {
            break;
        }
    }
    return results;
}

module.exports = {
    ANIME_CATEGORIES: ANIME_CATEGORIES,
    getAnimeList: getAnimeList,
    getAnimeDetail: getAnimeDetail,
    getPlayUrl: getPlayUrl,
    searchAnime: searchAnime,
    BASE_URL: BASE_URL
};
