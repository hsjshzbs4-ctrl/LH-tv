// modules/recommendation/runtime/providers/AIRecommendationProvider.ts — CE9-C
// FUTURE AI recommendation provider — interface implementation placeholder (Req 3).
// Implements IRecommendationProvider. Real AI logic deferred to CE12.
// CE9 only activates the scaffolding — always returns empty results.

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import type { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export class AIRecommendationProvider implements IRecommendationProvider {
  readonly name = 'ai-recommendation'
  readonly type: RecommendationType = 'hybrid'
  readonly version = '1.0.0-ce9-placeholder'

  private _state: EngineState = 'unregistered'

  get state(): EngineState { return this._state }

  async initialize(): Promise<void> {
    this._state = 'initializing'
    // CE9: AI provider is a placeholder — not yet implemented
    // CE12 will connect to local LLM / OpenAI / Claude / Ollama
    this._state = 'ready'
  }

  /** CE9: Returns empty. CE12: AI-powered recommendations. */
  async generate(
    _ctx: RecommendationContext,
    _profile: RecommendationProfile,
    _limit: number,
  ): Promise<RecommendationItem[]> {
    // Placeholder for CE12:
    // 1. Build prompt from profile + context
    // 2. Call AI model (local/cloud)
    // 3. Parse structured recommendation output
    // 4. Generate Nuanced explanations
    return []
  }

  isAvailable(): boolean {
    // CE9: AI provider is never available for real work
    return false
  }

  healthCheck(): EngineHealth {
    return {
      state: this._state,
      consecutiveErrors: 0,
      itemsGenerated: 0,
      averageLatencyMs: 0,
    }
  }

  async refresh(): Promise<void> {
    // No-op in CE9
  }

  async dispose(): Promise<void> {
    this._state = 'disposed'
  }
}
