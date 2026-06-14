// modules/recommendation/domain/entities/RecommendationSource.ts — CE9-A
// Provider-agnostic source tracking (Req 1).
// Tracks which engine/provider generated a recommendation.

import type { RecommendationType } from '../value-objects/RecommendationType'

export type SourceCategory = 'personal' | 'trending' | 'provider' | 'similar' | 'hybrid'

export interface RecommendationSourceProps {
  readonly sourceType: RecommendationType
  readonly providerId?: string
  readonly label: string
  readonly weight: number
}

export class RecommendationSource {
  readonly sourceType: RecommendationType
  readonly providerId?: string
  readonly label: string
  readonly weight: number

  private constructor(props: RecommendationSourceProps) {
    if (props.weight < 0 || props.weight > 1) {
      throw new Error('RecommendationSource: weight must be in [0, 1]')
    }
    if (!props.label || props.label.trim().length === 0) {
      throw new Error('RecommendationSource: label must not be empty')
    }

    this.sourceType = props.sourceType
    this.providerId = props.providerId
    this.label = props.label.trim()
    this.weight = props.weight
  }

  static create(props: RecommendationSourceProps): RecommendationSource {
    return new RecommendationSource(props)
  }

  get category(): SourceCategory {
    switch (this.sourceType) {
      case 'personalized':
      case 'continue-watching':
        return 'personal'
      case 'trending':
      case 'popular':
        return 'trending'
      case 'provider-pick':
        return 'provider'
      case 'similar':
        return 'similar'
      case 'hybrid':
        return 'hybrid'
    }
  }

  /** Is this source provider-specific? */
  get isProviderSpecific(): boolean {
    return this.providerId !== undefined && this.providerId.length > 0
  }

  equals(other: RecommendationSource): boolean {
    return this.sourceType === other.sourceType
      && this.providerId === other.providerId
      && this.label === other.label
  }
}
