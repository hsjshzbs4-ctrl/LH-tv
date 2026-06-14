// tests/unit/search-unified/provider-usage-store.spec.ts — CE8-C3 ProviderUsage tests

import { describe, it, expect, beforeEach } from 'vitest'
import { ProviderUsageStore } from '@/modules/search-unified/infrastructure/storage/stores/ProviderUsageStore'

class TestStorage { private d: unknown = []; async load() { return this.d }; async save(d: unknown) { this.d = d }; async clear() { this.d = [] } }

describe('ProviderUsageStore', () => {
  let store: ProviderUsageStore

  beforeEach(async () => {
    store = new ProviderUsageStore(new TestStorage() as any)
    await store.load()
  })

  it('should record search', async () => {
    await store.recordSearch('tmdb', 10, 50)
    const usage = store.getUsage('tmdb')
    expect(usage?.searches).toBe(1)
    expect(usage?.results).toBe(10)
  })

  it('should compute success rate', async () => {
    await store.recordSearch('tmdb', 10, 50)
    await store.recordSearch('tmdb', 5, 30)
    await store.recordError('tmdb')
    const usage = store.getUsage('tmdb')
    expect(usage?.successCount).toBe(2)
    expect(usage?.errorCount).toBe(1)
    expect(usage?.successRate).toBe(0.67)
  })

  it('should track clicks and plays', async () => {
    await store.recordClick('jellyfin')
    await store.recordPlay('jellyfin')
    const usage = store.getUsage('jellyfin')
    expect(usage?.clicks).toBe(1)
    expect(usage?.plays).toBe(1)
  })

  it('should return all usage', async () => {
    await store.recordSearch('tmdb', 1, 10)
    await store.recordSearch('jellyfin', 1, 20)
    expect(store.getAllUsage()).toHaveLength(2)
  })
})
