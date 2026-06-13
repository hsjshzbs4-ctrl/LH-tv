// config.js - 应用全局配置常量
// 所有硬编码常量集中管理，方便维护和修改

// ==================== 窗口配置 ====================
var WIN = {
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'LH',
    backgroundColor: '#141414'
};

// ==================== AppleCMS 资源站点 ====================
var API_SITES = [
    { key: 'guangsu', name: '光速资源', apiUrl: 'https://api.guangsuapi.com/api.php/provide/vod/', priority: 1 },
    { key: '360zy',   name: '360资源',  apiUrl: 'https://360zy.com/api.php/provide/vod/',           priority: 1 },
    { key: 'lz',      name: '量子资源',  apiUrl: 'https://cj.lziapi.com/api.php/provide/vod/',        priority: 2 },
    { key: 'feisu',   name: '非凡资源',  apiUrl: 'https://www.feisuzyapi.com/api.php/provide/vod/',   priority: 9 }
];

// ==================== Webview 安全白名单 ====================
var ALLOWED_HOSTS = [
    'bilibili.com', 'v.qq.com', 'iqiyi.com', 'youku.com',
    'mgtv.com', 'bing.com', 'baidu.com', 'duckduckgo.com'
];

// ==================== 版权保护剧集备用源 ====================
var FALLBACK_SOURCES = {
    '狂飙': [
        { label: 'B站 一口气看完', url: 'https://player.bilibili.com/player.html?bvid=BV1g72pBAEZi&page=1&autoplay=1&danmaku=0', type: 'iframe' },
        { label: 'B站 搜索狂飙',   url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent('狂飙 全集') + '&order=click', type: 'webview' },
        { label: '爱奇艺 搜索',    url: 'https://so.iqiyi.com/so/q_' + encodeURIComponent('狂飙'), type: 'webview' },
        { label: '腾讯 搜索',      url: 'https://v.qq.com/x/search/?q=' + encodeURIComponent('狂飙'), type: 'webview' }
    ]
};

// ==================== 内容过滤 ====================
var CONTENT_FILTER = {
    // 屏蔽的影视标题（支持精确匹配和包含匹配）
    blockedTitles: ['童年阴影']
};

// ==================== 本地存储键名 ====================
var STORAGE_KEYS = {
    accounts: 'tv_app_accounts',
    currentUser: 'tv_app_current_user',
    favorites: 'tv_app_favorites',
    history: 'tv_app_history'
};

// ==================== 存储限制 ====================
var STORAGE_LIMITS = {
    maxHistory: 200,
    maxInactiveDays: 30
};

// ==================== 缓存配置 ====================
var CACHE = {
    searchMaxSize: 100,
    searchTTL: 3600000,   // 1小时
    catalogUpdateInterval: 10800000  // 3小时
};

// ==================== IPC 超时（毫秒） ====================
var IPC_TIMEOUT = {
    home: 15000,
    category: 12000,
    search: 15000,
    detail: 15000,
    animeList: 12000,
    animeDetail: 12000,
    animePlay: 10000,
    download: 300000  // 5分钟
};

// ==================== 下载配置 ====================
var DOWNLOAD = {
    concurrency: 5,
    segmentTimeout: 30000
};

// ==================== 播放器配置 ====================
var PLAYER = {
    speeds: [0.5, 1, 1.25, 1.5, 2],
    defaultSpeed: 1,
    resumeSaveInterval: 5000,     // 每5秒保存进度
    resumeMinPosition: 5          // 最少跳过5秒才恢复
};

// ==================== HTTP 请求配置 ====================
var HTTP = {
    timeout: 5000,
    maxRedirects: 3,
    retries: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

var APP_CONFIG = {
    WIN: WIN,
    API_SITES: API_SITES,
    ALLOWED_HOSTS: ALLOWED_HOSTS,
    FALLBACK_SOURCES: FALLBACK_SOURCES,
    CONTENT_FILTER: CONTENT_FILTER,
    STORAGE_KEYS: STORAGE_KEYS,
    STORAGE_LIMITS: STORAGE_LIMITS,
    CACHE: CACHE,
    IPC_TIMEOUT: IPC_TIMEOUT,
    DOWNLOAD: DOWNLOAD,
    PLAYER: PLAYER,
    HTTP: HTTP
};

// 双环境导出：Node.js (module.exports) 和 浏览器 (window.APP_CONFIG)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
}
