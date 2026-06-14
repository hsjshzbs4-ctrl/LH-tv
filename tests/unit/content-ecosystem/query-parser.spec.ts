// tests/unit/content-ecosystem/query-parser.spec.ts — CE7 QueryParser unit tests

import { describe, it, expect } from 'vitest'
import { QueryParser } from '@/core/content-ecosystem/search/engine/QueryParser'

describe('QueryParser', () => {
  const parser = new QueryParser()

  it('should parse a simple keyword', () => {
    const result = parser.parse('interstellar')
    expect(result.keyword).toBe('interstellar')
    expect(result.tokens).toContain('interstellar')
  })

  it('should parse empty string', () => {
    const result = parser.parse('')
    expect(result.keyword).toBe('')
    expect(result.tokens).toHaveLength(0)
  })

  it('should parse whitespace-only string', () => {
    const result = parser.parse('   ')
    expect(result.keyword).toBe('')
    expect(result.tokens).toHaveLength(0)
  })

  it('should tokenize multi-word queries', () => {
    const result = parser.parse('Breaking Bad')
    expect(result.keyword).toBe('Breaking Bad')
    expect(result.tokens).toContain('breaking')
    expect(result.tokens).toContain('bad')
  })

  it('should handle CJK characters', () => {
    const result = parser.parse('進撃の巨人')
    expect(result.keyword).toBe('進撃の巨人')
    expect(result.tokens.length).toBeGreaterThan(0)
  })

  it('should handle mixed case', () => {
    const result = parser.parse('BrEaKiNg BaD')
    expect(result.keyword).toBe('BrEaKiNg BaD')
    // Tokenization lowercases
    expect(result.tokens).toContain('breaking')
    expect(result.tokens).toContain('bad')
  })

  it('should handle special characters', () => {
    const result = parser.parse('Spider-Man: Homecoming')
    expect(result.keyword).toBe('Spider-Man: Homecoming')
    expect(result.tokens).toContain('spider')
    expect(result.tokens).toContain('man')
    expect(result.tokens).toContain('homecoming')
  })

  it('should filter single-character tokens', () => {
    const result = parser.parse('A B C Movie')
    // 'a', 'b', 'c' filtered; 'movie' kept
    expect(result.tokens).not.toContain('a')
    expect(result.tokens).not.toContain('b')
    expect(result.tokens).not.toContain('c')
    expect(result.tokens).toContain('movie')
  })
})
