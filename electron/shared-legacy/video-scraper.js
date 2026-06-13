// video-scraper.js - Puppeteer 视频爬虫模块
// 职责：用无头浏览器渲染页面，提取真实视频播放地址
// 运行在 Electron 主进程（Node.js 环境）

let puppeteerModule = null;
let browserInstance = null;

// Page 池 — 复用 Page 实例，避免每次搜索创建/销毁
var pagePool = [];
var MAX_POOL_SIZE = 2;

async function getPageFromPool() {
    // 池中有可用页面 → 弹出并重置到空白状态
    while (pagePool.length > 0) {
        var page = pagePool.pop();
        try {
            await page.goto('about:blank');
            return page;
        } catch (e) {
            // Page 已失效，关闭并尝试下一个
            page.close().catch(function () {});
        }
    }
    var browser = await getBrowser();
    var page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setRequestInterception(true);
    page.on('request', function (req) {
        var type = req.resourceType();
        if (type === 'image' || type === 'font' || type === 'media') {
            req.abort();
        } else {
            req.continue();
        }
    });
    return page;
}

function returnPageToPool(page) {
    if (pagePool.length < MAX_POOL_SIZE) {
        // 同步入池，重置操作延迟到 getPageFromPool 时进行
        pagePool.push(page);
    } else {
        page.close().catch(function () {});
    }
}

async function getPuppeteer() {
    if (!puppeteerModule) {
        puppeteerModule = await import('puppeteer-core');
    }
    return puppeteerModule;
}

/**
 * 启动或获取浏览器实例（复用，避免反复启动）
 */
async function getBrowser() {
    if (browserInstance) {
        try {
            if (typeof browserInstance.isConnected === 'function' && browserInstance.isConnected()) {
                return browserInstance;
            }
        } catch (e) {
            browserInstance = null;
        }
    }

    // 关闭可能残存的旧实例
    if (browserInstance) {
        try { await browserInstance.close(); } catch (e) {}
        browserInstance = null;
    }

    var ppt = await getPuppeteer();
    var launchOpts = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    };

    // 自动查找浏览器：环境变量 → Edge → Chrome → 内置Chromium
    var fs = require('fs');
    var browserPaths = [
        process.env.EDGE_PATH,
        process.env.CHROME_PATH,
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (var i = 0; i < browserPaths.length; i++) {
        if (browserPaths[i] && fs.existsSync(browserPaths[i])) {
            launchOpts.executablePath = browserPaths[i];
            console.log('[爬虫] 使用浏览器:', browserPaths[i]);
            break;
        }
    }
    if (!launchOpts.executablePath) {
        console.log('[爬虫] 未找到本地浏览器，使用内置 Chromium');
    }

    browserInstance = await ppt.launch(launchOpts);
    return browserInstance;
}

/**
 * 搜索电视剧视频播放地址
 * @param {string} showName - 剧名
 * @param {number} episodeNum - 集数
 * @returns {Promise<Object>} { type, url, title }
 */
async function scrapeVideoUrl(showName, episodeNum) {
    var searchKeyword = showName + ' 第' + episodeNum + '集 在线观看';
    console.log('[爬虫] 开始搜索:', searchKeyword);

    var page = null;
    try {
        page = await getPageFromPool();

        // 第1步：DuckDuckGo 搜索（已验证能返回中文结果）
        console.log('[爬虫] DuckDuckGo 搜索...');
        await page.goto('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(searchKeyword),
            { waitUntil: 'domcontentloaded', timeout: 15000 });
        await sleep(1500);

        var resultUrls = await page.evaluate(function () {
            var links = [];
            // DuckDuckGo HTML 结果中，result__url 包含域名路径
            var urlEls = document.querySelectorAll('.result__url');
            for (var i = 0; i < urlEls.length; i++) {
                var text = (urlEls[i].textContent || '').trim();
                // 清理多余空格和换行
                text = text.replace(/\s+/g, '');
                if (text.indexOf('http') === 0) {
                    links.push(text);
                } else if (text) {
                    links.push('https://' + text);
                }
            }

            // 去重
            var seen = {};
            var unique = [];
            for (var j = 0; j < links.length; j++) {
                if (!seen[links[j]] &&
                    links[j].indexOf('duckduckgo.com') === -1) {
                    seen[links[j]] = true;
                    unique.push(links[j]);
                }
            }
            return unique.slice(0, 8);
        });

        console.log('[爬虫] DuckDuckGo 找到', resultUrls.length, '个结果');

        // 第2步：分类结果 — 可嵌入优先
        var embeddable = [];   // 可以 iframe 嵌入的（B站、Dailymotion、YouTube）
        var webviewUrls = [];  // 需要用 webview 加载的

        for (var i = 0; i < resultUrls.length; i++) {
            var url = resultUrls[i];
            var embedUrl = tryBuildEmbedUrl(url);
            if (embedUrl) {
                embeddable.push({ url: embedUrl, source: getSourceName(url), originalUrl: url });
            } else {
                webviewUrls.push({ url: url, source: getSourceName(url) });
            }
        }

        console.log('[爬虫] 可嵌入:', embeddable.length, '个, webview:', webviewUrls.length, '个');

        // 排序：国内可用的嵌入源优先（B站 > 腾讯 > 优酷 > Dailymotion > YouTube）
        embeddable.sort(function (a, b) {
            var order = {
                'B站': 1,
                '腾讯视频': 2,
                '优酷': 3,
                '芒果TV': 4,
                'Dailymotion': 5,
                'YouTube': 6
            };
            var oa = order[a.source] || 7;
            var ob = order[b.source] || 7;
            return oa - ob;
        });

        // 优先返回可嵌入的
        if (embeddable.length > 0) {
            console.log('[爬虫] 返回可嵌入播放器:', embeddable[0].source, embeddable[0].url.substring(0, 80));
            return {
                type: 'iframe',
                url: embeddable[0].url,
                title: showName + ' 第' + episodeNum + '集',
                allUrls: embeddable.map(function (e) { return e.url; }),
                sources: embeddable.map(function (e) { return e.source; })
            };
        }

        // 其次返回 webview 可用的视频页
        if (webviewUrls.length > 0) {
            console.log('[爬虫] 返回视频页面:', webviewUrls[0].source);
            return {
                type: 'webpage',
                url: webviewUrls[0].url,
                title: showName + ' 第' + episodeNum + '集',
                allUrls: webviewUrls.map(function (w) { return w.url; }),
                sources: webviewUrls.map(function (w) { return w.source; })
            };
        }

        // 什么都没找到
        console.log('[爬虫] 未找到可播放视频');
        return { type: 'none', url: '', title: '未找到' };

    } catch (error) {
        console.log('[爬虫] 整体失败:', error.message);
        return { type: 'error', url: '', title: '搜索出错: ' + error.message };
    } finally {
        // 无论成功或异常，都归还 page 到池中，防止泄漏
        if (page) returnPageToPool(page);
    }
}

