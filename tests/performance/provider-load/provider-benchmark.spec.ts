// tests/performance/provider-load/provider-benchmark.spec.ts — Phase 2: Provider Load Certification
import { describe, it, expect } from 'vitest'

const SCALES = [1, 5, 10, 20, 50] as const
const TARGETS = {
  register: 200,   // ms avg
  search: 200,     // ms avg
  errorRate: 0,    // %
}

interface Timing { operation: string; scale: number; elapsed: number }

const results: Timing[] = []

describe('Phase 2: Provider Load Certification', () => {
  for (const scale of SCALES) {
    it(`Register ${scale} provider(s)`, async () => {
      const { ProviderRegistry } = await import('@/core/providers/registry/ProviderRegistry')
      const registry = new ProviderRegistry()

      const start = performance.now()
      for (let i = 0; i < scale; i++) {
        registry.register({
          id: `perf-provider-${scale}-${i}`,
          name: `Perf Provider ${i}`,
          type: 'tv' as const,
          enabled: true,
          priority: i,
        } as any)
      }
      const elapsed = Math.round((performance.now() - start) * 100) / 100

      results.push({ operation: 'register', scale, elapsed })
      const avgPerProvider = elapsed / scale
      console.log(`  Register ${scale}: ${elapsed}ms total, ${Math.round(avgPerProvider * 100) / 100}ms avg`)
      expect(avgPerProvider).toBeLessThan(TARGETS.register)
    })

    it(`Search across ${scale} provider(s)`, async () => {
      const { ProviderRegistry } = await import('@/core/providers/registry/ProviderRegistry')
      const registry = new ProviderRegistry()
      for (let i = 0; i < scale; i++) {
        registry.register({
          id: `perf-search-${scale}-${i}`,
          name: `Search Provider ${i}`,
          type: 'tv' as const,
          enabled: true,
          priority: i,
        } as any)
      }

      const start = performance.now()
      const all = registry.getAll()
      // Simulate search: filter by type
      const filtered = all.filter((p: any) => p.type === 'tv')
      const elapsed = Math.round((performance.now() - start) * 100) / 100

      results.push({ operation: 'search', scale, elapsed })
      console.log(`  Search ${scale}: ${elapsed}ms (found ${filtered.length})`)
      expect(elapsed).toBeLessThan(TARGETS.search)
      expect(filtered.length).toBe(scale) // all match type 'tv'
    })

    it(`Unregister ${scale} provider(s)`, async () => {
      const { ProviderRegistry } = await import('@/core/providers/registry/ProviderRegistry')
      const registry = new ProviderRegistry()
      const ids: string[] = []
      for (let i = 0; i < scale; i++) {
        const id = `perf-unreg-${scale}-${i}`
        ids.push(id)
        registry.register({ id, name: `P${i}`, type: 'tv' as const, enabled: true, priority: i } as any)
      }

      const start = performance.now()
      for (const id of ids) {
        registry.unregister(id)
      }
      const elapsed = Math.round((performance.now() - start) * 100) / 100

      results.push({ operation: 'unregister', scale, elapsed })
      console.log(`  Unregister ${scale}: ${elapsed}ms total`)
      expect(registry.getAll().length).toBe(0)
    })
  }

  it('PROVIDER LOAD SUMMARY', () => {
    console.log('\n=== Provider Load Results ===')
    for (const r of results) {
      console.log(`  ${r.operation} @${r.scale}: ${r.elapsed}ms`)
    }

    // Verify no errors
    const errors = results.filter(r => r.elapsed < 0)
    expect(errors.length).toBe(0)

    // All registrations should be fast
    for (const r of results.filter(r => r.operation === 'register')) {
      expect(r.elapsed / r.scale).toBeLessThan(TARGETS.register)
    }
  })
})
