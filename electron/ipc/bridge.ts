// electron/ipc/bridge.ts - 旧模块运行时桥接
// 通过 Node.js require() 加载 LH-YS 项目中的 shared/ 模块
// electron-vite 会将此文件编译进主进程 bundle

import { join } from 'path'
import { IPCEvent } from '@shared/ipc/ipc.channels'

// 旧项目路径（运行时解析）
// 开发模式：相对于项目根目录
// 生产模式：相对于 asar 包位置
// 本地副本，打包时一并打入 asar
// 开发: out/main/ → ../shared-legacy/
// 打包: app.asar/out/main/ → ../shared-legacy/
const LEGACY_SHARED_DIR = join(__dirname, '../shared-legacy')

function loadModule<T>(relativePath: string): T {
  const fullPath = join(LEGACY_SHARED_DIR, relativePath)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(fullPath) as T
}

// ==================== IPC 注册函数类型 ====================
interface IpcRegistrar {
  registerSearchIpc: (ipcMain: Electron.IpcMain) => void
}

interface AnimeIpcRegistrar {
  registerAnimeIpc: (ipcMain: Electron.IpcMain) => void
}

interface DownloadIpcRegistrar {
  registerDownloadIpc: (ipcMain: Electron.IpcMain) => void
  setMainWindow: (win: Electron.BrowserWindow | null) => void
}

interface CatalogIpcRegistrar {
  registerCatalogIpc: (ipcMain: Electron.IpcMain) => void
}

interface PosterIpcRegistrar {
  registerPosterIpc: (ipcMain: Electron.IpcMain) => void
}

// ==================== 懒加载缓存 ====================
let _searchIpc: IpcRegistrar | null = null
let _animeIpc: AnimeIpcRegistrar | null = null
let _downloadIpc: DownloadIpcRegistrar | null = null
let _catalogIpc: CatalogIpcRegistrar | null = null
let _posterIpc: PosterIpcRegistrar | null = null

export function getSearchIpc(): IpcRegistrar {
  if (!_searchIpc) _searchIpc = loadModule<IpcRegistrar>('ipc/search-ipc.js')
  return _searchIpc
}

export function getAnimeIpc(): AnimeIpcRegistrar {
  if (!_animeIpc) _animeIpc = loadModule<AnimeIpcRegistrar>('ipc/anime-ipc.js')
  return _animeIpc
}

export function getDownloadIpc(): DownloadIpcRegistrar {
  if (!_downloadIpc) _downloadIpc = loadModule<DownloadIpcRegistrar>('ipc/download-ipc.js')
  return _downloadIpc
}

export function getCatalogIpc(): CatalogIpcRegistrar {
  if (!_catalogIpc) _catalogIpc = loadModule<CatalogIpcRegistrar>('ipc/catalog-ipc.js')
  return _catalogIpc
}

export function getPosterIpc(): PosterIpcRegistrar {
  if (!_posterIpc) _posterIpc = loadModule<PosterIpcRegistrar>('ipc/poster-ipc.js')
  return _posterIpc
}

// ==================== 海报刷新 ====================
// 全局窗口引用（供海报抓取完成后通知UI刷新用）
let _posterNotifyWindow: import('electron').BrowserWindow | null = null

export function setPosterNotifyWindow(win: import('electron').BrowserWindow | null) {
  _posterNotifyWindow = win
}

export async function refreshAllPosters(notifyWindow?: import('electron').BrowserWindow | null): Promise<{ ok: boolean; total: number; toRefresh: number; error?: string }> {
  try {
    const posterFetcher = loadModule<{
      getCachedPoster: (name: string, year?: number) => string | null
      clearPosterMeta: () => void
      batchFetchPosters: (shows: Array<{ name: string; year?: number; type: string; tags: string[] }>, onProgress: unknown, delayMs: number) => Promise<Record<string, string>>
    }>('poster-fetcher.js')

    const yearCatalog = loadModule<{
      CATALOG: Record<string, Record<string, Array<{ name: string; year?: number; tags?: string[] }>>>
    }>('year-catalog.js')

    // 不清除元数据 — 增量刷新，只更新没有本地文件的海报

    // 收集全部条目：year-catalog + anime-catalog + jp/kr-movie
    const allShows: Array<{ name: string; year?: number; type: string; tags: string[] }> = []
    const allTypes = ['tv', 'movie', 'anime']
    for (const type of allTypes) {
      const cat = yearCatalog.CATALOG[type]
      if (!cat) continue
      const subs = Object.keys(cat)
      for (const sub of subs) {
        const items = cat[sub]
        if (Array.isArray(items)) {
          for (const item of items) {
            allShows.push({
              name: item.name,
              year: item.year,
              type,
              tags: item.tags || []
            })
          }
        }
      }
    }

    // 追加 anime-catalog.js 的动漫条目
    try {
      const animeCatalog = loadModule<{ getAll: () => Array<{ name: string; year?: number; tags?: string[] }> }>('anime-catalog.js')
      const animeItems = animeCatalog.getAll()
      if (Array.isArray(animeItems)) {
        for (const item of animeItems) {
          allShows.push({
            name: item.name,
            year: item.year,
            type: 'anime',
            tags: item.tags || []
          })
        }
      }
    } catch (e) { /* ignore */ }

    // 追加日本电影目录
    try {
      const jpMovies = loadModule<Array<{ name: string; year?: number }>>('../../jp-movie-catalog.json')
      if (Array.isArray(jpMovies)) {
        for (const item of jpMovies) {
          allShows.push({ name: item.name, year: item.year, type: 'movie', tags: [] })
        }
      }
    } catch (e) { /* ignore */ }

    // 追加韩国电影目录
    try {
      const krMovies = loadModule<Array<{ name: string; year?: number }>>('../../kr-movie-catalog.json')
      if (Array.isArray(krMovies)) {
        for (const item of krMovies) {
          allShows.push({ name: item.name, year: item.year, type: 'movie', tags: [] })
        }
      }
    } catch (e) { /* ignore */ }

    // 只刷新没有本地海报的（file:// 开头说明已本地化）
    const needRefresh: Array<{ name: string; year?: number; type: string; tags: string[] }> = []
    for (const show of allShows) {
      const cached = posterFetcher.getCachedPoster(show.name, show.year)
      if (!cached || (typeof cached === 'string' && cached.indexOf('file:///') !== 0)) {
        needRefresh.push(show)
      }
    }

    console.log('[海报刷新] 共 ' + allShows.length + ' 部，需刷新 ' + needRefresh.length + ' 部')

    const win = notifyWindow || _posterNotifyWindow

    if (needRefresh.length > 0) {
      // 异步批量抓取，完成后通知UI刷新
      posterFetcher.batchFetchPosters(needRefresh, null, 500).then((result: Record<string, string>) => {
        const fetched = Object.keys(result).length
        console.log('[海报刷新] 搜索完成: ' + fetched + '/' + needRefresh.length)
        // 通知渲染进程刷新海报
        if (win && !win.isDestroyed()) {
          win.webContents.send(IPCEvent.POSTERS_UPDATED, { fetched, total: needRefresh.length })
        }
      })
    } else {
      // 无需抓取，但也要通知UI（海报缓存完整）
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPCEvent.POSTERS_UPDATED, { fetched: 0, total: 0 })
      }
    }

    return { ok: true, total: allShows.length, toRefresh: needRefresh.length }
  } catch (e) {
    return { ok: false, total: 0, toRefresh: 0, error: (e as Error).message }
  }
}

