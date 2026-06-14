// modules/recommendation/domain/services/RecommendationScoringService.ts — CE9-A
// Multi-objective scoring engine (Req 6).
// Stateless — pure function transformations.

import { RecommendationScore, DEFAULT_SCORE_WEIGHTS } from '../value-objects/RecommendationScore'
import type { ScoreBreakdown, ScoreWeights } from '../value-objects/RecommendationScore'

export interface ScoringInput {
  /** Genre overlap ratio (0-1) */
  readonly genreMatch: number
  /** Cast/crew overlap ratio (0-1) */
  readonly castMatch: number
  /** Content type match (0-1) */
  readonly typeMatch: number
  /** Year proximity (0-1, 1 = exact match or close) */
  readonly yearProximity: number
  /** Rating quality normalized to 0-1 */
  readonly ratingQuality: number
  /** Novelty: has user seen this? (1 = completely new) */
  readonly novelty: number
  /** Diversity contribution vs other items (0-1) */
  readonly diversity: number
  /** Global popularity (0-1) */
  readonly popularity: number
  /** Content freshness (0-1, 1 = just added) */
  readonly freshness: number
  /** Confidence in the data quality (0-1) */
  readonly confidence: number
}

const DEFAULT_DIMENSION_WEIGHTS = {
  genreMatch: 0.30,
  castMatch: 0.20,
  typeMatch: 0.15,
  yearProximity: 0.05,
  ratingQuality: 0.10,
  novelty: 0.10,
  diversity: 0.05,
  popularity: 0.03,
  freshness: 0.02,
}

export class RecommendationScoringService {
  private dimensionWeights: typeof DEFAULT_DIMENSION_WEIGHTS

  constructor(dimensionWeights?: Partial<typeof DEFAULT_DIMENSION_WEIGHTS>) {
    this.dimensionWeights = { ...DEFAULT_DIMENSION_WEIGHTS, ...dimensionWeights }
  }

  /**
   * Compute multi-objective score from scoring inputs.
   * All inputs should be normalized to 0-1 range.
   */
  score(input: ScoringInput, weights?: ScoreWeights): RecommendationScore {
    const dw = this.dimensionWeights

    const interestScore = this._clamp(
      dw.genreMatch * input.genreMatch +
      dw.castMatch * input.castMatch +
      dw.typeMatch * input.typeMatch +
      dw.yearProximity * input.yearProximity +
      dw.ratingQuality * input.ratingQuality,
    )

    const noveltyScore = this._clamp(input.novelty)
    const diversityScore = this._clamp(input.diversity)
    const popularityScore = this._clamp(input.popularity)
    const freshnessScore = this._clamp(input.freshness)

    const breakdown: ScoreBreakdown = {
      interestScore,
      noveltyScore,
      diversityScore,
      popularityScore,
      freshnessScore,
    }

    return RecommendationScore.create(breakdown, weights, input.confidence)
  }

  /**
   * Quick score for content-based matching only.
   * Useful when novelty/diversity/freshness signals are unavailable.
   */
  scoreContentMatch(
    genreMatch: number,
    castMatch: number,
    typeMatch: number,
    confidence: number,
    weights?: ScoreWeights,
  ): RecommendationScore {
    const dw = this.dimensionWeights
    const interestScore = this._clamp(
      dw.genreMatch * genreMatch +
      dw.castMatch * castMatch +
      dw.typeMatch * typeMatch,
    )

    return RecommendationScore.create(
      {
        interestScore,
        noveltyScore: 0.5,   // unknown — neutral
        diversityScore: 0.5,
        popularityScore: 0.5,
        freshnessScore: 0.5,
      },
      weights,
      confidence,
    )
  }

  /**
   * Score for cold-start (no profile data).
   * Relies entirely on popularity + freshness signals.
   */
  scoreColdStart(popularity: number, freshness: number, confidence: number): RecommendationScore {
    return RecommendationScore.create(
      {
        interestScore: 0.5,     // neutral — no profile to compare
        noveltyScore: 1.0,      // everything is new to a cold-start user
        diversityScore: 0.5,
        popularityScore: this._clamp(popularity),
        freshnessScore: this._clamp(freshness),
      },
      {
        ...DEFAULT_SCORE_WEIGHTS,
        interest: 0.15,
        popularity: 0.45,
        freshness: 0.30,
      },
      confidence,
    )
  }

  private _clamp(value: number): number {
    return Math.max(0, Math.min(1, value))
  }
}
