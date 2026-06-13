// src/shared/ipc/ipc.channels.ts - IPC 通道枚举（单一份源）
// 主进程和渲染进程共用此文件
// 渲染进程: import { IPCChannel } from '@shared/ipc/ipc.channels'
// 主进程:   import { IPCChannel } from '@shared/ipc/ipc.channels'

// ==================== Handle/Invoke 通道 ====================
export enum IPCChannel {
  // ---- 窗口控制 ----
  WIN_MINIMIZE = 'win-minimize',
  WIN_MAXIMIZE = 'win-maximize',
  WIN_CLOSE = 'win-close',
  WIN_IS_MAXIMIZED = 'win-is-maximized',

  // ---- 加密 ----
  SECRETS_ENCRYPT = 'secrets-encrypt',
  SECRETS_DECRYPT = 'secrets-decrypt',

  // ---- 应用配置 ----
  GET_APP_CONFIG = 'get-app-config',
  OPEN_EXTERNAL = 'open-external',
  QUEUE_STATS = 'queue-stats',

  // ---- 存储 ----
  STORAGE_LOAD = 'storage-load',
  STORAGE_SAVE = 'storage-save',
  STORAGE_EXPORT = 'storage-export',
  STORAGE_IMPORT = 'storage-import',
  STORAGE_STATS = 'storage-stats',

  // ---- 搜索 & 详情 ----
  GET_HOME_DATA = 'get-home-data',
  GET_CATEGORY_VIDEOS = 'get-category-videos',
  SEARCH_VIDEO = 'search-video',
  GET_SHOW_DETAIL = 'get-show-detail',
  CLEAR_SEARCH_CACHE = 'clear-search-cache',

  // ---- 目录 ----
  GET_TYPE_CATALOG = 'get-type-catalog',
  GET_YEAR_CATALOG = 'get-year-catalog',
  SEARCH_YEAR_CATALOG = 'search-year-catalog',
  GET_FULL_CATALOG = 'get-full-catalog',
  GET_CATALOG_STATUS = 'get-catalog-status',
  GET_YEAR_RANGE = 'get-year-range',

  // ---- 动漫 ----
  GET_ANIME_LIST = 'get-anime-list',
  GET_ANIME_DETAIL = 'get-anime-detail',
  GET_ANIME_PLAY_URL = 'get-anime-play-url',
  SEARCH_ANIME = 'search-anime',
  GET_ANIME_CATALOG = 'get-anime-catalog',

  // ---- 海报 ----
  FETCH_POSTER = 'fetch-poster',
  GET_CATALOG_WITH_POSTERS = 'get-catalog-with-posters',
  REFRESH_ALL_POSTERS = 'refresh-all-posters',
  FORCE_REFRESH_ALL_POSTERS = 'force-refresh-all-posters',

  // ---- 下载 ----
  GET_LOCAL_SHOWS = 'get-local-shows',
  GET_LOCAL_LIBRARY = 'get-local-library',
  DELETE_LOCAL_EPISODE = 'delete-local-episode',
  OPEN_DOWNLOAD_DIR = 'open-download-dir',

  // ---- 更新 ----
  CHECK_FOR_UPDATE = 'check-for-update',
  INSTALL_UPDATE = 'install-update',
  POSTPONE_UPDATE = 'postpone-update',

  // ================ 仅 legacy 旧模块使用 ================
  // prettier-ignore
  GET_JP_MOVIES = 'get-jp-movies',
  GET_KR_MOVIES = 'get-kr-movies',
  GET_POSTER_STATS = 'get-poster-stats',
  BATCH_FETCH_POSTERS = 'batch-fetch-posters',
  CLEAN_CORRUPTED_POSTERS = 'clean-corrupted-posters',
  REFETCH_TYPE_POSTERS = 'refetch-type-posters',
  STOP_POSTER_FETCH = 'stop-poster-fetch',
  DOWNLOAD_EPISODE = 'download-episode',
  GET_DOWNLOAD_STATUS = 'get-download-status',
  GET_LOCAL_FILE_PATH = 'get-local-file-path',
  TRIGGER_UPDATE = 'trigger-update',
  FIND_ANIME_ONLINE = 'find-anime-online',
  GET_TIANTIAN_LIST = 'get-tiantian-list',
  GET_TIANTIAN_DETAIL = 'get-tiantian-detail',
  GET_TIANTIAN_PLAY_URL = 'get-tiantian-play-url',
  SEARCH_TIANTIAN = 'search-tiantian',

  // ─── Content Ecosystem (P6.0) ───
  ECOSYSTEM_SEARCH = 'ecosystem.search',
  ECOSYSTEM_RECOMMEND = 'ecosystem.recommend',
  ECOSYSTEM_SERVER_CONNECT = 'ecosystem.server.connect',
  ECOSYSTEM_SERVER_DISCONNECT = 'ecosystem.server.disconnect',
  ECOSYSTEM_LIBRARY_SCAN = 'ecosystem.library.scan',
  ECOSYSTEM_METADATA_LOOKUP = 'ecosystem.metadata.lookup',
  ECOSYSTEM_METADATA_ENRICH = 'ecosystem.metadata.enrich',
  ECOSYSTEM_GET_TMDB_KEY = 'ecosystem.get-tmdb-key',
  ECOSYSTEM_SET_TMDB_KEY = 'ecosystem.set-tmdb-key',
  ECOSYSTEM_SYNC_PROGRESS = 'ecosystem.sync-progress',
  ECOSYSTEM_GET_PROVIDERS = 'ecosystem.get-providers',
}

// ==================== Event 通道 (main→renderer send) ====================
export enum IPCEvent {
  APP_ERROR = 'app-error',
  MAIN_READY = 'main-ready',
  UPDATE_AVAILABLE = 'update-available',
  UPDATE_PROGRESS = 'update-progress',
  UPDATE_DOWNLOADED = 'update-downloaded',
  UPDATE_ERROR = 'update-error',
  POSTER_REFRESH_PROGRESS = 'poster-refresh-progress',
  POSTERS_UPDATED = 'posters-updated',
  DOWNLOAD_PROGRESS = 'download-progress',
  DOWNLOAD_COMPLETE = 'download-complete',
  DOWNLOAD_ERROR = 'download-error',
}
