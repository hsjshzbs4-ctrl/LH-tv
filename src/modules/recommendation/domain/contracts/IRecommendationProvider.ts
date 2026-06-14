// modules/recommendation/domain/contracts/IRecommendationProvider.ts — CE9-A
// Every recommendation source MUST implement this interface (Req 2).
// Provider-agnostic: no Jellyfin/Plex/Emby specific logic here (Req 1).

import type { RecommendationItem } from '../entities/RecommendationItem'
import type { RecommendationContext } from '../entities/RecommendationContext'
import type { RecommendationProfile } from '../entities/RecommendationProfile'
import type { RecommendationType } from '../value-objects/RecommendationType'

export type EngineState =
  | 'unregistered'
  | 'registered'
  | 'initializing'
  | 'ready'
  | 'generating'
  | 'degraded'
  | 'disposed'

export interface EngineHealth {
  readonly state: EngineState
  readonly lastGenerationTimeMs?: number
  readonly lastSuccessAt?: number
  readonly lastErrorAt?: number
  readonly consecutiveErrors: number
  readonly itemsGenerated: number
  readonly averageLatencyMs: number
}

export interface IRecommendationProvider {
  /** Unique engine identifier (e.g., 'profile-based', 'trend-based') */
  readonly name: string

  /** Which recommendation type this engine produces */
  readonly type: RecommendationType

  /** Engine version — bump to invalidate caches */
  readonly version: string

  /** Current lifecycle state */
  readonly state: EngineState

  /** Initialize engine (load data, connect to sources) */
  initialize(): Promise<void>

  /**
   * Generate recommendations.
   * @param ctx — Recommendation context (carries experiment info — Req 10)
   * @param profile — User preference profile
   * @param limit — Maximum number of items to return
   */
  generate(
    ctx: RecommendationContext,
    profile: RecommendationProfile,
    limit: number,
  ): Promise<RecommendationItem[]>

  /** Check if engine is available for generation */
  isAvailable(): boolean

  /** Get engine health status */
  healthCheck(): EngineHealth

  /** Refresh internal state (hot reload without full re-init) */
  refresh(): Promise<void>

  /** Graceful shutdown — release resources, close connections */
  dispose(): Promise<void>
}
