// tests/setup/vitest.setup.ts — 全局 Mock 注入
// 每个测试文件运行前自动执行，提供安全的默认 mock 环境

import { vi } from 'vitest'

// ============================================================
// 1. Worker 全局 Stub
// ============================================================
// ProviderSandbox 使用 new Worker() 创建 Web Worker
// 测试环境下替换为可控的 MockWorker
class StubWorker {
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: ErrorEvent) => void) | null = null
  onmessageerror: ((ev: MessageEvent) => void) | null = null

  postMessage(_data: unknown): void {}
  terminate(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true }
}

vi.stubGlobal('Worker', StubWorker)

// ============================================================
// 2. import.meta.glob Stub（ProviderLoader 使用）
// ============================================================
vi.stubGlobal('import.meta', {
  glob: vi.fn(() => ({})),
  env: { MODE: 'test', PROD: false, DEV: true },
})

// ============================================================
// 3. window.app 全局 Mock（AppAPI 完整实现）
// ============================================================
// 每个方法默认返回安全空值，各测试按需用 vi.fn() 覆盖

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

if (typeof window !== 'undefined') {
  ;(window as Record<string, unknown>).app = {
    // ---- 窗口控制 ----
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn().mockResolvedValue(false),
    closeWindow: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),

    // ---- 加密 ----
    encrypt: vi.fn().mockResolvedValue('encrypted-mock'),
    decrypt: vi.fn().mockResolvedValue('decrypted-mock'),

    // ---- 应用配置 ----
    getAppConfig: vi.fn().mockResolvedValue({
      ALLOWED_HOSTS: [],
      FALLBACK_SOURCES: [],
      WIN: { width: 1280, height: 800 },
      APP_VERSION: '2.0.0-test',
    }),
    openExternal: vi.fn(),
    openDownloadDir: vi.fn().mockResolvedValue(undefined),

    // ---- 事件监听（全部返回空取消函数） ----
    onAppError: vi.fn(() => noopUnsub),
    onMainReady: vi.fn(() => noopUnsub),
    onUpdateAvailable: vi.fn(() => noopUnsub),
    onUpdateProgress: vi.fn(() => noopUnsub),
    onUpdateDownloaded: vi.fn(() => noopUnsub),
    onUpdateError: vi.fn(() => noopUnsub),

    // ---- 首页 / 分类 ----
    getHomeData: vi.fn().mockResolvedValue({}),
    getCategoryVideos: vi.fn().mockResolvedValue({}),

    // ---- 搜索 / 详情 ----
    searchVideo: vi.fn().mockResolvedValue([]),
    clearSearchCache: vi.fn().mockResolvedValue(true),
    getShowDetail: vi.fn().mockResolvedValue(null),

    // ---- 动漫 ----
    getAnimeList: vi.fn().mockResolvedValue({}),
    getAnimeDetail: vi.fn().mockResolvedValue(null),
    getAnimePlayUrl: vi.fn().mockResolvedValue({ url: '' }),
    searchAnime: vi.fn().mockResolvedValue([]),
    getAnimeCatalog: vi.fn().mockResolvedValue([]),

    // ---- 目录 ----
    getTypeCatalog: vi.fn().mockResolvedValue([]),
    getYearCatalog: vi.fn().mockResolvedValue([]),
    searchYearCatalog: vi.fn().mockResolvedValue([]),
    getFullCatalog: vi.fn().mockResolvedValue({}),

    // ---- 海报 ----
    fetchPoster: vi.fn().mockResolvedValue(null),
    getCatalogWithPosters: vi.fn().mockResolvedValue([]),
    refreshAllPosters: vi.fn().mockResolvedValue({ ok: true, total: 0, toRefresh: 0 }),
    forceRefreshAllPosters: vi.fn().mockResolvedValue({ ok: true, total: 0, toRefresh: 0 }),
    onPosterProgress: vi.fn(() => noopUnsub),
    onPostersUpdated: vi.fn(() => noopUnsub),

    // ---- 下载（本地库） ----
    getLocalShows: vi.fn().mockResolvedValue([]),
    getLocalLibrary: vi.fn().mockResolvedValue([]),
    deleteLocalEpisode: vi.fn().mockResolvedValue(true),

    // ---- 下载（任务管理） ----
    downloadEpisode: vi.fn().mockResolvedValue({ id: 'dl_mock_1', status: 'downloading' }),
    getDownloadStatus: vi.fn().mockResolvedValue({ active: [], completed: 0 }),
    onDownloadProgress: vi.fn(() => noopUnsub),
    onDownloadComplete: vi.fn(() => noopUnsub),
    onDownloadError: vi.fn(() => noopUnsub),

    // ---- 文件存储 ----
    storageLoad: vi.fn().mockResolvedValue(defaultUserData),
    storageSave: vi.fn().mockResolvedValue(true),
    storageExport: vi.fn().mockResolvedValue(null),
    storageImport: vi.fn().mockResolvedValue({ success: false, message: 'mock-not-imported' }),
    storageStats: vi.fn().mockResolvedValue({
      favorites: 0,
      history: 0,
      positions: 0,
      fileSize: 0,
    }),
  }
}

// ============================================================
// 4. 通用工具 Stub
// ============================================================

// 抑制 console 噪音（测试中可选）
// vi.spyOn(console, 'error').mockImplementation(() => {})
// vi.spyOn(console, 'warn').mockImplementation(() => {})
