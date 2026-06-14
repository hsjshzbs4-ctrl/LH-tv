// modules/recommendation/domain/entities/RecommendationFeed.ts — CE9-A
// FIRST-CLASS return type for ALL recommendation requests (Req 4).
// NEVER return bare RecommendationItem[] from any public API.

import { RecommendationSection } from './RecommendationSection'
import { RecommendationContext } from './RecommendationContext'
import type { RecommendationType } from '../value-objects/RecommendationType'

export interface SourceAttribution {
  readonly sourceType: RecommendationType
  readonly itemCount: number
  readonly weight: number
}

export interface ExperimentInfo {
  readonly experimentId: string
  readonly variantId: string
  readonly strategyWeights: Record<string, number>
}

export interface FeedMetadata {
  readonly confidence: number
  readonly activeEngines: string[]
  readonly generationTimes: Record<string, number>
  readonly totalItems: number
  readonly deduplicatedCount: number
  readonly sourceAttribution: SourceAttribution[]
  readonly experiment: ExperimentInfo
  readonly schemaVersion: number
}

export interface RecommendationFeedProps {
  readonly feedId: string
  readonly sections: RecommendationSection[]
  readonly generatedAt: number
  readonly ttl: number
  readonly context: RecommendationContext
  readonly metadata: FeedMetadata
}

export class RecommendationFeed {
  readonly feedId: string
  readonly sections: readonly RecommendationSection[]
  readonly generatedAt: number
  readonly ttl: number
  readonly context: RecommendationContext
  readonly metadata: FeedMetadata

  private constructor(props: RecommendationFeedProps) {
    if (!props.feedId || props.feedId.trim().length === 0) {
      throw new Error('RecommendationFeed: feedId must not be empty')
    }
    if (props.generatedAt <= 0) {
      throw new Error('RecommendationFeed: generatedAt must be positive timestamp')
    }
    if (props.ttl <= 0) {
      throw new Error('RecommendationFeed: ttl must be positive')
    }
    if (props.metadata.totalItems < 0) {
      throw new Error('RecommendationFeed: totalItems must be >= 0')
    }

    this.feedId = props.feedId.trim()
    this.sections = Object.freeze([...props.sections])
    this.generatedAt = props.generatedAt
    this.ttl = props.ttl
    this.context = props.context
    this.metadata = props.metadata
  }

  static create(props: RecommendationFeedProps): RecommendationFeed {
    return new RecommendationFeed(props)
  }

  // ─── Queries ───

  get totalItems(): number {
    return this.metadata.totalItems
  }

  get confidence(): number {
    return this.metadata.confidence
  }

  get activeEngines(): string[] {
    return [...this.metadata.activeEngines]
  }

  /** Is the feed expired? */
  isExpired(now?: number): boolean {
    return ((now ?? Date.now()) - this.generatedAt) > this.ttl
  }

  /** Time remaining before expiry (ms) */
  timeToLive(now?: number): number {
    return Math.max(0, this.ttl - ((now ?? Date.now()) - this.generatedAt))
  }

  /** Get only non-empty sections */
  get nonEmptySections(): RecommendationSection[] {
    return this.sections.filter(s => !s.isEmpty)
  }

  /** Find a section by type */
  getSection(type: string): RecommendationSection | undefined {
    return this.sections.find(s => s.type === type)
  }

  /** Does this feed have enough content to display? */
  get isDisplayable(): boolean {
    return this.nonEmptySections.length > 0 && this.totalItems > 0
  }

  /** Items across all sections (flattened) */
  get allItems(): readonly import('./RecommendationItem').RecommendationItem[] {
    return Object.freeze(
      this.sections.flatMap(s => [...s.items]),
    )
  }

  /** All distinct mediaIds in the feed */
  get allMediaIds(): string[] {
    return [...new Set(this.allItems.map(i => i.mediaId))]
  }

  equals(other: RecommendationFeed): boolean {
    return this.feedId === other.feedId
  }
}
