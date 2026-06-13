// tiantian-scraper.js - 天天动漫爬虫
// 职责：解析 HTML 页面，提取动漫列表/详情/剧集/m3u8
// 来源：https://m.tiantiandongman.com
//
// ⚠️ TODO: 与 anime-scraper.js 有 95%+ 代码重复（parseArticleItem, getAnimeList,
//    getAnimeDetail, getPlayUrl 等），应抽取公共基类 anime-base.js 避免双份维护。
//    差异仅在 BASE_URL、部分正则和详情页 HTML 结构。

const { httpGet } = require('./http-client.js');

var BASE_URL = 'https://m.tiantiandongman.com';

// ==================== HTTP 包装 ====================

function fetchHtml(urlPath) {
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

// ==================== 获取动漫列表 ====================

/**
 * 获取分类动漫列表
 * @param {string} catId - 分类ID (1=日漫 2=国漫 3=美漫 20=剧场)
 * @param {number} page - 页码
 */
async function getAnimeList(catId, page) {
    var url = '/h/' + catId + '/';
    if (page && page > 1) {
        url = '/h/' + catId + '/page/' + page + '/';
    }
    var html = await fetchHtml(url);

    var items = [];
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
    // 如果只有一页内容且不足12个，totalPages=1
    if (items.length < 12) totalPages = 1;

    return { list: items, page: page || 1, totalPages: totalPages };
}

function parseArticleItem(articleHtml) {
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

// ==================== 获取动漫详情 ====================

/**
 * 获取动漫详情（含剧集列表）
 * @param {number} animeId
 */
async function getAnimeDetail(animeId) {
    var url = '/p/' + animeId + '/';
    var html = await fetchHtml(url);

    // 基本信息
    var titleMatch = html.match(/<h1 class=\"article-title\">[^<]*<a[^>]*>([^<]+)<\/a><\/h1>/);
    if (!titleMatch) titleMatch = html.match(/class=\"article-title\"[^>]*>\s*<a[^>]*>([^<]+)</);
    if (!titleMatch) titleMatch = html.match(/<title>(.+?)(?:\s*[|\\-]\s*天天动漫|\s*-\s*)/);
    if (!titleMatch) titleMatch = html.match(/<title>([^<]+)/);
    var imgMatch = html.match(/<img[^>]*src=\"([^\"]+)\"[^>]*class=\"thumb\"/) || html.match(/data-original=\"([^\"]+)\"/);
    // 优先取 .video_img 里的图片
    if (!imgMatch) imgMatch = html.match(/<div class=\"video_img\">[\s\S]*?<img[^>]*src=\"([^\"]+)\"/);
    var descMatch = html.match(/class=\"jianjie\"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/);
    if (!descMatch) descMatch = html.match(/class=\"excerpt\"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/);
    var scoreMatch = html.match(/<span[^>]*>([\d.]+分)<\/span>/);
    if (!scoreMatch) scoreMatch = html.match(/评分[：:][^>]*>([\d.]+)/);

    // 提取多线路剧集 —— 按 <h4 class="ctitle"> 分割
    var sources = [];
    var mainContent = html;
    var cutIdx = html.indexOf('相关推荐');
    if (cutIdx === -1) cutIdx = html.indexOf('相关搜索');
    if (cutIdx === -1) cutIdx = html.indexOf('class=\"relate\"');
    if (cutIdx > 0) mainContent = html.substring(0, cutIdx);

    // 按 <h4 class="ctitle"> 分割，每段包含线路名+剧集
    var sections = mainContent.split(/<h4 class=\"ctitle\">/);

    for (var si = 1; si < sections.length; si++) {
        var section = sections[si];
        var nameMatch = section.match(/<strong>([^<]+)<\/strong>/);
        if (!nameMatch) continue;

        var sourceName = nameMatch[1].trim();
        var episodes = [];

        // 解析 /v/{id}-{sid}-{nid}/
        var epRegex = /<a[^>]*href=\"(\/v\/(\d+)-(\d+)-(\d+)\/)\"[^>]*>([^<]+)<\/a>/g;
        var epMatch;
        while ((epMatch = epRegex.exec(section)) !== null) {
            var label = epMatch[4].trim();
            var epNum = 0;
            var numMatch = label.match(/(\d+)/);
            if (numMatch) epNum = parseInt(numMatch[1], 10);

            episodes.push({
                url: epMatch[1],
                animeId: parseInt(epMatch[2], 10),
                season: parseInt(epMatch[3], 10),
                number: epNum,
                label: label
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

    // 兼容单线路格式
    if (sources.length === 0) {
        var episodes = [];
        var epRegex2 = /<a[^>]*href=\"(\/v\/(\d+)-(\d+)-(\d+)\/)\"[^>]*>第?\s*(\d+)\s*[集话]/g;
        var epMatch2;

        while ((epMatch2 = epRegex2.exec(mainContent)) !== null) {
            episodes.push({
                url: epMatch2[1],
                animeId: parseInt(epMatch2[2], 10),
                season: parseInt(epMatch2[3], 10),
                number: parseInt(epMatch2[4], 10),
                label: '第' + epMatch2[5] + '集'
            });
        }

        // 备用格式
        if (episodes.length === 0) {
            var altRegex = /<a[^>]*href=\"(\/v\/\d+-\d+-\d+\/)\"[^>]*>([^<]+)<\/a>/g;
            var altMatch;
            while ((altMatch = altRegex.exec(mainContent)) !== null) {
                var parts = altMatch[1].match(/\/v\/(\d+)-(\d+)-(\d+)\//);
                if (parts) {
                    var numFromLabel = 0;
                    var nm = altMatch[2].match(/(\d+)/);
                    if (nm) numFromLabel = parseInt(nm[1], 10);
                    episodes.push({
                        url: altMatch[1],
                        animeId: parseInt(parts[1], 10),
                        season: parseInt(parts[2], 10),
                        number: numFromLabel,
                        label: altMatch[2].trim()
                    });
                }
            }
        }

        if (episodes.length > 0) {
            sources.push({ name: '默认线路', episodes: episodes, count: episodes.length });
        }
    }

    // 分类
    var categories = [];
    var catMatch = html.match(/href=\"\/h\/(\d+)\/[^\"]*\">([^<]+)</g);
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
        playSources: sources,  // 用 playSources 保持与 AppleCMS 一致
        episodes: sources.length > 0 ? sources[0].episodes : [], // 兼容旧格式
        totalEpisodes: sources.length > 0 ? sources[0].count : 0
    };
}

// ==================== 获取播放 m3u8 URL ====================

/**
 * 从播放页提取 m3u8/视频 URL
 * @param {string} playUrl - /v/{id}-{sid}-{nid}/
 */
async function getPlayUrl(playUrl) {
    var html = await fetchHtml(playUrl);

    // 提取 player_aaaa 中的 url（同樱花动漫）
    var playerMatch = html.match(/var player_aaaa\s*=\s*(\{[\s\S]*?\});/);
    if (!playerMatch) {
        playerMatch = html.match(/var\s+player\w*\s*=\s*(\{[\s\S]*?"url"\s*:\s*"[^"]+m3u8[^"]*"[\s\S]*?\});/);
    }

    if (playerMatch) {
        try {
            var playerData = JSON.parse(playerMatch[1]);
            if (playerData.url) {
                return {
                    url: playerData.url,
                    urlNext: playerData.url_next || '',
                    source: playerData.from || 'tiantian',
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

    // 备用：查找 iframe src
    var iframeMatch = html.match(/<iframe[^>]*src=\"([^\"]+)\"[^>]*>/i);
    if (iframeMatch) {
        var iframeUrl = iframeMatch[1];
        if (iframeUrl.indexOf('http') !== 0) iframeUrl = 'https:' + iframeUrl;
        return { url: iframeUrl, source: 'iframe' };
    }

    return null;
}

// ==================== 搜索 ====================

/**
 * 直接搜索动漫（比遍历分类页更高效）
 * @param {string} keyword
 */
async function searchAnime(keyword) {
    var url = '/u/?wd=' + encodeURIComponent(keyword);
    var html = await fetchHtml(url);

    var items = [];
    var articleRegex = /<article class="u-movie">[\s\S]*?<\/article>/g;
    var articles = html.match(articleRegex) || [];

    for (var i = 0; i < articles.length; i++) {
        var item = parseArticleItem(articles[i]);
        if (item) items.push(item);
    }

    return items;
}

module.exports = {
    ANIME_CATEGORIES: ANIME_CATEGORIES,
    getAnimeList: getAnimeList,
    getAnimeDetail: getAnimeDetail,
    getPlayUrl: getPlayUrl,
    searchAnime: searchAnime,
    BASE_URL: BASE_URL
};
