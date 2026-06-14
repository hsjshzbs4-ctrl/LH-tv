// modules/search-unified/bootstrap/SearchModuleConfiguration.ts — CE8-C4
// Central configuration for the unified search module.
// Supports development, testing, and production environments.

export type SearchEnvironment = 'development' | 'testing' | 'production'

export interface SearchModuleConfig {
  readonly environment: SearchEnvironment

  // Provider config
  readonly providers: {
    readonly local: { readonly enabled: boolean }
    readonly tmdb: { readonly enabled: boolean; readonly apiKey?: string }
    readonly jellyfin: { readonly enabled: boolean }
    readonly plex: { readonly enabled: boolean }
    readonly emby: { readonly enabled: boolean }
  }

  // Analytics config
  readonly analytics: {
    readonly enabled: boolean
    readonly flushIntervalMs: number
    readonly maxBufferSize: number
  }

  // History config
  readonly history: {
    readonly enabled: boolean
    readonly maxEntries: number
  }

  // Trending config
  readonly trending: {
    readonly enabled: boolean
  }

  // Health monitoring
  readonly health: {
    readonly enabled: boolean
    readonly degradedThreshold: number
    readonly offlineThreshold: number
    readonly recoveryIntervalMs: number
  }

  // Runtime
  readonly runtime: {
    readonly timeoutMs: number
    readonly cacheTTLMs: number
    readonly defaultRetryCount: number
  }

  // Feature flags
  readonly features: {
    readonly analytics: boolean
    readonly suggestions: boolean
    readonly profiles: boolean
    readonly trending: boolean
    readonly providerMetrics: boolean
  }
}

export const PRODUCTION_CONFIG: SearchModuleConfig = {
  environment: 'production',
  providers: {
    local: { enabled: true },
    tmdb: { enabled: true },
    jellyfin: { enabled: true },
    plex: { enabled: true },
    emby: { enabled: true },
  },
  analytics: { enabled: true, flushIntervalMs: 30_000, maxBufferSize: 100 },
  history: { enabled: true, maxEntries: 5000 },
  trending: { enabled: true },
  health: { enabled: true, degradedThreshold: 3, offlineThreshold: 5, recoveryIntervalMs: 60_000 },
  runtime: { timeoutMs: 3000, cacheTTLMs: 60_000, defaultRetryCount: 1 },
  features: { analytics: true, suggestions: true, profiles: true, trending: true, providerMetrics: true },
}

export const TEST_CONFIG: SearchModuleConfig = {
  ...PRODUCTION_CONFIG,
  environment: 'testing',
  analytics: { ...PRODUCTION_CONFIG.analytics, flushIntervalMs: 1000 },
  runtime: { ...PRODUCTION_CONFIG.runtime, timeoutMs: 500, cacheTTLMs: 100 },
}

export const DEV_CONFIG: SearchModuleConfig = {
  ...PRODUCTION_CONFIG,
  environment: 'development',
}
