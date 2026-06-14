// modules/recommendation/ipc/contracts/RecommendationIPCContracts.ts — CE9-E
// Versioned IPC contracts. Serializable only. No domain/runtime objects.

export const IPC_CONTRACT_VERSION = 1

export interface GenerateFeedRequest {
  readonly version: number
  readonly requestId: string
  readonly userId: string
  readonly experimentId: string
  readonly variantId: string
  readonly feedType: 'personalized' | 'trending' | 'continue-watching' | 'similar-content'
  readonly limit: number
  readonly offset: number
  readonly sourceMediaId?: string
}

export interface GenerateFeedResponse {
  readonly version: number
  readonly requestId: string
  readonly feed: unknown          // Serialized RecommendationFeedDto
  readonly generatedAt: number
  readonly duration: number
  readonly cacheHit: boolean
}

export interface TrackEventRequest {
  readonly version: number
  readonly feedId: string
  readonly mediaId: string
  readonly action: 'click' | 'play' | 'favorite' | 'dismiss' | 'hide' | 'watch-complete'
  readonly sectionId?: string
  readonly position?: number
  readonly sourceId?: string
}

export interface TrackEventResponse {
  readonly version: number
  readonly success: boolean
  readonly error?: string
}

export interface HealthResponse {
  readonly version: number
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly engineCount: number
  readonly cacheSize: number
  readonly uptimeMs: number
}

export interface MetricsResponse {
  readonly version: number
  readonly requestsTotal: number
  readonly cacheHitRatio: number
  readonly avgGenerationTimeMs: number
  readonly providers: { name: string; latencyMs: number; available: boolean }[]
}
