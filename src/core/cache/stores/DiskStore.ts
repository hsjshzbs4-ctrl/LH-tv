// src/core/cache/stores/DiskStore.ts - L2: 磁盘持久化缓存
// 应用重启后保留，适用于 catalog/detail 等低频变化数据

import type { CacheEntry } from '@/shared/types'
import { isExpired } from '../strategies/TTLStrategy'
import { CacheNamespace } from '../types/cache.types'

export class DiskStore {
  private baseDir: string
  private memoryIndex = new Map<string, CacheEntry<unknown>>()
  private initialized = false

  constructor(baseDir = '') {
    // 默认使用 electron userData，但浏览器环境下回退到空
    this.baseDir = baseDir
  }

  setBaseDir(dir: string): void {
    this.baseDir = dir
  }

  async get<T>(namespace: CacheNamespace, key: string): Promise<T | null> {
    // 先查内存索引
    const fullKey = `${namespace}:${key}`
    const memEntry = this.memoryIndex.get(fullKey)
    if (memEntry) {
      if (isExpired(memEntry)) {
        this.memoryIndex.delete(fullKey)
        return null
      }
      return memEntry.value as T
    }

    // 磁盘不可用时回退
    if (!this.baseDir) return null

    try {
      const { readFileSync, existsSync } = await this.fs()
      const filePath = this.getFilePath(namespace, key)
      if (!existsSync(filePath)) return null

      const raw = readFileSync(filePath, 'utf-8')
      const entry = JSON.parse(raw) as CacheEntry<T>

      if (isExpired(entry)) {
        this.deleteFile(filePath)
        return null
      }

      // 加载到内存索引
      this.memoryIndex.set(fullKey, entry as CacheEntry<unknown>)
      return entry.value
    } catch {
      return null
    }
  }

  async set<T>(namespace: CacheNamespace, key: string, entry: CacheEntry<T>): Promise<void> {
    const fullKey = `${namespace}:${key}`
    this.memoryIndex.set(fullKey, entry as CacheEntry<unknown>)

    if (!this.baseDir) return

    try {
      const { writeFileSync, existsSync, mkdirSync } = await this.fs()
      const dir = this.getNamespaceDir(namespace)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

      const filePath = this.getFilePath(namespace, key)
      writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8')
    } catch { /* 磁盘写入失败不影响内存缓存 */ }
  }

  async delete(namespace: CacheNamespace, key: string): Promise<void> {
    const fullKey = `${namespace}:${key}`
    this.memoryIndex.delete(fullKey)

    if (!this.baseDir) return
    try {
      this.deleteFile(this.getFilePath(namespace, key))
    } catch { /* ignore */ }
  }

  async clear(namespace?: CacheNamespace): Promise<void> {
    if (namespace) {
      // 清除特定命名空间
      const prefix = `${namespace}:`
      for (const key of this.memoryIndex.keys()) {
        if (key.startsWith(prefix)) this.memoryIndex.delete(key)
      }
      if (this.baseDir) {
        try {
          const { rmSync, existsSync } = await this.fs()
          const dir = this.getNamespaceDir(namespace)
          if (existsSync(dir)) {
            rmSync(dir, { recursive: true, force: true })
          }
        } catch { /* ignore */ }
      }
    } else {
      this.memoryIndex.clear()
      if (this.baseDir) {
        try {
          const { rmSync, existsSync } = await this.fs()
          if (existsSync(this.baseDir)) {
            rmSync(this.baseDir, { recursive: true, force: true })
          }
        } catch { /* ignore */ }
      }
    }
  }

  private getFilePath(namespace: CacheNamespace, key: string): string {
    // 安全的文件名（替换路径分隔符等特殊字符）
    const safeKey = key.replace(/[<>:"/\\|?*]/g, '_')
    return `${this.getNamespaceDir(namespace)}/${safeKey}.json`
  }

  private getNamespaceDir(namespace: CacheNamespace): string {
    return `${this.baseDir}/${namespace}`
  }

  private deleteFile(path: string): void {
    try {
      const fs = require('fs')
      if (fs.existsSync(path)) fs.unlinkSync(path)
    } catch { /* ignore */ }
  }

  private async fs(): Promise<typeof import('fs')> {
    // Node.js 环境
    return require('fs') as typeof import('fs')
  }
}
