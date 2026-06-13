// electron/config.ts - 应用全局配置常量（TypeScript 版）
import { join } from 'path'
import { app } from 'electron'

// ==================== 窗口配置 ====================
export const WIN = {
  width: 1200,
  height: 800,
  minWidth: 900,
  minHeight: 600,
  title: 'LH',
  backgroundColor: '#0a0a0f'
} as const

// ==================== 数据目录 ====================
export const DATA_DIR = join(app.getPath('userData'), 'data')
export const POSTER_DIR = join(DATA_DIR, 'posters')
export const DOWNLOADS_DIR = join(app.getPath('downloads'), 'LH')

// ==================== AppleCMS 资源站点 ====================
export interface ApiSite {
  key: string
  name: string
  apiUrl: string
  priority: number
}

export const API_SITES: ApiSite[] = [
  { key: 'guangsu', name: '光速资源', apiUrl: 'https://api.guangsuapi.com/api.php/provide/vod/', priority: 1 },
  { key: '360zy', name: '360资源', apiUrl: 'https://360zy.com/api.php/provide/vod/', priority: 1 },
  { key: 'lz', name: '量子资源', apiUrl: 'https://cj.lziapi.com/api.php/provide/vod/', priority: 2 },
  { key: 'feisu', name: '非凡资源', apiUrl: 'https://www.feisuzyapi.com/api.php/provide/vod/', priority: 9 }
]

// ==================== Webview 安全白名单 ====================
export const ALLOWED_HOSTS = [
  'bilibili.com', 'v.qq.com', 'iqiyi.com', 'youku.com',
  'mgtv.com', 'bing.com', 'baidu.com', 'duckduckgo.com'
]

// ==================== 版权保护剧集备用源 ====================
export interface FallbackSource {
  label: string
  url: string
  type: 'iframe' | 'webview'
}

export const FALLBACK_SOURCES: Record<string, FallbackSource[]> = {
  '狂飙': [
    { label: 'B站 一口气看完', url: 'https://player.bilibili.com/player.html?bvid=BV1g72pBAEZi&page=1&autoplay=1&danmaku=0', type: 'iframe' },
    { label: 'B站 搜索狂飙', url: `https://search.bilibili.com/all?keyword=${encodeURIComponent('狂飙 全集')}&order=click`, type: 'webview' },
    { label: '爱奇艺 搜索', url: `https://so.iqiyi.com/so/q_${encodeURIComponent('狂飙')}`, type: 'webview' },
    { label: '腾讯 搜索', url: `https://v.qq.com/x/search/?q=${encodeURIComponent('狂飙')}`, type: 'webview' }
  ]
}

// ==================== 内容过滤 ====================
export const CONTENT_FILTER = {
  blockedTitles: ['童年阴影']
} as const

// ==================== 本地存储键名 ====================
export const STORAGE_KEYS = {
  accounts: 'tv_app_accounts',
  currentUser: 'tv_app_current_user',
  favorites: 'tv_app_favorites',
  history: 'tv_app_history',
  playbackPosition: 'tv_app_playback'
} as const

// ==================== 存储限制 ====================
export const STORAGE_LIMITS = {
  maxHistory: 200,
  maxInactiveDays: 30
} as const

// ==================== 缓存配置 ====================
export const CACHE = {
  searchMaxSize: 100,
  searchTTL: 3600000,         // 1小时
  catalogUpdateInterval: 10800000 // 3小时
} as const

// ==================== IPC 超时（毫秒）====================
export const IPC_TIMEOUT = {
  home: 15000,
  category: 12000,
  search: 15000,
  detail: 15000,
  animeList: 12000,
  animeDetail: 12000,
  animePlay: 10000,
  download: 300000            // 5分钟
} as const

// ==================== 下载配置 ====================
export const DOWNLOAD = {
  concurrency: 5,
  segmentTimeout: 30000
} as const

// ==================== 播放器配置 ====================
export const PLAYER = {
  speeds: [0.5, 1, 1.25, 1.5, 2],
  defaultSpeed: 1,
  resumeSaveInterval: 5000,
  resumeMinPosition: 5
} as const

// ==================== HTTP 请求配置 ====================
export const HTTP = {
  timeout: 8000,
  maxRedirects: 5,
  retries: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
} as const
