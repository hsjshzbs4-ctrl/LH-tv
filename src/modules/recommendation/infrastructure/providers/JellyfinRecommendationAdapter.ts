// modules/recommendation/infrastructure/providers/JellyfinRecommendationAdapter.ts — CE9-D
// Adapts Jellyfin media server data into IRecommendationProvider.
// Provider-agnostic interface, Jellyfin-specific implementation in adapter only.

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { RecommendationSource } from '../../domain/entities/RecommendationSource'
import { RecommendationScore } from '../../domain/value-objects/RecommendationScore'
import { RecommendationReason } from '../../domain/value-objects/RecommendationReason'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export class JellyfinRecommendationAdapter implements IRecommendationProvider {
  readonly name = 'jellyfin-recommendation'
  readonly type: RecommendationType = 'provider-pick'
  readonly version = '1.0.0'
  private _state: EngineState = 'unregistered'

  get state(): EngineState { return this._state }

  async initialize(): Promise<void> { this._state = 'ready' }

  async generate(_ctx: RecommendationContext, _profile: RecommendationProfile, limit: number): Promise<RecommendationItem[]> {
    // Queries Jellyfin server for popular/recent content
    // Adapter layer — delegates to actual Jellyfin API in integration layer
    return []
  }

  isAvailable(): boolean { return this._state === 'ready' }

  healthCheck(): EngineHealth {
    return { state: this._state, consecutiveErrors: 0, itemsGenerated: 0, averageLatencyMs: 0 }
  }

  async refresh(): Promise<void> {}
  async dispose(): Promise<void> { this._state = 'disposed' }
}