// 强制全量刷新：清除所有缓存，重新抓取全部海报
export async function forceRefreshAllPosters(): Promise<{ ok: boolean; total: number; error?: string }> {
  try {
    const posterFetcher = loadModule<{
      getCachedPoster: (name: string, year?: number) => string | null
      clearPosterMeta: () => void
      batchFetchPosters: (shows: Array<{ name: string; year?: number; type: string; tags: string[] }>, onProgress: unknown, delayMs: number) => Promise<Record<string, string>>
      // 运行时访问 posterCache 对象
    }>('poster-fetcher.js')

    const fs = require('fs')
    const path = require('path')
    const { getDataPath } = require('../shared-legacy/data-paths.js')

    // 清空内存缓存
    posterFetcher.clearPosterMeta()

    // 清空磁盘缓存文件
    const cacheFile = getDataPath('_poster_cache.json')
    try { if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile) } catch (e) {}
    const metaFile = getDataPath('posters/_poster_meta.json')
    try { if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile) } catch (e) {}

    // 删除旧海报文件
    const posterDir = getDataPath('posters')
    try {
      if (fs.existsSync(posterDir)) {
        const files = fs.readdirSync(posterDir)
        for (const f of files) {
          if (f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp') || f.startsWith('_')) {
            try { fs.unlinkSync(path.join(posterDir, f)) } catch (e) {}
          }
        }
        const cleanedCount = files.filter((f: string) => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp')).length
        console.log('[海报刷新] 已清除 ' + cleanedCount + ' 个旧海报文件')
      }
    } catch (e) {}

    const yearCatalog = loadModule<{
      CATALOG: Record<string, Record<string, Array<{ name: string; year?: number; tags?: string[] }>>>
    }>('year-catalog.js')

    // 收集全部条目（全部需要刷新）
    const allShows: Array<{ name: string; year?: number; type: string; tags: string[] }> = []
    const allTypes = ['tv', 'movie', 'anime']
    for (const type of allTypes) {
      const cat = yearCatalog.CATALOG[type]
      if (!cat) continue
      const subs = Object.keys(cat)
      for (const sub of subs) {
        const items = cat[sub]
        if (Array.isArray(items)) {
          for (const item of items) {
            allShows.push({
              name: item.name,
              year: item.year,
              type,
              tags: item.tags || []
            })
          }
        }
      }
    }

    console.log('[海报强制刷新] 共 ' + allShows.length + ' 部，全部重新抓取（豆瓣优先）')

    // 异步批量抓取
    posterFetcher.batchFetchPosters(allShows, null, 500).then((result: Record<string, string>) => {
      console.log('[海报强制刷新] 完成: ' + Object.keys(result).length + '/' + allShows.length)
    })

    return { ok: true, total: allShows.length }
  } catch (e) {
    return { ok: false, total: 0, error: (e as Error).message }
  }
}

// ==================== 爬虫/海报浏览器清理 ====================
export async function closeBrowsers(): Promise<void> {
  try {
    const scraper = loadModule<{ closeBrowser?: () => Promise<void> }>('video-scraper.js')
    if (scraper.closeBrowser) await scraper.closeBrowser()
  } catch { /* ignore */ }
  try {
    const poster = loadModule<{ closeBrowser?: () => Promise<void> }>('poster-fetcher.js')
    if (poster.closeBrowser) await poster.closeBrowser()
  } catch { /* ignore */ }
}
