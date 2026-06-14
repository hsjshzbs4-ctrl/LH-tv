// core/content-ecosystem/search/storage/ElectronSearchStorage.ts — CE7.2 Electron persistence
// Persists search index via window.app.storageSave/Load IPC bridge.
// Gracefully degrades to in-memory when window.app is unavailable (tests / SSR).

import type { ISearchStorage } from '../contracts/ISearchStorage'
import type { SearchDocument } from '../contracts/search.types'

const STORAGE_KEY = 'ce7-search-index'

export class ElectronSearchStorage implements ISearchStorage {
  async load(): Promise<SearchDocument[]> {
    try {
      const app = (window as any).app
      if (!app?.storageLoad) return []
      const data = await app.storageLoad(STORAGE_KEY)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  async save(documents: SearchDocument[]): Promise<void> {
    try {
      const app = (window as any).app
      if (!app?.storageSave) return
      await app.storageSave(STORAGE_KEY, documents)
    } catch {
      // Storage failure is non-fatal — index lives in memory
    }
  }

  async clear(): Promise<void> {
    try {
      const app = (window as any).app
      if (!app?.storageSave) return
      await app.storageSave(STORAGE_KEY, [])
    } catch {
      // Non-fatal
    }
  }
}
