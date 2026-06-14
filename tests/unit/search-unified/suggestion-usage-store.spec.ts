// tests/unit/search-unified/suggestion-usage-store.spec.ts — CE8-C3 SuggestionUsage tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SuggestionUsageStore } from '@/modules/search-unified/infrastructure/storage/stores/SuggestionUsageStore'

class TestStorage { private d: unknown = []; async load() { return this.d }; async save(d: unknown) { this.d = d }; async clear() { this.d = [] } }

describe('SuggestionUsageStore', () => {
  let store: SuggestionUsageStore

  beforeEach(async () => {
    store = new SuggestionUsageStore(new TestStorage() as any)
    await store.load()
  })

  it('should track shown and selected', async () => {
    await store.recordShown('Interstellar')
    await store.recordShown('Interstellar')
    await store.recordSelected('Interstellar')
    const top = store.getTopSuggestions()
    expect(top[0].shown).toBe(2)
    expect(top[0].selected).toBe(1)
    expect(top[0].ctr).toBe(0.5)
  })

  it('should return most shown', async () => {
    await store.recordShown('A')
    await store.recordShown('B')
    await store.recordShown('B')
    const most = store.getMostShown()
    expect(most[0].suggestion).toBe('B')
  })

  it('should order by CTR', async () => {
    await store.recordShown('low-ctr')
    await store.recordShown('high-ctr')
    await store.recordSelected('high-ctr')
    const top = store.getTopSuggestions()
    expect(top[0].suggestion).toBe('high-ctr')
  })
})
