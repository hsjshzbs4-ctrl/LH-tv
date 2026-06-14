// tests/unit/search-unified/search-request-dto.spec.ts — CE8-B SearchRequestDto validation tests

import { describe, it, expect } from 'vitest'
import { SearchRequestValidator } from '@/modules/search-unified/application/dto/SearchRequestDto'

describe('SearchRequestValidator', () => {
  it('should validate a valid request', () => {
    const result = SearchRequestValidator.validate({ query: 'Interstellar' })
    expect(result.valid).toBe(true)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it('should reject query exceeding max length', () => {
    const long = 'a'.repeat(501)
    const result = SearchRequestValidator.validate({ query: long })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Query must be <= 500 characters')
  })

  it('should reject page < 1', () => {
    const result = SearchRequestValidator.validate({ query: 'test', page: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Page must be >= 1')
  })

  it('should reject pageSize < 1', () => {
    const result = SearchRequestValidator.validate({ query: 'test', pageSize: 0 })
    expect(result.valid).toBe(false)
  })

  it('should reject pageSize > 100', () => {
    const result = SearchRequestValidator.validate({ query: 'test', pageSize: 200 })
    expect(result.valid).toBe(false)
  })

  it('should accept custom page and pageSize', () => {
    const result = SearchRequestValidator.validate({ query: 'test', page: 3, pageSize: 50 })
    expect(result.valid).toBe(true)
    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(50)
  })

  it('should reject invalid mediaTypes', () => {
    const result = SearchRequestValidator.validate({
      query: 'test',
      mediaTypes: ['invalid' as any],
    })
    expect(result.valid).toBe(false)
  })

  it('should accept valid mediaTypes', () => {
    const result = SearchRequestValidator.validate({
      query: 'test',
      mediaTypes: ['movie', 'tv'],
    })
    expect(result.valid).toBe(true)
  })
})
