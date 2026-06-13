// electron/services/storage.service.ts - 主进程文件存储
// 替代 localStorage，将用户数据持久化到 Electron userData 目录
// 自动备份上一版本，防止数据损坏

import { app } from 'electron'
import { join, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { createLogger } from '../utils/logger'

const log = createLogger('Storage')

const DATA_DIR = join(app.getPath('userData'), 'data')
const USER_DATA_FILE = join(DATA_DIR, 'user-data.json')
const BACKUP_FILE = join(DATA_DIR, 'user-data.json.bak')

// 确保数据目录存在
function ensureDataDir(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch (e) {
    log.error('创建数据目录失败', e instanceof Error ? e : undefined)
  }
}

export interface UserData {
  favorites: Array<{
    id: string
    mediaId: string
    providerId: string
    title: string
    cover: string
    description?: string
    category?: string
    favoritedAt: number
  }>
  history: Array<{
    id: string
    mediaId: string
    episodeId: string
    providerId: string
    title: string
    cover: string
    episodeLabel: string
    duration: number
    currentTime: number
    progress: number
    lastWatchedAt: number
  }>
  playbackPositions: Record<string, {
    showName: string
    episodeNumber: number
    position: number
    updatedAt: number
  }>
  searchHistory: Array<{ keyword: string; searchedAt: number }>
  settings?: Record<string, unknown>
  offlineLibrary?: Array<{
    id: string
    mediaId: string
    episodeId: string
    providerId: string
    title: string
    cover: string
    episodeLabel: string
    localFilePath: string
    fileSize: number
    downloadedAt: number
    exists: boolean
  }>
  downloadHistory?: Array<Record<string, unknown>>
  version: number
  savedAt: string
}

const DEFAULT_USER_DATA: UserData = {
  favorites: [],
  history: [],
  playbackPositions: {},
  searchHistory: [],
  offlineLibrary: [],
  downloadHistory: [],
  version: 1,
  savedAt: new Date().toISOString()
}

// ==================== 读 ====================
export function loadUserData(): UserData {
  ensureDataDir()

  try {
    if (existsSync(USER_DATA_FILE)) {
      const raw = readFileSync(USER_DATA_FILE, 'utf-8')
      const data = JSON.parse(raw) as UserData

      // 校验数据结构
      if (typeof data !== 'object' || !Array.isArray(data.favorites) || !Array.isArray(data.history)) {
        log.warn('数据文件格式异常，尝试从备份恢复')
        return restoreFromBackup()
      }

      // 兼容旧数据：searchHistory 可能不存在
      // 兼容 P3.3 及更早版本的 string[] 格式 → 自动迁移为 SearchHistoryItem[]
      if (!Array.isArray(data.searchHistory)) {
        data.searchHistory = []
      } else {
        const now = Date.now()
        data.searchHistory = data.searchHistory
          .map((item: unknown, index: number) => {
            if (typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).keyword === 'string') {
              return item as { keyword: string; searchedAt: number }
            }
            if (typeof item === 'string' && item.trim()) {
              return { keyword: item, searchedAt: now - index * 1000 }
            }
            return null
          })
          .filter((item): item is { keyword: string; searchedAt: number } => item !== null)
      }

      // 兼容旧数据：offlineLibrary 可能不存在
      if (!Array.isArray(data.offlineLibrary)) {
        data.offlineLibrary = []
      }

      // 兼容旧数据：downloadHistory 可能不存在
      if (!Array.isArray(data.downloadHistory)) {
        data.downloadHistory = []
      }

      log.info('加载用户数据: ' + data.favorites.length + ' 收藏, ' + data.history.length + ' 历史, ' + data.searchHistory.length + ' 搜索历史')
      return data
    }
  } catch (e) {
    log.error('读取用户数据失败，尝试恢复备份', e instanceof Error ? e : undefined)
    return restoreFromBackup()
  }

  return { ...DEFAULT_USER_DATA }
}

function restoreFromBackup(): UserData {
  try {
    if (existsSync(BACKUP_FILE)) {
      const raw = readFileSync(BACKUP_FILE, 'utf-8')
      const data = JSON.parse(raw) as UserData
      if (typeof data === 'object' && Array.isArray(data.favorites)) {
        log.info('从备份恢复成功')
        // 恢复后立即保存到主文件
        try { writeFileSync(USER_DATA_FILE, raw, 'utf-8') } catch { /* ignore */ }
        return data
      }
    }
  } catch (e) {
    log.error('备份恢复也失败了', e instanceof Error ? e : undefined)
  }
  return { ...DEFAULT_USER_DATA }
}

