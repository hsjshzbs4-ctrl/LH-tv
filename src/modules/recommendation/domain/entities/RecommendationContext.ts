// modules/recommendation/domain/entities/RecommendationContext.ts — CE9-A
// Recommendation context — immutable, carries experiment info (Req 10).

export interface InteractionRecord {
  readonly mediaId: string
  readonly action: 'impression' | 'click' | 'play' | 'favorite' | 'dismiss'
  readonly timestamp: number
}

export interface RecommendationContextProps {
  readonly userId: string
  readonly timestamp: number
  readonly experimentId: string
  readonly variantId: string
  readonly sessionId: string
  readonly recentInteractions?: InteractionRecord[]
  readonly activeProviderIds?: string[]
}

export class RecommendationContext {
  readonly userId: string
  readonly timestamp: number
  readonly experimentId: string
  readonly variantId: string
  readonly sessionId: string
  readonly recentInteractions: readonly InteractionRecord[]
  readonly activeProviderIds: readonly string[]

  private constructor(props: RecommendationContextProps) {
    if (!props.userId || props.userId.trim().length === 0) {
      throw new Error('RecommendationContext: userId must not be empty')
    }
    if (!props.experimentId || props.experimentId.trim().length === 0) {
      throw new Error('RecommendationContext: experimentId is required (Req 10)')
    }
    if (!props.variantId || props.variantId.trim().length === 0) {
      throw new Error('RecommendationContext: variantId is required (Req 10)')
    }
    if (!props.sessionId || props.sessionId.trim().length === 0) {
      throw new Error('RecommendationContext: sessionId must not be empty')
    }

    this.userId = props.userId.trim()
    this.timestamp = props.timestamp
    this.experimentId = props.experimentId.trim()
    this.variantId = props.variantId.trim()
    this.sessionId = props.sessionId.trim()
    this.recentInteractions = Object.freeze([...(props.recentInteractions ?? [])])
    this.activeProviderIds = Object.freeze([...(props.activeProviderIds ?? [])])
  }

  static create(props: RecommendationContextProps): RecommendationContext {
    return new RecommendationContext(props)
  }

  /** Create a default context for anonymous/testing users */
  static default(): RecommendationContext {
    return new RecommendationContext({
      userId: 'anonymous',
      timestamp: Date.now(),
      experimentId: 'default',
      variantId: 'control',
      sessionId: `session_${Date.now()}`,
      recentInteractions: [],
      activeProviderIds: [],
    })
  }

  /** Check if we have any interaction data (for cold start detection) */
  get hasInteractions(): boolean {
    return this.recentInteractions.length > 0
  }

  /** Number of unique interacted media items */
  get interactedMediaCount(): number {
    return new Set(this.recentInteractions.map(i => i.mediaId)).size
  }

  equals(other: RecommendationContext): boolean {
    return this.userId === other.userId
      && this.experimentId === other.experimentId
      && this.variantId === other.variantId
      && this.sessionId === other.sessionId
  }
}
