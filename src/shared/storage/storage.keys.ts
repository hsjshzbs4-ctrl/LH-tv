// src/shared/storage/storage.keys.ts - 存储键名常量

/** 存储 Schema 字段名 */
export const STORAGE_FIELDS = {
  FAVORITES: 'favorites',
  HISTORY: 'history',
  PLAYBACK_POSITIONS: 'playbackPositions',
  SEARCH_HISTORY: 'searchHistory',
  SETTINGS: 'settings',
} as const

/** 主进程存储键名（文件/持久化层） */
export const STORAGE_KEYS = {
  USER_DATA: 'user-data',
  SEARCH_HISTORY: 'search-history',
} as const

/** 默认存储限制 */
export const STORAGE_LIMITS = {
  MAX_HISTORY: 200,
  MAX_SEARCH_HISTORY: 20,
  MAX_FAVORITES: 500,
} as const