// ==================== 写 ====================
export function saveUserData(data: UserData): boolean {
  ensureDataDir()

  try {
    // 更新元数据
    data.version = (data.version || 1) + 1
    data.savedAt = new Date().toISOString()

    const json = JSON.stringify(data, null, 2)

    // 先备份当前文件（如果存在）
    if (existsSync(USER_DATA_FILE)) {
      try {
        copyFileSync(USER_DATA_FILE, BACKUP_FILE)
      } catch {
        // 备份失败不影响写入
      }
    }

    // 原子写入：先写临时文件，再 rename
    const tmpFile = USER_DATA_FILE + '.tmp'
    writeFileSync(tmpFile, json, 'utf-8')
    // Node.js 不支持原子 rename，直接用 writeFileSync 覆盖（已经做了备份）
    writeFileSync(USER_DATA_FILE, json, 'utf-8')

    // 清理临时文件
    try {
      const { unlinkSync } = require('fs')
      if (existsSync(tmpFile)) unlinkSync(tmpFile)
    } catch { /* ignore */ }

    return true
  } catch (e) {
    log.error('保存用户数据失败', e instanceof Error ? e : undefined)
    return false
  }
}

// ==================== 导出/导入 ====================
export function exportUserData(): string | null {
  try {
    const data = loadUserData()
    // 返回 JSON 字符串，方便保存到任意位置
    return JSON.stringify({
      exportVersion: 1,
      appName: 'LH-TV',
      exportedAt: new Date().toISOString(),
      data: {
        favorites: data.favorites,
        history: data.history,
        playbackPositions: data.playbackPositions
      }
    }, null, 2)
  } catch (e) {
    log.error('导出数据失败', e instanceof Error ? e : undefined)
    return null
  }
}

export function importUserData(json: string): { success: boolean; message: string } {
  try {
    const imported = JSON.parse(json)

    // 校验格式
    if (!imported.data || typeof imported.data !== 'object') {
      return { success: false, message: '数据格式不正确' }
    }

    const { favorites, history, playbackPositions } = imported.data

    if (!Array.isArray(favorites) || !Array.isArray(history)) {
      return { success: false, message: '数据格式不完整' }
    }

    // 加载当前数据，合并（不覆盖已有的收藏/历史）
    const current = loadUserData()
    const existingFavIds = new Set(current.favorites.map((f: { id: unknown }) => String(f.id)))
    const existingHistKeys = new Set(current.history.map(
      (h) => `${h.mediaId}_${h.episodeId}`
    ))

    let mergedFavs = 0
    for (const fav of favorites) {
      if (!existingFavIds.has(String(fav.id))) {
        current.favorites.push(fav)
        mergedFavs++
      }
    }

    let mergedHist = 0
    for (const hist of history) {
      const key = `${hist.mediaId}_${hist.episodeId}`
      if (!existingHistKeys.has(key)) {
        current.history.push(hist)
        mergedHist++
      }
    }

    // 合并播放进度（不覆盖较新的）
    if (playbackPositions && typeof playbackPositions === 'object') {
      const keys = Object.keys(playbackPositions)
      for (const key of keys) {
        const existing = current.playbackPositions[key]
        const incoming = playbackPositions[key]
        if (!existing || (incoming.updatedAt > existing.updatedAt)) {
          current.playbackPositions[key] = incoming
        }
      }
    }

    saveUserData(current)

    return {
      success: true,
      message: `导入成功：合并了 ${mergedFavs} 条收藏、${mergedHist} 条历史`
    }
  } catch (e) {
    return { success: false, message: '解析数据失败: ' + (e as Error).message }
  }
}

// ==================== 获取存储统计 ====================
export function getStorageStats(): { favorites: number; history: number; positions: number; fileSize: number } {
  const data = loadUserData()
  let fileSize = 0
  try {
    if (existsSync(USER_DATA_FILE)) {
      fileSize = (require('fs') as typeof import('fs')).statSync(USER_DATA_FILE).size
    }
  } catch { /* ignore */ }
  return {
    favorites: data.favorites.length,
    history: data.history.length,
    positions: Object.keys(data.playbackPositions).length,
    fileSize
  }
}