/**
 * 尝试从网页 URL 构造可嵌入的播放器 URL
 * 如果无法构造，返回 null
 */
function tryBuildEmbedUrl(url) {
    if (!url) return null;

    // B站: bilibili.com/video/BVxxx → player.bilibili.com/player.html?bvid=BVxxx
    var biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
    if (biliMatch) {
        return 'https://player.bilibili.com/player.html?bvid=' + biliMatch[1] + '&page=1&autoplay=1&danmaku=0';
    }

    // 腾讯视频: v.qq.com/x/cover/xxx/VID.html 或 v.qq.com/x/page/VID.html
    var tencentMatch = url.match(/v\.qq\.com\/x\/(?:cover|page)\/[^\/]+\/([a-zA-Z0-9]+)\.html/);
    if (!tencentMatch) {
        tencentMatch = url.match(/v\.qq\.com\/x\/page\/([a-zA-Z0-9]+)\.html/);
    }
    if (tencentMatch) {
        return 'https://v.qq.com/txp/iframe/player.html?vid=' + tencentMatch[1] + '&autoplay=1';
    }

    // 优酷: v.youku.com/v_show/id_XXXX==.html
    var youkuMatch = url.match(/v\.youku\.com\/v_show\/id_([a-zA-Z0-9=]+)\.html/);
    if (youkuMatch) {
        return 'https://player.youku.com/embed/' + youkuMatch[1] + '?autoplay=1';
    }

    // DailyMotion: dailymotion.com/video/xxx → dailymotion.com/embed/video/xxx
    var dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
    if (dmMatch) {
        return 'https://www.dailymotion.com/embed/video/' + dmMatch[1] + '?autoplay=1';
    }

    // YouTube: youtube.com/watch?v=xxx → youtube.com/embed/xxx
    var ytMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
        return 'https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=1';
    }
    // YouTube playlist or other formats
    var ytShortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (ytShortMatch) {
        return 'https://www.youtube.com/embed/' + ytShortMatch[1] + '?autoplay=1';
    }

    // Dailymotion 短链接
    var dmShort = url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
    if (dmShort) {
        return 'https://www.dailymotion.com/embed/video/' + dmShort[1] + '?autoplay=1';
    }

    // 芒果TV: mgtv.com/b/123456/987654.html
    var mgtvMatch = url.match(/mgtv\.com\/b\/\d+\/(\d+)\.html/);
    if (mgtvMatch) {
        return 'https://player.mgtv.com/video/' + mgtvMatch[1];
    }

    return null;
}

/**
 * 从 URL 判断来源名称
 */
function getSourceName(url) {
    if (!url) return '未知';
    if (url.indexOf('bilibili.com') !== -1) return 'B站';
    if (url.indexOf('v.qq.com') !== -1) return '腾讯视频';
    if (url.indexOf('iqiyi.com') !== -1 || url.indexOf('iq.com') !== -1) return '爱奇艺';
    if (url.indexOf('youku.com') !== -1) return '优酷';
    if (url.indexOf('mgtv.com') !== -1) return '芒果TV';
    if (url.indexOf('dailymotion.com') !== -1 || url.indexOf('dai.ly') !== -1) return 'Dailymotion';
    if (url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) return 'YouTube';
    if (url.indexOf('le.com') !== -1) return '乐视';
    if (url.indexOf('sohu.com') !== -1) return '搜狐';
    if (url.indexOf('sogou.com') !== -1) return '搜狗影视';
    if (url.indexOf('pptv.com') !== -1) return 'PPTV';
    if (url.indexOf('iflix.com') !== -1) return 'iFlix';
    return '在线源';
}

function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

/**
 * 清理浏览器实例
 */
async function closeBrowser() {
    if (browserInstance) {
        try {
            await browserInstance.close();
        } catch (e) {
            // 忽略
        }
        browserInstance = null;
    }
}

module.exports = {
    scrapeVideoUrl: scrapeVideoUrl,
    closeBrowser: closeBrowser
};
