// tests/unit/search-unified/search-trend-store.spec.ts — CE8-C3 TrendStore tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchTrendStore } from '@/modules/search-unified/infrastructure/storage/stores/SearchTrendStore'

class TestStorage { private d: unknown = []; async load() { return this.d }; async save(d: unknown) { this.d = d }; async clear() { this.d = [] } }

describe('SearchTrendStore', () => {
  let store: SearchTrendStore

  beforeEach(async () => {
    store = new SearchTrendStore(new TestStorage() as any)
    await store.load()
  })

  it('should track query count', async () => {
    await store.recordQuery('Interstellar')
    await store.recordQuery('Interstellar')
    const top = store.getTopSearches()
    expect(top[0].count).toBe(2)
  })

  it('should return trending by rolling score', async () => {
    await store.recordQuery('popular')
    await store.recordQuery('popular')
    await store.recordQuery('popular')
    await store.recordQuery('rare')
    const trending = store.getTrendingSearches()
    expect(trending[0].query).toBe('popular')
  })

  it('should return recent trends', async () => {
    await store.recordQuery('first')
    await new Promise(r => setTimeout(r, 5))
    await store.recordQuery('second')
    const recent = store.getRecentTrends()
    expect(recent[0].query).toBe('second')
  })
})
