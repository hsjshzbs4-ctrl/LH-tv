// modules/search-unified/application/pagination/PaginationService.ts — CE8-B
// Standalone pagination service. Framework-agnostic.

export interface PaginationParams {
  readonly page: number    // 1-based
  readonly pageSize: number
}

export interface PaginationResult<T> {
  readonly items: T[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly offset: number
}

export class PaginationService {
  /**
   * Paginate an array of items.
   */
  paginate<T>(items: T[], params: PaginationParams): PaginationResult<T> {
    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / params.pageSize))
    const page = Math.max(1, Math.min(params.page, totalPages))
    const offset = (page - 1) * params.pageSize

    const paged = items.slice(offset, offset + params.pageSize)

    return {
      items: paged,
      page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      offset,
    }
  }

  /**
   * Compute offset from page and pageSize.
   */
  getOffset(page: number, pageSize: number): number {
    return (Math.max(1, page) - 1) * Math.max(1, pageSize)
  }

  /**
   * Check if a page is valid.
   */
  isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages
  }
}
