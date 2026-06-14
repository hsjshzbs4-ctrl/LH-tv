// modules/recommendation/runtime/providers/LocalRecommendationProvider.ts — CE9-C
// Provider-agnostic local content recommendation provider.
// Uses local library data (favorites, history, watch state).
// Implements IRecommendationProvider (Req 1, Req 2).

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import type { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export class LocalRecommendationProvider implements IRecommendationProvider {
  readonly name = 'local-recommendation'
  readonly type: RecommendationType = 'personalized'
  readonly version = '1.0.0'

  private _state: EngineState = 'unregistered'
  private _lastLatency = 0
  private _itemsGenerated = 0
  private _consecutiveErrors = 0
  private _lastSuccessAt?: number
  private _lastErrorAt?: number

  get state(): EngineState { return this._state }

  async initialize(): Promise<void> {
    this._state = 'initializing'
    // Local provider has no external dependencies — always ready
    this._state = 'ready'
  }

  async generate(
    _ctx: RecommendationContext,
    profile: RecommendationProfile,
    limit: number,
  ): Promise<RecommendationItem[]> {
    const start = Date.now()
    this._state = 'generating'

    try {
      const items: RecommendationItem[] = []

      // Content-based matching using profile preferences
      if (profile.isPersonalized) {
        const topGenres = profile.getTopGenres(5)
        // Items would come from local library search by genre + metadata
        // Placeholder: return empty — real data from infrastructure layer
        this._itemsGenerated += items.length
      }

      this._state = 'ready'
      this._lastLatency = Date.now() - start
      this._lastSuccessAt = Date.now()
      this._consecutiveErrors = 0
      return items.slice(0, limit)
    } catch {
      this._state = 'degraded'
      this._consecutiveErrors++
      this._lastErrorAt = Date.now()
      return []
    }
  }

  isAvailable(): boolean {
    return this._state === 'ready' || this._state === 'generating'
  }

  healthCheck(): EngineHealth {
    return {
      state: this._state,
      lastGenerationTimeMs: this._lastLatency,
      lastSuccessAt: this._lastSuccessAt,
      lastErrorAt: this._lastErrorAt,
      consecutiveErrors: this._consecutiveErrors,
      itemsGenerated: this._itemsGenerated,
      averageLatencyMs: this._lastLatency,
    }
  }

  async refresh(): Promise<void> {
    // Local provider has no external state to refresh
  }

  async dispose(): Promise<void> {
    this._state = 'disposed'
  }
}
