// modules/recommendation/infrastructure/storage/IStorageAdapter.ts — CE9-D
// Storage abstraction interface. Same pattern as CE8 SearchAnalyticsStore.
// Enables swapping between memory, IndexedDB, SQLite, etc.

export interface IStorageAdapter<T = unknown> {
  load(): Promise<T | null>
  save(data: T): Promise<void>
  clear(): Promise<void>
}

/** In-memory storage adapter for testing and development */
export class InMemoryStorageAdapter<T = unknown> implements IStorageAdapter<T> {
  private data: T | null = null

  constructor(initialData?: T) {
    this.data = initialData ?? null
  }

  async load(): Promise<T | null> { return this.data }
  async save(data: T): Promise<void> { this.data = data }
  async clear(): Promise<void> { this.data = null }
}
