// modules/recommendation/domain/value-objects/RecommendationScore.ts — CE9-A
// Multi-objective recommendation score (Req 6).
// Single number is forbidden. Score must be composite with 5 dimensions.

export interface ScoreBreakdown {
  /** How well this matches user's explicit preferences (0-1) */
  readonly interestScore: number
  /** How novel this is — not previously seen/interacted (0-1) */
  readonly noveltyScore: number
  /** Diversity contribution — how different from other items in feed (0-1) */
  readonly diversityScore: number
  /** Global popularity signal (0-1) */
  readonly popularityScore: number
  /** How fresh/recent this content is (0-1) */
  readonly freshnessScore: number
}

export interface ScoreWeights {
  readonly interest: number
  readonly novelty: number
  readonly diversity: number
  readonly popularity: number
  readonly freshness: number
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  interest: 0.35,
  novelty: 0.20,
  diversity: 0.10,
  popularity: 0.15,
  freshness: 0.20,
}

export interface RecommendationScoreProps {
  readonly breakdown: ScoreBreakdown
  readonly weights?: ScoreWeights
  readonly confidence?: number
}

export class RecommendationScore {
  readonly interestScore: number
  readonly noveltyScore: number
  readonly diversityScore: number
  readonly popularityScore: number
  readonly freshnessScore: number
  readonly weights: ScoreWeights
  readonly confidence: number

  private constructor(props: RecommendationScoreProps) {
    const bd = props.breakdown
    this._validateDimension('interestScore', bd.interestScore)
    this._validateDimension('noveltyScore', bd.noveltyScore)
    this._validateDimension('diversityScore', bd.diversityScore)
    this._validateDimension('popularityScore', bd.popularityScore)
    this._validateDimension('freshnessScore', bd.freshnessScore)

    this.interestScore = bd.interestScore
    this.noveltyScore = bd.noveltyScore
    this.diversityScore = bd.diversityScore
    this.popularityScore = bd.popularityScore
    this.freshnessScore = bd.freshnessScore
    this.weights = props.weights ?? { ...DEFAULT_SCORE_WEIGHTS }
    this.confidence = this._clampConfidence(props.confidence ?? 0.5)
  }

  private _validateDimension(name: string, value: number): void {
    if (value < 0 || value > 1) {
      throw new Error(`RecommendationScore: ${name} must be in range [0, 1], got ${value}`)
    }
  }

  private _clampConfidence(value: number): number {
    return Math.max(0, Math.min(1, value))
  }

  static create(breakdown: ScoreBreakdown, weights?: ScoreWeights, confidence?: number): RecommendationScore {
    return new RecommendationScore({ breakdown, weights, confidence })
  }

  static zero(): RecommendationScore {
    return new RecommendationScore({
      breakdown: { interestScore: 0, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0 },
      confidence: 0,
    })
  }

  static perfect(): RecommendationScore {
    return new RecommendationScore({
      breakdown: { interestScore: 1, noveltyScore: 1, diversityScore: 1, popularityScore: 1, freshnessScore: 1 },
      confidence: 1,
    })
  }

  /** Composite score: weighted sum of all dimensions */
  get composite(): number {
    const w = this.weights
    return (
      w.interest * this.interestScore +
      w.novelty * this.noveltyScore +
      w.diversity * this.diversityScore +
      w.popularity * this.popularityScore +
      w.freshness * this.freshnessScore
    )
  }

  /** The raw breakdown as a plain object */
  get breakdown(): ScoreBreakdown {
    return {
      interestScore: this.interestScore,
      noveltyScore: this.noveltyScore,
      diversityScore: this.diversityScore,
      popularityScore: this.popularityScore,
      freshnessScore: this.freshnessScore,
    }
  }

  /** Compare two scores by composite value */
  compare(other: RecommendationScore): number {
    const diff = this.composite - other.composite
    if (diff > 0) return 1
    if (diff < 0) return -1
    return 0
  }

  /** Create a new score with updated dimension */
  withInterest(score: number): RecommendationScore {
    return RecommendationScore.create(
      { ...this.breakdown, interestScore: score },
      this.weights,
      this.confidence,
    )
  }

  withNovelty(score: number): RecommendationScore {
    return RecommendationScore.create(
      { ...this.breakdown, noveltyScore: score },
      this.weights,
      this.confidence,
    )
  }

  withConfidence(confidence: number): RecommendationScore {
    return RecommendationScore.create(this.breakdown, this.weights, confidence)
  }

  withWeights(weights: ScoreWeights): RecommendationScore {
    return RecommendationScore.create(this.breakdown, weights, this.confidence)
  }

  equals(other: RecommendationScore): boolean {
    return this.interestScore === other.interestScore
      && this.noveltyScore === other.noveltyScore
      && this.diversityScore === other.diversityScore
      && this.popularityScore === other.popularityScore
      && this.freshnessScore === other.freshnessScore
  }

  /** Is this score meaningful (composite above threshold)? */
  isMeaningful(threshold = 0.1): boolean {
    return this.composite >= threshold
  }
}
