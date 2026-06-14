// modules/recommendation/domain/entities/RecommendationItem.ts — CE9-A
// Single recommendation item with multi-objective score and mandatory reason.

import { RecommendationScore } from '../value-objects/RecommendationScore'
import { RecommendationReason } from '../value-objects/RecommendationReason'
import type { RecommendationSource } from './RecommendationSource'

export interface RecommendationItemProps {
  readonly mediaId: string
  readonly title: string
  readonly cover: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly year?: number
  readonly score: RecommendationScore
  readonly reason: RecommendationReason
  readonly sources: RecommendationSource[]
  readonly originalTitle?: string
  readonly backdrop?: string
  readonly overview?: string
  readonly genres?: string[]
  readonly rating?: number
  readonly progress?: number
  readonly duration?: number
  readonly availableOn?: string[]
}

export class RecommendationItem {
  readonly mediaId: string
  readonly title: string
  readonly cover: string
  readonly type: 'movie' | 'tv' | 'anime'
  readonly year?: number
  readonly score: RecommendationScore
  readonly reason: RecommendationReason
  readonly sources: readonly RecommendationSource[]
  readonly originalTitle?: string
  readonly backdrop?: string
  readonly overview?: string
  readonly genres: readonly string[]
  readonly rating?: number
  readonly progress?: number
  readonly duration?: number
  readonly availableOn: readonly string[]

  private constructor(props: RecommendationItemProps) {
    if (!props.mediaId || props.mediaId.trim().length === 0) {
      throw new Error('RecommendationItem: mediaId must not be empty')
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('RecommendationItem: title must not be empty')
    }
    if (!props.cover || props.cover.trim().length === 0) {
      throw new Error('RecommendationItem: cover must not be empty')
    }
    // reason is MANDATORY (Req 5)
    if (!props.reason) {
      throw new Error('RecommendationItem: reason is mandatory (Req 5)')
    }
    if (props.sources.length === 0) {
      throw new Error('RecommendationItem: at least one source required')
    }

    if (props.progress !== undefined && (props.progress < 0 || props.progress > 1)) {
      throw new Error('RecommendationItem: progress must be in [0, 1]')
    }

    this.mediaId = props.mediaId.trim()
    this.title = props.title.trim()
    this.cover = props.cover.trim()
    this.type = props.type
    this.year = props.year
    this.score = props.score
    this.reason = props.reason
    this.sources = Object.freeze([...props.sources])
    this.originalTitle = props.originalTitle?.trim()
    this.backdrop = props.backdrop
    this.overview = props.overview
    this.genres = Object.freeze([...(props.genres ?? [])])
    this.rating = props.rating
    this.progress = props.progress
    this.duration = props.duration
    this.availableOn = Object.freeze([...(props.availableOn ?? [])])
  }

  static create(props: RecommendationItemProps): RecommendationItem {
    return new RecommendationItem(props)
  }

  // ─── Computed ───

  get compositeScore(): number {
    return this.score.composite
  }

  get reasonText(): string {
    return this.reason.rendered
  }

  get isContinueWatching(): boolean {
    return this.progress !== undefined && this.progress > 0 && this.progress < 0.98
  }

  get isCompleted(): boolean {
    return this.progress !== undefined && this.progress >= 0.98
  }

  get matchScore(): number {
    return this.score.composite
  }

  // ─── Comparison ───

  /** Sort by composite score descending (highest first) */
  static compare(a: RecommendationItem, b: RecommendationItem): number {
    return b.score.compare(a.score)
  }

  equals(other: RecommendationItem): boolean {
    return this.mediaId === other.mediaId
  }
}
