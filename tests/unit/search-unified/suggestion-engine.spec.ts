// tests/unit/search-unified/suggestion-engine.spec.ts — CE8-C2 SuggestionEngine tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SuggestionEngine } from '@/modules/search-unified/infrastructure/services/SuggestionEngine'
import type { SuggestionSource } from '@/modules/search-unified/infrastructure/services/SuggestionEngine'

class MockSource implements SuggestionSource {
  constructor(public sourceId: string, private results: string[] = []) {}
  async suggest(_q: string, _limit: number): Promise<string[]> { return this.results }
}

describe('SuggestionEngine', () => {
  let engine: SuggestionEngine

  beforeEach(() => { engine = new SuggestionEngine(2, 10) })

  it('should return empty for short query', async () => {
    const results = await engine.suggest('a')
    expect(results).toHaveLength(0)
  })

  it('should return suggestions from sources', async () => {
    engine.registerSource(new MockSource('popular', ['Interstellar', 'Inception']))
    const results = await engine.suggest('in')
    expect(results).toContain('Interstellar')
    expect(results).toContain('Inception')
  })

  it('should deduplicate across sources', async () => {
    engine.registerSource(new MockSource('s1', ['Interstellar', 'Inception']))
    engine.registerSource(new MockSource('s2', ['Interstellar', 'Inside Out']))
    const results = await engine.suggest('in')
    expect(results).toHaveLength(3)
  })

  it('should limit to maxResults', async () => {
    const many = Array.from({ length: 15 }, (_, i) => `Result ${i}`)
    engine.registerSource(new MockSource('s1', many))
    const results = await engine.suggest('test')
    expect(results).toHaveLength(10)
  })

  it('should handle source failure gracefully', async () => {
    const bad = { sourceId: 'bad', suggest: async () => { throw new Error('Down') } }
    const good = new MockSource('good', ['Interstellar'])
    engine.registerSource(bad)
    engine.registerSource(good)
    const results = await engine.suggest('in')
    expect(results).toContain('Interstellar')
  })

  it('should unregister sources', () => {
    engine.registerSource(new MockSource('s1'))
    engine.unregisterSource('s1')
    expect(engine.sourceCount).toBe(0)
  })
})
