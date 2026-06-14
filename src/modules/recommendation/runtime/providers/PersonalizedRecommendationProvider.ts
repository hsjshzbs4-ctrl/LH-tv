// modules/recommendation/runtime/providers/PersonalizedRecommendationProvider.ts — CE9-C
// Provider-agnostic personalized recommendation provider.
// Uses user profile to generate personalized "For You" recommendations.
// Implements IRecommendationProvider (Req 1, Req 2).

import type { IRecommendationProvider, EngineState, EngineHealth } from '../../domain/contracts/IRecommendationProvider'
import { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { RecommendationSource } from '../../domain/entities/RecommendationSource'
import { RecommendationScore } from '../../domain/value-objects/RecommendationScore'
import { RecommendationReason } from '../../domain/value-objects/RecommendationReason'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RecommendationType } from '../../domain/value-objects/RecommendationType'

export interface CandidateContent {
  readonly mediaId: string
  readonly title: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly cover: string
  readonly year?: number
  readonly genres: string[]
  readonly rating?: number
  readonly overview?: string
}

export class PersonalizedRecommendationProvider implements IRecommendationProvider {
  readonly name = 'personalized-recommendation'
  readonly type: RecommendationType = 'personalized'
  readonly version = '1.0.0'

  private _state: EngineState = 'unregistered'
  private _candidatePool: CandidateContent[] = []
  private _lastLatency = 0
  private _itemsGenerated = 0
  private _consecutiveErrors = 0

  get state(): EngineState { return this._state }

  /** Update the candidate pool from which to generate personalized recs */
  updateCandidatePool(pool: CandidateContent[]): void {
    this._candidatePool = [...pool]
  }

  async initialize(): Promise<void> {
    this._state = 'initializing'
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
      if (!profile.isPersonalized || this._candidatePool.length === 0) {
        this._state = 'ready'
        return []
      }

      const topGenres = new Set(profile.getTopGenres(5).map(g => g.genre))

      // Score each candidate against user profile
      const scored = this._candidatePool
        .filter(c => !profile.hasInteractedWith(c.mediaId))
        .map(candidate => {
          const genreOverlap = candidate.genres.filter(g => topGenres.has(g))
          const genreScore = topGenres.size > 0
            ? genreOverlap.length / Math.min(topGenres.size, candidate.genres.length || 1)
            : 0

          const typeScore = candidate.type === profile.dominantType ? 1.0 : 0.5
          const interestScore = genreScore * 0.6 + typeScore * 0.4

          const rating = candidate.rating ?? 5
          const ratingQuality = rating / 10

          const score = RecommendationScore.create(
            {
              interestScore: this._clamp(interestScore),
              noveltyScore: profile.hasInteractedWith(candidate.mediaId) ? 0 : 1,
              diversityScore: 0.5,
              popularityScore: 0.5,
              freshnessScore: 0.5,
            },
            undefined,
            profile.isPersonalized ? 0.7 : 0.3,
          )

          const reason = genreOverlap.length > 0
            ? RecommendationReason.trendingInGenre(genreOverlap[0])
            : RecommendationReason.recommendedForYou()

          return RecommendationItem.create({
            mediaId: candidate.mediaId,
            title: candidate.title,
            cover: candidate.cover,
            type: candidate.type,
            year: candidate.year,
            score,
            reason,
            sources: [
              RecommendationSource.create({
                sourceType: 'personalized',
                label: 'Personalized Engine',
                weight: 1.0,
              }),
            ],
            genres: candidate.genres,
            rating: candidate.rating,
            overview: candidate.overview,
          })
        })

      // Sort by composite score descending
      scored.sort((a, b) => b.score.composite - a.score.composite)

      this._itemsGenerated += scored.length
      this._state = 'ready'
      this._lastLatency = Date.now() - start
      return scored.slice(0, limit)
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
    // Pool refreshed externally via updateCandidatePool()
  }

  async dispose(): Promise<void> {
    this._candidatePool = []
    this._state = 'disposed'
  }

  private _clamp(v: number): number {
    return Math.max(0, Math.min(1, v))
  }
}
