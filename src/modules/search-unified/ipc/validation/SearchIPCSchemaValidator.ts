// modules/search-unified/ipc/validation/SearchIPCSchemaValidator.ts — CE8-D
// Runtime validation for IPC requests. Rejects invalid requests without crashing.

const MAX_QUERY_LENGTH = 512
const MAX_SUGGESTIONS = 20
const MAX_HISTORY = 100

export interface ValidationResult {
  readonly valid: boolean
  readonly error?: string
}

export class SearchIPCSchemaValidator {
  validateSearchQuery(query: unknown): ValidationResult {
    if (typeof query !== 'string') return { valid: false, error: 'query must be a string' }
    if (query.length > MAX_QUERY_LENGTH) return { valid: false, error: `query exceeds max length ${MAX_QUERY_LENGTH}` }
    return { valid: true }
  }

  validatePagination(page: unknown, pageSize: unknown): ValidationResult {
    if (page !== undefined && (typeof page !== 'number' || page < 1)) return { valid: false, error: 'page must be >= 1' }
    if (pageSize !== undefined && (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100)) return { valid: false, error: 'pageSize must be 1-100' }
    return { valid: true }
  }

  validateSuggestQuery(query: unknown): ValidationResult {
    if (typeof query !== 'string') return { valid: false, error: 'query must be a string' }
    if (query.length > MAX_QUERY_LENGTH) return { valid: false, error: 'query too long' }
    return { valid: true }
  }

  validateContentId(id: unknown): ValidationResult {
    if (typeof id !== 'string' || id.length === 0) return { valid: false, error: 'contentId required' }
    return { valid: true }
  }

  validateHistoryLimit(limit: unknown): ValidationResult {
    if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > MAX_HISTORY)) return { valid: false, error: `limit must be 1-${MAX_HISTORY}` }
    return { valid: true }
  }

  validateVersion(version: unknown): ValidationResult {
    if (typeof version !== 'number' || version < 1) return { valid: false, error: 'version required' }
    return { valid: true }
  }
}
