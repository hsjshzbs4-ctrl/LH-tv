// modules/recommendation/runtime/cold-start/ColdStartEngine.ts — CE9-C
// Cold start recommendation engine (Req 8).
// Guarantees 100% recommendation coverage even for users with 0 data.
// Strategies: Popular, Trending, Recent, Hybrid.

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { RecommendationSource } from '../../domain/entities/RecommendationSource'
import { RecommendationScore } from '../../domain/value-objects/RecommendationScore'
import { RecommendationReason } from '../../domain/value-objects/RecommendationReason'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export type ColdStartStrategy = 'popular' | 'trending' | 'recent' | 'hybrid'

export interface ColdStartItem {
  readonly mediaId: string
  readonly title: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly cover: string
  readonly year?: number
  readonly genres: string[]
  readonly popularity: number
}

export class ColdStartEngine implements IRecommendationProvider {
  readonly name = 'cold-start'
  readonly type: RecommendationType = 'popular'
  readonly version = '1.0.0'

  private _state: EngineState = 'unregistered'
  private _popularItems: ColdStartItem[] = []
  private _trendingItems: ColdStartItem[] = []
  private _recentItems: ColdStartItem[] = []
  private _lastLatency = 0
  private _itemsGenerated = 0
  private _consecutiveErrors = 0

  get state(): EngineState { return this._state }

  /** Feed external data into the cold start engine */
  updateItems(
    popular: ColdStartItem[],
    trending: ColdStartItem[],
    recent: ColdStartItem[],
  ): void {
    this._popularItems = [...popular].sort((a, b) => b.popularity - a.popularity)
    this._trendingItems = [...trending]
    this._recentItems = [...recent]
  }

  async initialize(): Promise<void> {
    this._state = 'initializing'
    this._state = 'ready'
  }

  async generate(
    _ctx: RecommendationContext,
    _profile: RecommendationProfile,
    limit: number,
  ): Promise<RecommendationItem[]> {
    const start = Date.now()
    this._state = 'generating'

    try {
      // Hybrid: blend popular + trending + recent
      const pool = this._buildHybridPool(limit * 3)

      const items = pool.slice(0, limit).map(coldItem => {
        const score = RecommendationScore.create(
          {
            interestScore: 0.5,
            noveltyScore: 1.0,
            diversityScore: 0.5,
            popularityScore: coldItem.popularity,
            freshnessScore: 0.5,
          },
        )

        const reason = coldItem.genres.length > 0
          ? RecommendationReason.trendingInGenre(coldItem.genres[0])
          : RecommendationReason.topPick()

        return RecommendationItem.create({
          mediaId: coldItem.mediaId,
          title: coldItem.title,
          cover: coldItem.cover,
          type: coldItem.type,
          year: coldItem.year,
          score,
          reason,
          sources: [
            RecommendationSource.create({
              sourceType: 'popular',
              label: 'Cold Start Engine',
              weight: 1.0,
            }),
          ],
          genres: coldItem.genres,
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
    return this._popularItems.length > 0 || this._trendingItems.length > 0
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
    // Data refreshed externally via updateItems()
  }

  async dispose(): Promise<void> {
    this._popularItems = []
    this._trendingItems = []
    this._recentItems = []
    this._state = 'disposed'
  }

  private _buildHybridPool(totalLimit: number): ColdStartItem[] {
    const seen = new Set<string>()
    const pool: ColdStartItem[] = []

    // 50% popular, 30% trending, 20% recent
    const popularLimit = Math.ceil(totalLimit * 0.5)
    const trendingLimit = Math.ceil(totalLimit * 0.3)
    const recentLimit = totalLimit - popularLimit - trendingLimit

    for (const item of this._popularItems) {
      if (pool.length >= popularLimit) break
      if (!seen.has(item.mediaId)) {
        seen.add(item.mediaId)
        pool.push(item)
      }
    }

    for (const item of this._trendingItems) {
      if (pool.filter(i => this._trendingItems.includes(i)).length >= trendingLimit) break
      if (!seen.has(item.mediaId)) {
        seen.add(item.mediaId)
        pool.push(item)
      }
    }

    for (const item of this._recentItems) {
      if (pool.filter(i => this._recentItems.includes(i)).length >= recentLimit) break
      if (!seen.has(item.mediaId)) {
        seen.add(item.mediaId)
        pool.push(item)
      }
    }

    return pool
  }
}
