// tests/unit/search-unified/search-query.spec.ts — CE8-A SearchQuery tests

import { describe, it, expect } from 'vitest'
import { SearchQuery } from '@/modules/search-unified/domain/value-objects/SearchQuery'

describe('SearchQuery', () => {
  it('should create from raw string', () => {
    const q = SearchQuery.create('Interstellar')
    expect(q.raw).toBe('Interstellar')
    expect(q.normalized).toBe('interstellar')
  })

  it('should trim whitespace', () => {
    const q = SearchQuery.create('  hello  world  ')
    expect(q.normalized).toBe('hello world')
    expect(q.raw).toBe('  hello  world  ')
  })

  it('should normalize multiple spaces to single space', () => {
    const q = SearchQuery.create('hello    world')
    expect(q.normalized).toBe('hello world')
  })

  it('should lowercase', () => {
    const q = SearchQuery.create('BREAKING BAD')
    expect(q.normalized).toBe('breaking bad')
  })

  it('should tokenize words', () => {
    const q = SearchQuery.create('Breaking Bad Movie')
    expect(q.tokens).toContain('breaking')
    expect(q.tokens).toContain('bad')
    expect(q.tokens).toContain('movie')
  })

  it('should handle empty string', () => {
    const q = SearchQuery.create('')
    expect(q.isEmpty).toBe(true)
    expect(q.tokens).toHaveLength(0)
  })

  it('should create empty via static method', () => {
    const q = SearchQuery.empty()
    expect(q.isEmpty).toBe(true)
    expect(q.normalized).toBe('')
  })

  it('should filter single-character tokens', () => {
    const q = SearchQuery.create('a b c movie')
    expect(q.tokens).not.toContain('a')
    expect(q.tokens).toContain('movie')
  })

  it('should equal by normalized value', () => {
    const a = SearchQuery.create('  Hello World  ')
    const b = SearchQuery.create('hello world')
    expect(a.equals(b)).toBe(true)
  })

  it('should not equal different values', () => {
    const a = SearchQuery.create('hello')
    const b = SearchQuery.create('world')
    expect(a.equals(b)).toBe(false)
  })
})
