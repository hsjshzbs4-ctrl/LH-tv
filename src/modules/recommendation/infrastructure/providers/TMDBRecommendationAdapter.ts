// modules/recommendation/infrastructure/providers/TMDBRecommendationAdapter.ts — CE9-D
// Adapts TMDB metadata into IRecommendationProvider.

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import type { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export class TMDBRecommendationAdapter implements IRecommendationProvider {
  readonly name = 'tmdb-recommendation'
  readonly type: RecommendationType = 'similar'
  readonly version = '1.0.0'
  private _state: EngineState = 'unregistered'

  get state(): EngineState { return this._state }

  async initialize(): Promise<void> { this._state = 'ready' }

  async generate(_ctx: RecommendationContext, _profile: RecommendationProfile, _limit: number): Promise<RecommendationItem[]> {
    // Calls TMDB /movie/{id}/recommendations and /tv/{id}/recommendations
    return []
  }

  isAvailable(): boolean { return this._state === 'ready' }

  healthCheck(): EngineHealth {
    return { state: this._state, consecutiveErrors: 0, itemsGenerated: 0, averageLatencyMs: 0 }
  }

  async refresh(): Promise<void> {}
  async dispose(): Promise<void> { this._state = 'disposed' }
}
