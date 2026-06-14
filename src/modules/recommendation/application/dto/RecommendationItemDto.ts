// modules/recommendation/application/dto/RecommendationItemDto.ts — CE9-B
// Single recommendation item DTO. Pure transport — maps from/to RecommendationItem entity.

export interface RecommendationItemDto {
  readonly mediaId: string
  readonly title: string
  readonly originalTitle?: string
  readonly cover: string
  readonly backdrop?: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly year?: number

  /** Multi-objective score breakdown */
  readonly score: ScoreBreakdownDto

  /** Human-readable recommendation reason */
  readonly reason: ReasonDto

  /** Source attribution */
  readonly sources: SourceDto[]

  readonly overview?: string
  readonly genres?: string[]
  readonly rating?: number
  readonly progress?: number
  readonly duration?: number
  readonly availableOn?: string[]
}

export interface ScoreBreakdownDto {
  readonly interestScore: number
  readonly noveltyScore: number
  readonly diversityScore: number
  readonly popularityScore: number
  readonly freshnessScore: number
  readonly composite: number
  readonly confidence: number
}

export interface ReasonDto {
  readonly template: string
  readonly rendered: string
}

export interface SourceDto {
  readonly sourceType: string
  readonly providerId?: string
  readonly label: string
  readonly weight: number
}
