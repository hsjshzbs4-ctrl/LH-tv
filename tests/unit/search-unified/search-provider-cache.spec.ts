// tests/unit/search-unified/search-provider-cache.spec.ts — CE8-C1 Cache tests

import { describe, it, expect, beforeEach } from 'vitest'
import { SearchProviderCache } from '@/modules/search-unified/infrastructure/cache/SearchProviderCache'

describe('SearchProviderCache', () => {
  let cache: SearchProviderCache

  beforeEach(() => { cache = new SearchProviderCache(100) }) // 100ms TTL

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should expire entries after TTL', async () => {
    cache.set('key1', 'value1')
    await new Promise(r => setTimeout(r, 150))
    expect(cache.get('key1')).toBeUndefined()
  })

  it('should generate consistent keys', () => {
    const k1 = cache.key('tmdb', 'Interstellar')
    const k2 = cache.key('tmdb', '  interstellar  ')
    expect(k1).toBe(k2)
  })

  it('should generate different keys for different providers', () => {
    const k1 = cache.key('tmdb', 'test')
    const k2 = cache.key('jellyfin', 'test')
    expect(k1).not.toBe(k2)
  })

  it('should check existence', () => {
    cache.set('key1', 'val')
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('key2')).toBe(false)
  })

  it('should evict expired entries', async () => {
    cache.set('k1', 'v1')
    cache.set('k2', 'v2')
    await new Promise(r => setTimeout(r, 150))
    cache.set('k3', 'v3')
    cache.evict()
    expect(cache.has('k3')).toBe(true)
    expect(cache.has('k1')).toBe(false)
  })

  it('should clear all entries', () => {
    cache.set('k1', 'v1')
    cache.set('k2', 'v2')
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('should report correct size', () => {
    expect(cache.size).toBe(0)
    cache.set('k1', 'v1')
    expect(cache.size).toBe(1)
  })
})
