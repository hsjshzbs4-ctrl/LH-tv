// tests/unit/search-unified/pagination-service.spec.ts — CE8-B PaginationService tests

import { describe, it, expect } from 'vitest'
import { PaginationService } from '@/modules/search-unified/application/pagination/PaginationService'

describe('PaginationService', () => {
  const service = new PaginationService()

  it('should paginate items', () => {
    const items = Array.from({ length: 25 }, (_, i) => `item-${i}`)
    const result = service.paginate(items, { page: 1, pageSize: 10 })
    expect(result.items).toHaveLength(10)
    expect(result.page).toBe(1)
    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
    expect(result.hasNextPage).toBe(true)
    expect(result.hasPreviousPage).toBe(false)
  })

  it('should handle last page with fewer items', () => {
    const items = Array.from({ length: 25 }, (_, i) => `item-${i}`)
    const result = service.paginate(items, { page: 3, pageSize: 10 })
    expect(result.items).toHaveLength(5)
    expect(result.page).toBe(3)
    expect(result.hasNextPage).toBe(false)
    expect(result.hasPreviousPage).toBe(true)
  })

  it('should clamp page to valid range', () => {
    const items = Array.from({ length: 10 }, (_, i) => `item-${i}`)
    const r1 = service.paginate(items, { page: 0, pageSize: 5 })
    expect(r1.page).toBe(1)

    const r2 = service.paginate(items, { page: 100, pageSize: 5 })
    expect(r2.page).toBe(2)
  })

  it('should compute offset correctly', () => {
    expect(service.getOffset(1, 20)).toBe(0)
    expect(service.getOffset(2, 20)).toBe(20)
    expect(service.getOffset(3, 10)).toBe(20)
  })

  it('should validate page', () => {
    expect(service.isValidPage(1, 5)).toBe(true)
    expect(service.isValidPage(5, 5)).toBe(true)
    expect(service.isValidPage(0, 5)).toBe(false)
    expect(service.isValidPage(6, 5)).toBe(false)
  })

  it('should handle empty items', () => {
    const result = service.paginate([], { page: 1, pageSize: 10 })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
    expect(result.hasNextPage).toBe(false)
  })
})
