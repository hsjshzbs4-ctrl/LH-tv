// tests/unit/search-unified/content-identity.spec.ts — CE8-A ContentIdentity tests

import { describe, it, expect } from 'vitest'
import { ContentIdentity } from '@/modules/search-unified/domain/value-objects/ContentIdentity'

describe('ContentIdentity', () => {
  it('should create from valid string', () => {
    const id = ContentIdentity.create('tmdb:157336')
    expect(id.value).toBe('tmdb:157336')
  })

  it('should reject empty string', () => {
    expect(() => ContentIdentity.create('')).toThrow('must not be empty')
  })

  it('should reject whitespace-only string', () => {
    expect(() => ContentIdentity.create('   ')).toThrow('must not be empty')
  })

  it('should trim whitespace', () => {
    const id = ContentIdentity.create('  tmdb:123  ')
    expect(id.value).toBe('tmdb:123')
  })

  it('should generate from TMDB ID (highest priority)', () => {
    const id = ContentIdentity.fromExternalIds(
      { tmdb: 157336, imdb: 'tt0816692' },
      'fallback',
      'movie',
    )
    expect(id.value).toBe('tmdb:157336')
  })

  it('should fallback to IMDB when no TMDB', () => {
    const id = ContentIdentity.fromExternalIds(
      { imdb: 'tt0816692', bangumi: 123 },
      'fallback',
      'movie',
    )
    expect(id.value).toBe('imdb:tt0816692')
  })

  it('should fallback to Bangumi when no TMDB/IMDB', () => {
    const id = ContentIdentity.fromExternalIds(
      { bangumi: 456 },
      'fallback',
      'anime',
    )
    expect(id.value).toBe('bangumi:456')
  })

  it('should fallback to TVMaze when no others', () => {
    const id = ContentIdentity.fromExternalIds(
      { tvmaze: 789 },
      'fallback',
      'tv',
    )
    expect(id.value).toBe('tvmaze:789')
  })

  it('should use fallback when no external IDs', () => {
    const id = ContentIdentity.fromExternalIds(
      {},
      'my-source',
      'movie',
    )
    expect(id.value).toBe('my-source:movie')
  })

  it('should equal by value', () => {
    const a = ContentIdentity.create('tmdb:123')
    const b = ContentIdentity.create('tmdb:123')
    expect(a.equals(b)).toBe(true)
  })

  it('should not equal different values', () => {
    expect(
      ContentIdentity.create('tmdb:123').equals(ContentIdentity.create('tmdb:456')),
    ).toBe(false)
  })

  it('should toString correctly', () => {
    expect(ContentIdentity.create('tmdb:123').toString()).toBe('tmdb:123')
  })
})
