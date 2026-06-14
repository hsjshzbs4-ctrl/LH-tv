// modules/recommendation/runtime/providers/TrendingRecommendationProvider.ts — CE9-C
// Provider-agnostic trending recommendation provider.
// Generates recommendations from global trending signals.
// Implements IRecommendationProvider (Req 1, Req 2).

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { RecommendationSource } from '../../domain/entities/RecommendationSource'
import { RecommendationScore } from '../../domain/value-objects/RecommendationScore'
import { RecommendationReason } from '../../domain/value-objects/RecommendationReason'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export interface TrendingSignal {
  readonly mediaId: string
  readonly title: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly cover: string
  readonly year?: number
  readonly genres: string[]
  readonly trendingScore: number
  readonly searchVolume: number
}

export class TrendingRecommendationProvider implements IRecommendationProvider {
  readonly name = 'trending-recommendation'
  readonly type: RecommendationType = 'trending'
  readonly version = '1.0.0'

  private _state: EngineState = 'unregistered'
  private _trendingCache: TrendingSignal[] = []
  private _lastLatency = 0
  private _itemsGenerated = 0
  private _consecutiveErrors = 0

  get state(): EngineState { return this._state }

  /** Feed trending signals from external sources (search trends, provider data) */
  updateSignals(signals: TrendingSignal[]): void {
    this._trendingCache = [...signals]
      .sort((a, b) => b.trendingScore - a.trendingScore)
  }

  async initialize(): Promise<void> {
    this._state = 'initializing'
    this._state = 'ready'
  }

  async generate(
    ctx: RecommendationContext,
    _profile: RecommendationProfile,
    limit: number,
  ): Promise<RecommendationItem[]> {
    const start = Date.now()
    this._state = 'generating'

    try {
      const signalSlice = this._trendingCache.slice(0, limit)

      const items = signalSlice.map((signal, idx) => {
        const score = RecommendationScore.create(
          {
            interestScore: 0.5,
            noveltyScore: 0.7,
            diversityScore: 0.5,
            popularityScore: signal.trendingScore,
            freshnessScore: 0.5,
          },
          undefined,
          0.6,
        )

        const topGenre = signal.genres[0]
        const reason = topGenre
          ? RecommendationReason.trendingInGenre(topGenre)
          : RecommendationReason.topPick()

        return RecommendationItem.create({
          mediaId: signal.mediaId,
          title: signal.title,
          cover: signal.cover,
          type: signal.type,
          year: signal.year,
          score,
          reason,
          sources: [
            RecommendationSource.create({
              sourceType: 'trending',
              label: 'Trending Engine',
              weight: 1.0,
            }),
          ],
          genres: signal.genres,
        })
      })

      this._itemsGenerated += items.length
      this._state = 'ready'
      this._lastLatency = Date.now() - start
      return items
    } catch {
      this._state = 'degraded'
      this._consecutiveErrors++
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
      consecutiveErrors: this._consecutiveErrors,
      itemsGenerated: this._itemsGenerated,
      averageLatencyMs: this._lastLatency,
    }
  }

  async refresh(): Promise<void> {
    // Signals are refreshed externally via updateSignals()
  }

  async dispose(): Promise<void> {
    this._trendingCache = []
    this._state = 'disposed'
  }
}
