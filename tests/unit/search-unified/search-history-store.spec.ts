// tests/unit/search-unified/search-history-store.spec.ts — CE8-C3 HistoryStore tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchHistoryStore } from '@/modules/search-unified/infrastructure/storage/stores/SearchHistoryStore'

class TestStorage { private d: unknown = []; async load() { return this.d }; async save(d: unknown) { this.d = d }; async clear() { this.d = [] } }

describe('SearchHistoryStore', () => {
  let store: SearchHistoryStore

  beforeEach(async () => {
    store = new SearchHistoryStore(new TestStorage() as any)
    await store.load()
  })

  it('should add and retrieve queries', async () => {
    await store.addQuery('Interstellar', 5)
    const recent = store.getRecentQueries()
    expect(recent).toHaveLength(1)
    expect(recent[0].query).toBe('Interstellar')
  })

  it('should merge duplicate queries', async () => {
    await store.addQuery('interstellar', 5)
    await store.addQuery('  Interstellar  ', 10)
    const recent = store.getRecentQueries()
    expect(recent).toHaveLength(1)
    expect(recent[0].frequency).toBe(2)
  })

  it('should order newest first', async () => {
    await store.addQuery('Old', 1)
    await new Promise(r => setTimeout(r, 5))
    await store.addQuery('New', 1)
    const recent = store.getRecentQueries()
    expect(recent[0].query).toBe('New')
  })

  it('should delete query', async () => {
    await store.addQuery('Test', 1)
    const entries = store.getRecentQueries()
    expect(await store.deleteQuery(entries[0].id)).toBe(true)
    expect(store.getRecentQueries()).toHaveLength(0)
  })
})
