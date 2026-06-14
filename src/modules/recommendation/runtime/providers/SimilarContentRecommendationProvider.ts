// modules/recommendation/runtime/providers/SimilarContentRecommendationProvider.ts — CE9-C
// Provider-agnostic similar content recommendation provider.
// Finds content similar to a given source media item.
// Implements IRecommendationProvider (Req 1, Req 2).

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { RecommendationSource } from '../../domain/entities/RecommendationSource'
import { RecommendationScore } from '../../domain/value-objects/RecommendationScore'
import { RecommendationReason } from '../../domain/value-objects/RecommendationReason'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export interface SimilarContentRequest {
  readonly sourceMediaId: string
  readonly sourceTitle: string
  readonly sourceType: 'movie' | 'tv' | 'anime'
  readonly sourceGenres: string[]
}

export interface SimilarContentCandidate {
  readonly mediaId: string
  readonly title: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly cover: string
  readonly year?: number
  readonly genres: string[]
  readonly matchScore: number
  readonly matchReason: string
}

export class SimilarContentRecommendationProvider implements IRecommendationProvider {
  readonly name = 'similar-content'
  readonly type: RecommendationType = 'similar'
  readonly version = '1.0.0'

  private _state: EngineState = 'unregistered'
  private _candidates: SimilarContentCandidate[] = []
  private _currentSource: SimilarContentRequest | null = null
  private _lastLatency = 0
  private _itemsGenerated = 0
  private _consecutiveErrors = 0

  get state(): EngineState { return this._state }

  /** Set the source media and candidate list */
  setContext(source: SimilarContentRequest, candidates: SimilarContentCandidate[]): void {
    this._currentSource = source
    this._candidates = [...candidates].sort((a, b) => b.matchScore - a.matchScore)
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
      if (!this._currentSource || this._candidates.length === 0) {
        this._state = 'ready'
        return []
      }

      const items = this._candidates.slice(0, limit).map(candidate => {
        const score = RecommendationScore.create(
          {
            interestScore: candidate.matchScore,
            noveltyScore: 0.8,
            diversityScore: 0.4,
            popularityScore: 0.5,
            freshnessScore: 0.5,
          },
          undefined,
          0.7,
        )

        return RecommendationItem.create({
          mediaId: candidate.mediaId,
          title: candidate.title,
          cover: candidate.cover,
          type: candidate.type,
          year: candidate.year,
          score,
          reason: RecommendationReason.similarTo(this._currentSource!.sourceTitle),
          sources: [
            RecommendationSource.create({
              sourceType: 'similar',
              label: 'Similarity Engine',
              weight: 1.0,
            }),
          ],
          genres: candidate.genres,
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
    this._candidates = []
    this._currentSource = null
  }

  async dispose(): Promise<void> {
    this._candidates = []
    this._currentSource = null
    this._state = 'disposed'
  }
}
