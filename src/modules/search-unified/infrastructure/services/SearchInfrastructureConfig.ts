// modules/search-unified/infrastructure/services/SearchInfrastructureConfig.ts — CE8-C2
// Centralized configuration for search infrastructure services.
// Single source of truth for timeouts, TTLs, retry counts, and thresholds.

export interface SearchInfrastructureConfig {
  /** Provider timeout in milliseconds */
  readonly timeoutMs: number

  /** Cache TTL in milliseconds */
  readonly cacheTTLMs: number

  /** Default retry count per provider */
  readonly defaultRetryCount: number

  /** Consecutive failures before marking provider degraded */
  readonly healthDegradedThreshold: number

  /** Consecutive failures before marking provider offline */
  readonly healthOfflineThreshold: number

  /** Auto-recovery health check interval in milliseconds */
  readonly healthRecoveryIntervalMs: number

  /** Minimum query length for suggestions */
  readonly suggestionMinQueryLength: number

  /** Maximum suggestions returned */
  readonly suggestionMaxResults: number

  /** Analytics buffer flush interval in milliseconds */
  readonly analyticsFlushIntervalMs: number

  /** Maximum analytics buffer size before forced flush */
  readonly analyticsMaxBufferSize: number
}

export const DEFAULT_CONFIG: SearchInfrastructureConfig = {
  timeoutMs: 3000,
  cacheTTLMs: 60_000,
  defaultRetryCount: 1,
  healthDegradedThreshold: 3,
  healthOfflineThreshold: 5,
  healthRecoveryIntervalMs: 60_000,
  suggestionMinQueryLength: 2,
  suggestionMaxResults: 10,
  analyticsFlushIntervalMs: 30_000,
  analyticsMaxBufferSize: 100,
}
