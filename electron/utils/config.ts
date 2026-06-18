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


// ==================== HTTP 请求配置 ====================
export const HTTP = {
  timeout: 8000,
  maxRedirects: 5,
  retries: 2,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
} as const
