// modules/search-unified/infrastructure/adapters/ProviderClientWrapper.ts — CE8-C1
// Wraps provider search calls with timeout, retry, error translation, and logging.
// Does NOT call HTTP directly — delegates to the provider's search method.

import { SearchProviderError, SearchTimeoutError } from '../../application/errors/SearchErrors'
import type { SearchDocument } from '../../domain/contracts/ISearchProvider'
import type { SearchQuery } from '../../domain/value-objects/SearchQuery'
import type { SearchProviderMetrics } from '../metrics/SearchProviderMetrics'

export interface RetryConfig {
  readonly maxRetries: number
  readonly baseDelayMs: number
}

const DEFAULT_TIMEOUT_MS = 3000

export class ProviderClientWrapper {
  constructor(
    private metrics: SearchProviderMetrics,
  ) {}

  /**
   * Execute a provider search with timeout, retry, and error translation.
   */
  async execute(
    providerId: string,
    retryConfig: RetryConfig,
    searchFn: (query: SearchQuery) => Promise<SearchDocument[]>,
    query: SearchQuery,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<SearchDocument[]> {
    const startTime = performance.now()

    let lastError: Error | null = null
    const maxAttempts = retryConfig.maxRetries + 1

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this._withTimeout(
          searchFn(query),
          timeoutMs,
          providerId,
        )

        // Success — record metric
        this.metrics.recordSuccess(providerId, performance.now() - startTime)
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = retryConfig.baseDelayMs * Math.pow(2, attempt - 1)
          await new Promise(r => setTimeout(r, delay))
        }
      }
    }

    // All attempts failed
    this.metrics.recordError(providerId)
    throw this._translateError(providerId, lastError!, timeoutMs)
  }

  /**
   * Execute with a timeout guard.
   */
  private async _withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    providerId: string,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Provider ${providerId} timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeout])
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  private _translateError(
    providerId: string,
    error: Error,
    timeoutMs: number,
  ): SearchProviderError | SearchTimeoutError {
    const msg = error.message.toLowerCase()
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return new SearchTimeoutError(`Provider ${providerId} timed out`, providerId, timeoutMs)
    }
    return new SearchProviderError(`Provider ${providerId} failed: ${error.message}`, providerId)
  }
}
