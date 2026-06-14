// modules/search-unified/infrastructure/storage/models/ProviderUsageEntry.ts — CE8-C3
// Per-provider usage statistics.

export interface ProviderUsageEntry {
  readonly providerId: string
  searches: number
  results: number
  clicks: number
  plays: number
  successCount: number
  errorCount: number
  totalLatencyMs: number
  lastUsedAt: number

  /** Computed */
  readonly successRate?: number
  readonly averageLatencyMs?: number
}
