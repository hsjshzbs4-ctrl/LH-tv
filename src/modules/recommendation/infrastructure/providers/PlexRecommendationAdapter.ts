// modules/recommendation/infrastructure/providers/PlexRecommendationAdapter.ts — CE9-D
// Adapts Plex media server data into IRecommendationProvider.

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import type { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export class PlexRecommendationAdapter implements IRecommendationProvider {
  readonly name = 'plex-recommendation'
  readonly type: RecommendationType = 'provider-pick'
  readonly version = '1.0.0'
  private _state: EngineState = 'unregistered'

  get state(): EngineState { return this._state }

  async initialize(): Promise<void> { this._state = 'ready' }

  async generate(_ctx: RecommendationContext, _profile: RecommendationProfile, _limit: number): Promise<RecommendationItem[]> {
    return []
  }

  isAvailable(): boolean { return this._state === 'ready' }

  healthCheck(): EngineHealth {
    return { state: this._state, consecutiveErrors: 0, itemsGenerated: 0, averageLatencyMs: 0 }
  }

  async refresh(): Promise<void> {}
  async dispose(): Promise<void> { this._state = 'disposed' }
}
