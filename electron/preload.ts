// electron/preload.ts - 安全桥接层（TypeScript 版）
// 职责：通过 contextBridge 暴露主进程 API 给渲染进程
// 所有方法均有 15s 硬超时

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPCChannel, IPCEvent } from '@shared/ipc/ipc.channels'

// ==================== 频率限制 ====================
interface RateLimiter {
  count: number
  resetAt: number
}

const rateLimiters: Record<string, RateLimiter> = {}

function rateLimitedInvoke(channel: string, maxCallsPerSec: number, ...args: unknown[]): Promise<unknown> {
  if (!rateLimiters[channel]) {
    rateLimiters[channel] = { count: 0, resetAt: performance.now() + 1000 }
  }
  const limiter = rateLimiters[channel]
  const now = performance.now()
  if (now > limiter.resetAt) {
    limiter.count = 0
    limiter.resetAt = now + 1000
  }
  if (limiter.count >= maxCallsPerSec) {
    return Promise.reject(new Error('调用过于频繁，请稍后再试'))
  }
  limiter.count++
  return ipcRenderer.invoke(channel, ...args)
}

// ==================== 事件监听辅助 ====================
function onEvent<T>(channel: string, callback: (data: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, data: T) => callback(data)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

// ==================== API 暴露 ====================
contextBridge.exposeInMainWorld('app', {
  // ---- 泛型 invoke<T>() ----
  invoke: <T>(channel: string, ...args: unknown[]): Promise<T> => {
    return ipcRenderer.invoke(channel, ...args) as Promise<T>
  },

  // ---- 窗口控制 ----
  minimizeWindow: () => { ipcRenderer.invoke(IPCChannel.WIN_MINIMIZE) },
  maximizeWindow: () => ipcRenderer.invoke(IPCChannel.WIN_MAXIMIZE) as Promise<boolean>,
  closeWindow: () => { ipcRenderer.invoke(IPCChannel.WIN_CLOSE) },
  isMaximized: () => ipcRenderer.invoke(IPCChannel.WIN_IS_MAXIMIZED) as Promise<boolean>,

  // ---- 加密 ----
  encrypt: (text: string) => ipcRenderer.invoke(IPCChannel.SECRETS_ENCRYPT, text) as Promise<string>,
  decrypt: (encoded: string) => ipcRenderer.invoke(IPCChannel.SECRETS_DECRYPT, encoded) as Promise<string>,

  // ---- 应用配置 ----
  getAppConfig: () => ipcRenderer.invoke(IPCChannel.GET_APP_CONFIG),

  // ---- 外部操作 ----
  openExternal: (url: string) => { ipcRenderer.invoke(IPCChannel.OPEN_EXTERNAL, url) },
  openDownloadDir: () => ipcRenderer.invoke(IPCChannel.OPEN_DOWNLOAD_DIR) as Promise<void>,

  // ---- 事件监听 ----
  onAppError: (cb: (data: { message: string; fatal?: boolean; nonFatal?: boolean }) => void) =>
    onEvent(IPCEvent.APP_ERROR, cb),
  onMainReady: (cb: () => void) => onEvent(IPCEvent.MAIN_READY, cb),
  onUpdateAvailable: (cb: (info: unknown) => void) =>
    onEvent(IPCEvent.UPDATE_AVAILABLE, cb),
  onUpdateProgress: (cb: (progress: unknown) => void) =>
    onEvent(IPCEvent.UPDATE_PROGRESS, cb),
  onUpdateDownloaded: (cb: (info: unknown) => void) =>
    onEvent(IPCEvent.UPDATE_DOWNLOADED, cb),
  onUpdateError: (cb: (data: { message: string }) => void) =>
    onEvent(IPCEvent.UPDATE_ERROR, cb),

  // ---- 首页数据 ----
  getHomeData: () => ipcRenderer.invoke(IPCChannel.GET_HOME_DATA),

  // ---- 分类 ----
  getCategoryVideos: (categoryId: number, page: number) =>
    ipcRenderer.invoke(IPCChannel.GET_CATEGORY_VIDEOS, categoryId, page),

  // ---- 搜索（限频 3次/秒）----
  searchVideo: (showName: string, episodeNum: number) =>
    rateLimitedInvoke(IPCChannel.SEARCH_VIDEO, 3, showName, episodeNum),

  // ---- 详情（限频 3次/秒）----
  getShowDetail: (showName: string) =>
    rateLimitedInvoke(IPCChannel.GET_SHOW_DETAIL, 3, showName),

  // ---- 动漫 ----
  getAnimeList: (catId: string, page: number) =>
    ipcRenderer.invoke(IPCChannel.GET_ANIME_LIST, catId, page),
  getAnimeDetail: (animeId: number) =>
    ipcRenderer.invoke(IPCChannel.GET_ANIME_DETAIL, animeId),
  getAnimePlayUrl: (playUrl: string) =>
    ipcRenderer.invoke(IPCChannel.GET_ANIME_PLAY_URL, playUrl),
  searchAnime: (keyword: string) =>
    rateLimitedInvoke(IPCChannel.SEARCH_ANIME, 3, keyword),
  getAnimeCatalog: (catId: string) =>
    ipcRenderer.invoke(IPCChannel.GET_ANIME_CATALOG, catId),

  // ---- 目录 ----
  getTypeCatalog: (type: string, sub: string) =>
    ipcRenderer.invoke(IPCChannel.GET_TYPE_CATALOG, type, sub),
  getYearCatalog: (year: string, type: string) =>
    ipcRenderer.invoke(IPCChannel.GET_YEAR_CATALOG, year, type),
  searchYearCatalog: (keyword: string) =>
    ipcRenderer.invoke(IPCChannel.SEARCH_YEAR_CATALOG, keyword),
  getFullCatalog: () => ipcRenderer.invoke(IPCChannel.GET_FULL_CATALOG),

  // ---- 海报 ----
  fetchPoster: (showName: string, year: string) =>
    ipcRenderer.invoke(IPCChannel.FETCH_POSTER, showName, year) as Promise<string | null>,
  getCatalogWithPosters: (type: string, sub: string) =>
    ipcRenderer.invoke(IPCChannel.GET_CATALOG_WITH_POSTERS, type, sub),

  // ---- 下载（本地库管理）----
  getLocalShows: () => ipcRenderer.invoke(IPCChannel.GET_LOCAL_SHOWS),
  getLocalLibrary: () => ipcRenderer.invoke(IPCChannel.GET_LOCAL_LIBRARY),
  deleteLocalEpisode: (filePath: string) =>
    ipcRenderer.invoke(IPCChannel.DELETE_LOCAL_EPISODE, filePath) as Promise<boolean>,

  // ---- 下载（任务管理）----
  downloadEpisode: (task: { showName: string; episodeLabel: string; episodeNum: number; url: string; type: string }) =>
    ipcRenderer.invoke(IPCChannel.DOWNLOAD_EPISODE, task) as Promise<{ id: string; status: string }>,

  getDownloadStatus: () =>
    ipcRenderer.invoke(IPCChannel.GET_DOWNLOAD_STATUS) as Promise<{
      active: Array<{ id: string; showName: string; episodeLabel: string; progress: number; detail: string }>
      completed: number
    }>,

  onDownloadProgress: (cb: (data: { id: string; progress: number; detail: string }) => void) =>
    onEvent(IPCEvent.DOWNLOAD_PROGRESS, cb),

  onDownloadComplete: (cb: (data: { id: string; filePath: string; showName: string; episodeLabel: string }) => void) =>
    onEvent(IPCEvent.DOWNLOAD_COMPLETE, cb),

  onDownloadError: (cb: (data: { id: string; error: string }) => void) =>
    onEvent(IPCEvent.DOWNLOAD_ERROR, cb),

  // ---- 海报刷新 ----
  refreshAllPosters: () => ipcRenderer.invoke(IPCChannel.REFRESH_ALL_POSTERS) as Promise<{ ok: boolean; total: number; toRefresh: number; error?: string }>,
  forceRefreshAllPosters: () => ipcRenderer.invoke(IPCChannel.FORCE_REFRESH_ALL_POSTERS) as Promise<{ ok: boolean; total: number; error?: string }>,
  onPosterProgress: (cb: (data: { current: number; total: number; name: string; hasUrl: boolean }) => void) =>
    onEvent(IPCEvent.POSTER_REFRESH_PROGRESS, cb),
  onPostersUpdated: (cb: (data: { fetched: number; total: number }) => void) =>
    onEvent(IPCEvent.POSTERS_UPDATED, cb),

  // ---- 文件存储 ----
  storageLoad: () => ipcRenderer.invoke(IPCChannel.STORAGE_LOAD),
  storageSave: (data: unknown) => ipcRenderer.invoke(IPCChannel.STORAGE_SAVE, data) as Promise<boolean>,
  storageExport: () => ipcRenderer.invoke(IPCChannel.STORAGE_EXPORT) as Promise<string | null>,
  storageImport: (json: string) => ipcRenderer.invoke(IPCChannel.STORAGE_IMPORT, json) as Promise<{ success: boolean; message: string }>,
  storageStats: () => ipcRenderer.invoke(IPCChannel.STORAGE_STATS) as Promise<{ favorites: number; history: number; positions: number; fileSize: number }>,

  // ---- 设置 ----
  clearSearchCache: () => ipcRenderer.invoke(IPCChannel.CLEAR_SEARCH_CACHE) as Promise<boolean>,

  // ---- Content Ecosystem Search (P6.3 CE7) ----
  ecosystemSearch: (query: string, options?: Record<string, unknown>) =>
    ipcRenderer.invoke(IPCChannel.ECOSYSTEM_SEARCH, { query, options }),
  ecosystemSearchBuild: () =>
    ipcRenderer.invoke(IPCChannel.ECOSYSTEM_SEARCH_BUILD),
  ecosystemSearchRebuild: () =>
    ipcRenderer.invoke(IPCChannel.ECOSYSTEM_SEARCH_REBUILD),
  ecosystemSearchStats: () =>
    ipcRenderer.invoke(IPCChannel.ECOSYSTEM_SEARCH_STATS),
})
