// tests/mocks/ipc.mock.ts — IPC 通信模拟工厂
// 提供完全可控的 window.app IPC 方法实现，用于测试

import { vi, type Mock } from 'vitest'

/** IPC Mock 提供的完整 AppAPI mock 方法类型 */
interface IpcMockMethods {
  invoke: Mock
  storageLoad: Mock
  storageSave: Mock
  storageExport: Mock
  storageImport: Mock
  storageStats: Mock
  downloadEpisode: Mock
  getDownloadStatus: Mock
  getLocalLibrary: Mock
  deleteLocalEpisode: Mock
  getHomeData: Mock
  searchVideo: Mock
  getShowDetail: Mock
  getAnimeList: Mock
  getAnimeDetail: Mock
  getAnimePlayUrl: Mock
  searchAnime: Mock
  getAnimeCatalog: Mock
  getTypeCatalog: Mock
  getYearCatalog: Mock
  searchYearCatalog: Mock
  getFullCatalog: Mock
  getCategoryVideos: Mock
  fetchPoster: Mock
  getCatalogWithPosters: Mock
  refreshAllPosters: Mock
  forceRefreshAllPosters: Mock
  getLocalShows: Mock
  clearSearchCache: Mock
  getAppConfig: Mock
  encrypt: Mock
  decrypt: Mock
  minimizeWindow: Mock
  maximizeWindow: Mock
  closeWindow: Mock
  isMaximized: Mock
  openExternal: Mock
  openDownloadDir: Mock
  onDownloadProgress: Mock
  onDownloadComplete: Mock
  onDownloadError: Mock
  onAppError: Mock
  onMainReady: Mock
  onUpdateAvailable: Mock
  onUpdateProgress: Mock
  onUpdateDownloaded: Mock
  onUpdateError: Mock
  onPosterProgress: Mock
  onPostersUpdated: Mock
}

/**
 * IpcMock — IPC Mock 工厂
 *
 * 用法：
 *   const ipc = new IpcMock()
 *   ipc.install()                        // 替换 window.app 全部方法
 *   ipc.storageLoad.mockResolvedValue(data)
 *   // ... 运行测试 ...
 *   ipc.reset()
 */
export class IpcMock {
  private _originals: Partial<Record<string, unknown>> = {}
  private _methods!: IpcMockMethods

  constructor() {
    this._build()
  }

  /** 安装：将 mock 方法挂载到 window.app */
  install(): void {
    const app = (window as Record<string, unknown>).app as Record<string, unknown>
    if (!app) return

    for (const key of Object.keys(this._methods)) {
      if (key in app) {
        this._originals[key] = app[key]
      }
      app[key] = (this._methods as Record<string, unknown>)[key]
    }
  }

  /** 重置：恢复原始方法，重建 mock */
  reset(): void {
    const app = (window as Record<string, unknown>).app as Record<string, unknown>
    if (!app) return

    for (const [key, val] of Object.entries(this._originals)) {
      app[key] = val
    }
    this._originals = {}
    this._build()
  }

  /** 获取方法引用 */
  get methods(): IpcMockMethods {
    return this._methods
  }

  /** 便捷：模拟下载进度事件 */
  simulateDownloadProgress(data: { id: string; progress: number; detail: string }): void {
    const cb = this._methods.onDownloadProgress.mock.calls[0]?.[0]
    if (cb) cb(data)
  }

  /** 便捷：模拟下载完成事件 */
  simulateDownloadComplete(data: { id: string; filePath: string; showName: string; episodeLabel: string }): void {
    const cb = this._methods.onDownloadComplete.mock.calls[0]?.[0]
    if (cb) cb(data)
  }

  /** 便捷：模拟下载错误事件 */
  simulateDownloadError(data: { id: string; error: string }): void {
    const cb = this._methods.onDownloadError.mock.calls[0]?.[0]
    if (cb) cb(data)
  }

  // ---- 内部 ----

