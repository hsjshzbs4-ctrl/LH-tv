// tests/unit/search-unified/ipc-validation.spec.ts — CE8-D/E IPC validation tests

import { describe, it, expect } from 'vitest'
import { SearchIPCSchemaValidator } from '@/modules/search-unified/ipc/validation/SearchIPCSchemaValidator'
import { SearchIPCErrorMapper } from '@/modules/search-unified/ipc/mappers/SearchIPCErrorMapper'
import { SearchIPCRequestMapper } from '@/modules/search-unified/ipc/mappers/SearchIPCRequestMapper'
import { SearchIPCResponseMapper } from '@/modules/search-unified/ipc/mappers/SearchIPCResponseMapper'
import { SEARCH_IPC_CHANNELS } from '@/modules/search-unified/ipc/channels/SearchIPCChannels'

describe('IPC Validation', () => {
  const validator = new SearchIPCSchemaValidator()

  it('should validate 9 unique channels exist', () => {
    const channels = Object.values(SEARCH_IPC_CHANNELS)
    expect(channels).toHaveLength(9)
    // All start with 'unified-search:'
    for (const c of channels) expect(c.startsWith('unified-search:')).toBe(true)
  })

  it('should reject query over 512 chars', () => {
    expect(validator.validateSearchQuery('a'.repeat(513)).valid).toBe(false)
  })

  it('should accept query at 512 chars', () => {
    expect(validator.validateSearchQuery('a'.repeat(512)).valid).toBe(true)
  })

  it('should reject pageSize over 100', () => {
    expect(validator.validatePagination(1, 200).valid).toBe(false)
  })

  it('should validate contentId', () => {
    expect(validator.validateContentId('').valid).toBe(false)
    expect(validator.validateContentId('tmdb:123').valid).toBe(true)
  })

  it('should validate history limit', () => {
    expect(validator.validateHistoryLimit(0).valid).toBe(false)
    expect(validator.validateHistoryLimit(101).valid).toBe(false)
    expect(validator.validateHistoryLimit(50).valid).toBe(true)
  })
})

describe('IPC Error Mapper', () => {
  const mapper = new SearchIPCErrorMapper()

  it('should map timeout to safe message', () => {
    const err = mapper.toSafeError({ message: 'timeout after 3000ms', stack: '/secret/path' })
    expect(err.message).not.toContain('/secret')
    expect(err.message).not.toContain('stack')
    expect(err.code).toBe('INTERNAL_ERROR')
  })

  it('should never include internal paths', () => {
    const err = mapper.toSafeError({ message: '/home/user/.ssh/id_rsa' })
    expect(err.message).not.toContain('.ssh')
    expect(err.message).not.toContain('/home')
  })
})

describe('IPC Mappers', () => {
  it('should map request correctly', () => {
    const m = new SearchIPCRequestMapper()
    const dto = m.toSearchRequest({ version: 1, query: 'test', page: 2, pageSize: 30 })
    expect(dto.page).toBe(2)
    expect(dto.pageSize).toBe(30)
  })

  it('should map empty response', () => {
    const m = new SearchIPCResponseMapper()
    const resp = m.toSearchResponse({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1, hasNextPage: false, searchTimeMs: 0 })
    expect(resp.items).toHaveLength(0)
    expect(resp.total).toBe(0)
  })
})
