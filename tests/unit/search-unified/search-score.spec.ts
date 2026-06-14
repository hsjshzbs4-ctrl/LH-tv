// tests/unit/search-unified/search-score.spec.ts — CE8-A SearchScore tests

import { describe, it, expect } from 'vitest'
import { SearchScore } from '@/modules/search-unified/domain/value-objects/SearchScore'

describe('SearchScore', () => {
  it('should create valid score', () => {
    const score = SearchScore.create(42)
    expect(score.value).toBe(42)
  })

  it('should create zero score', () => {
    expect(SearchScore.zero().value).toBe(0)
  })

  it('should create max score', () => {
    expect(SearchScore.max().value).toBe(100)
  })

  it('should reject score below 0', () => {
    expect(() => SearchScore.create(-1)).toThrow('0-100')
  })

  it('should reject score above 100', () => {
    expect(() => SearchScore.create(101)).toThrow('0-100')
  })

  it('should clamp out-of-range values', () => {
    expect(SearchScore.clamp(-5).value).toBe(0)
    expect(SearchScore.clamp(150).value).toBe(100)
    expect(SearchScore.clamp(50).value).toBe(50)
  })

  it('should clamp floats to integers', () => {
    expect(SearchScore.clamp(42.7).value).toBe(43)
    expect(SearchScore.clamp(42.3).value).toBe(42)
  })

  it('should add scores', () => {
    const result = SearchScore.create(30).add(SearchScore.create(20))
    expect(result.value).toBe(50)
  })

  it('should clamp addition result to 100', () => {
    const result = SearchScore.create(80).add(SearchScore.create(50))
    expect(result.value).toBe(100)
  })

  it('should compare scores', () => {
    const a = SearchScore.create(30)
    const b = SearchScore.create(70)
    expect(a.compare(b)).toBeLessThan(0)
    expect(b.compare(a)).toBeGreaterThan(0)
    expect(a.compare(a)).toBe(0)
    expect(b.isGreaterThan(a)).toBe(true)
    expect(a.isGreaterThan(b)).toBe(false)
  })

  it('should equal by value', () => {
    expect(SearchScore.create(50).equals(SearchScore.create(50))).toBe(true)
    expect(SearchScore.create(50).equals(SearchScore.create(51))).toBe(false)
  })
})
