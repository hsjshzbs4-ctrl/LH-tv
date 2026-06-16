// src/player/reliability/OfflineCacheManager.ts — PB3-S3-3 Offline Cache
// IndexedDB 优先，回退 localStorage。不修改 PB2 状态管理器。

const DB_NAME = 'pb3-offline-cache'
const DB_VERSION = 1
const STORE_NAME = 'player-cache'

interface CacheEntry<T = unknown> {
  key: string
  value: T
  version: number
  expiresAt: number
  updatedAt: number
}

export class OfflineCacheManager {
  private db: IDBDatabase | null = null
  private _ready = false
  private pending: Array<{ key: string; value: unknown; ttlMs: number }> = []

  get ready(): boolean { return this._ready }

  constructor() {
    this._initDB()
  }

  /** 写入缓存 */
  async set<T>(key: string, value: T, ttlMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this._ready) {
      this.pending.push({ key, value, ttlMs })
      this._fallbackSet(key, value)
      return
    }
    const entry: CacheEntry<T> = {
      key,
      value,
      version: DB_VERSION,
      expiresAt: Date.now() + ttlMs,
      updatedAt: Date.now(),
    }
    try {
      await this._put(entry)
    } catch {
      this._fallbackSet(key, value)
    }
  }

  /** 读取缓存 */
  async get<T>(key: string): Promise<T | null> {
    if (!this._ready) return this._fallbackGet<T>(key)
    try {
      const entry = await this._get(key)
      if (!entry) return null
      if (Date.now() > entry.expiresAt) {
        await this._delete(key)
        return null
      }
      return entry.value as T
    } catch {
      return this._fallbackGet<T>(key)
    }
  }

  /** 删除缓存 */
  async delete(key: string): Promise<void> {
    if (this._ready) {
      try { await this._delete(key) } catch { /* 静默 */ }
    }
    this._fallbackDelete(key)
  }

  /** 清空过期条目 */
  async purge(): Promise<number> {
    let count = 0
    if (this._ready) {
      try {
        const all = await this._getAll()
        const now = Date.now()
        for (const e of all) {
          if (now > e.expiresAt) { await this._delete(e.key); count++ }
        }
      } catch { /* 静默 */ }
    }
    return count
  }

  destroy(): void {
    this.db?.close()
    this.db = null
    this._ready = false
  }

  // ── IndexedDB ──
  private _initDB(): void {
    if (typeof indexedDB === 'undefined') return
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    req.onsuccess = () => {
      this.db = req.result
      this._ready = true
      this._flushPending()
    }
    req.onerror = () => { /* 静默回退到 localStorage */ }
  }

  private _put<T>(entry: CacheEntry<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject()
      const tx = this.db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject()
    })
  }

  private _get(key: string): Promise<CacheEntry | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject()
      const tx = this.db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject()
    })
  }

  private _getAll(): Promise<CacheEntry[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject()
      const tx = this.db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject()
    })
  }

  private _delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject()
      const tx = this.db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject()
    })
  }

  private _flushPending(): void {
    for (const p of this.pending) this.set(p.key, p.value, p.ttlMs)
    this.pending = []
  }

  // ── localStorage fallback ──
  private _fallbackSet<T>(key: string, value: T): void {
    try { localStorage.setItem(`pb3-cache:${key}`, JSON.stringify({ v: value, t: Date.now() })) } catch { /* 静默 */ }
  }
  private _fallbackGet<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`pb3-cache:${key}`)
      return raw ? (JSON.parse(raw).v as T) : null
    } catch { return null }
  }
  private _fallbackDelete(key: string): void {
    try { localStorage.removeItem(`pb3-cache:${key}`) } catch { /* 静默 */ }
  }
}
