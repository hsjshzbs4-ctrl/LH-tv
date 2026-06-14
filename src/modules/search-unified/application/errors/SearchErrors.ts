// modules/search-unified/application/errors/SearchErrors.ts — CE8-B
// Application-layer error model. No infrastructure dependencies.

export class SearchError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true,
  ) {
    super(message)
    this.name = 'SearchError'
  }
}

export class SearchValidationError extends SearchError {
  constructor(message: string, public readonly validationErrors: string[]) {
    super(message, 'SEARCH_VALIDATION_ERROR', false)
    this.name = 'SearchValidationError'
  }
}

export class SearchProviderError extends SearchError {
  constructor(
    message: string,
    public readonly providerId: string,
  ) {
    super(message, 'SEARCH_PROVIDER_ERROR', true)
    this.name = 'SearchProviderError'
  }
}

export class SearchTimeoutError extends SearchError {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly timeoutMs: number,
  ) {
    super(message, 'SEARCH_TIMEOUT_ERROR', true)
    this.name = 'SearchTimeoutError'
  }
}

/** Result of a single provider search — success or graceful failure. */
export interface ProviderSearchResult {
  readonly providerId: string
  readonly documents: SearchDocument[] | null
  readonly error?: SearchError
  readonly timedOut: boolean
  readonly elapsedMs: number
}

import type { SearchDocument } from '../../domain/contracts/ISearchProvider'
