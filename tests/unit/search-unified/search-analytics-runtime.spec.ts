// tests/unit/search-unified/search-analytics-runtime.spec.ts — CE8-C2 AnalyticsRuntime tests

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchAnalyticsRuntime } from '@/modules/search-unified/infrastructure/services/SearchAnalyticsRuntime'

describe('SearchAnalyticsRuntime', () => {
  let runtime: SearchAnalyticsRuntime

  beforeEach(() => { runtime = new SearchAnalyticsRuntime() })

  it('should buffer search events', () => {
    runtime.recordSearch({ query: 'test', resultCount: 5, searchTimeMs: 42, timestamp: Date.now() })
    expect(runtime.bufferSize).toBe(1)
  })

  it('should buffer click events', () => {
    runtime.recordClick({ contentId: 'tmdb:1', query: 'test', position: 3, timestamp: Date.now() })
    expect(runtime.bufferSize).toBe(1)
  })

  it('should buffer play events', () => {
    runtime.recordPlay({ contentId: 'tmdb:1', sourceId: 'jellyfin-1', timestamp: Date.now() })
    expect(runtime.bufferSize).toBe(1)
  })

  it('should flush events to listener', () => {
    const listener = vi.fn()
    runtime.onFlush(listener)
    runtime.recordSearch({ query: 'q', resultCount: 1, searchTimeMs: 10, timestamp: 1 })

    runtime.flush()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toHaveLength(1)
    expect(runtime.bufferSize).toBe(0)
  })

  it('should not throw on analytics failure', () => {
    expect(() => runtime.recordSearch({
      query: 'q', resultCount: 1, searchTimeMs: 10, timestamp: Date.now(),
    })).not.toThrow()
  })

  it('should destroy cleanly', () => {
    runtime.recordSearch({ query: 'q', resultCount: 1, searchTimeMs: 10, timestamp: Date.now() })
    const listener = vi.fn()
    runtime.onFlush(listener)
    runtime.destroy()
    expect(listener).toHaveBeenCalled()
    expect(runtime.bufferSize).toBe(0)
  })
})
