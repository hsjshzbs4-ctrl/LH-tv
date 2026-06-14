// tests/unit/search-unified/search-analytics-store.spec.ts — CE8-C3 AnalyticsStore tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchAnalyticsStore } from '@/modules/search-unified/infrastructure/storage/stores/SearchAnalyticsStore'

class TestStorage {
  private data: unknown = []
  async load() { return this.data }
  async save(d: unknown) { this.data = d }
  async clear() { this.data = [] }
}

describe('SearchAnalyticsStore', () => {
  let store: SearchAnalyticsStore
  let storage: TestStorage

  beforeEach(async () => {
    storage = new TestStorage()
    store = new SearchAnalyticsStore(storage as any)
    await store.load()
  })

  it('should save and query records', async () => {
    await store.save({ type: 'search', query: 'test', timestamp: 1000, resultCount: 5, searchTimeMs: 42 })
    const results = store.query()
    expect(results).toHaveLength(1)
    expect(results[0].type).toBe('search')
  })

  it('should filter by type', async () => {
    await store.save({ type: 'search', timestamp: 1000 })
    await store.save({ type: 'click', timestamp: 2000 })
    const searches = store.query({ type: 'search' })
    expect(searches).toHaveLength(1)
  })

  it('should filter by provider', async () => {
    await store.save({ type: 'search', provider: 'tmdb', timestamp: 1000 })
    await store.save({ type: 'search', provider: 'jellyfin', timestamp: 2000 })
    const tmdb = store.query({ provider: 'tmdb' })
    expect(tmdb).toHaveLength(1)
  })

  it('should filter by date range', async () => {
    await store.save({ type: 'search', timestamp: 1000 })
    await store.save({ type: 'search', timestamp: 5000 })
    const recent = store.query({ fromDate: 3000 })
    expect(recent).toHaveLength(1)
    expect(recent[0].timestamp).toBe(5000)
  })

  it('should support pagination', async () => {
    for (let i = 0; i < 10; i++) await store.save({ type: 'search', timestamp: i * 100 })
    const page = store.query({ limit: 5, offset: 3 })
    expect(page).toHaveLength(5)
  })

  it('should delete records', async () => {
    const record = await store.save({ type: 'search', timestamp: 1000 })
    expect(await store.delete(record.id)).toBe(true)
    expect(store.query()).toHaveLength(0)
  })
})