  private _build(): void {
    const noopUnsub = () => {}
    const defaultUserData = {
      favorites: [],
      history: [],
      playbackPositions: {},
      searchHistory: [],
      settings: {},
      offlineLibrary: [],
      downloadHistory: [],
    }

    this._methods = {
      invoke: vi.fn(),
      storageLoad: vi.fn().mockResolvedValue(defaultUserData),
      storageSave: vi.fn().mockResolvedValue(true),
      storageExport: vi.fn().mockResolvedValue(null),
      storageImport: vi.fn().mockResolvedValue({ success: false, message: '' }),
      storageStats: vi.fn().mockResolvedValue({ favorites: 0, history: 0, positions: 0, fileSize: 0 }),
      downloadEpisode: vi.fn().mockResolvedValue({ id: 'dl_1', status: 'downloading' }),
      getDownloadStatus: vi.fn().mockResolvedValue({ active: [], completed: 0 }),
      getLocalLibrary: vi.fn().mockResolvedValue([]),
      deleteLocalEpisode: vi.fn().mockResolvedValue(true),
      getHomeData: vi.fn().mockResolvedValue({}),
      searchVideo: vi.fn().mockResolvedValue([]),
      getShowDetail: vi.fn().mockResolvedValue(null),
      getAnimeList: vi.fn().mockResolvedValue({}),
      getAnimeDetail: vi.fn().mockResolvedValue(null),
      getAnimePlayUrl: vi.fn().mockResolvedValue({ url: '' }),
      searchAnime: vi.fn().mockResolvedValue([]),
      getAnimeCatalog: vi.fn().mockResolvedValue([]),
      getTypeCatalog: vi.fn().mockResolvedValue([]),
      getYearCatalog: vi.fn().mockResolvedValue([]),
      searchYearCatalog: vi.fn().mockResolvedValue([]),
      getFullCatalog: vi.fn().mockResolvedValue({}),
      getCategoryVideos: vi.fn().mockResolvedValue({}),
      fetchPoster: vi.fn().mockResolvedValue(null),
      getCatalogWithPosters: vi.fn().mockResolvedValue([]),
      refreshAllPosters: vi.fn().mockResolvedValue({ ok: true, total: 0, toRefresh: 0 }),
      forceRefreshAllPosters: vi.fn().mockResolvedValue({ ok: true, total: 0, toRefresh: 0 }),
      getLocalShows: vi.fn().mockResolvedValue([]),
      clearSearchCache: vi.fn().mockResolvedValue(true),
      getAppConfig: vi.fn().mockResolvedValue({
        ALLOWED_HOSTS: [],
        FALLBACK_SOURCES: [],
        WIN: { width: 1280, height: 800 },
        APP_VERSION: '2.0.0-test',
      }),
      encrypt: vi.fn().mockResolvedValue('encrypted'),
      decrypt: vi.fn().mockResolvedValue('decrypted'),
      minimizeWindow: vi.fn(),
      maximizeWindow: vi.fn().mockResolvedValue(false),
      closeWindow: vi.fn(),
      isMaximized: vi.fn().mockResolvedValue(false),
      openExternal: vi.fn(),
      openDownloadDir: vi.fn().mockResolvedValue(undefined),
      onDownloadProgress: vi.fn(() => noopUnsub),
      onDownloadComplete: vi.fn(() => noopUnsub),
      onDownloadError: vi.fn(() => noopUnsub),
      onAppError: vi.fn(() => noopUnsub),
      onMainReady: vi.fn(() => noopUnsub),
      onUpdateAvailable: vi.fn(() => noopUnsub),
      onUpdateProgress: vi.fn(() => noopUnsub),
      onUpdateDownloaded: vi.fn(() => noopUnsub),
      onUpdateError: vi.fn(() => noopUnsub),
      onPosterProgress: vi.fn(() => noopUnsub),
      onPostersUpdated: vi.fn(() => noopUnsub),
    }
  }
}

/** 默认导出单例，跨测试共享 */
export const ipcMock = new IpcMock()
