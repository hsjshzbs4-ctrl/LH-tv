// modules/recommendation/domain/entities/RecommendationSection.ts — CE9-A
// A single section within a recommendation feed. Each section is independent (Req 11).

import { RecommendationItem } from './RecommendationItem'
import { RecommendationSource } from './RecommendationSource'
import type { SectionType } from '../value-objects/SectionType'
import { sectionDisplayOrder } from '../value-objects/SectionType'

export interface SectionMetadata {
  readonly originalCount: number
  readonly diversityFilteredCount: number
  readonly weights: Record<string, number>
  readonly engineMetadata?: Record<string, unknown>
}

export interface RecommendationSectionProps {
  readonly id: string
  readonly type: SectionType
  readonly title: string
  readonly items: RecommendationItem[]
  readonly source: RecommendationSource
  readonly metadata: SectionMetadata
  readonly subtitle?: string
}

export class RecommendationSection {
  readonly id: string
  readonly type: SectionType
  readonly title: string
  readonly subtitle?: string
  readonly items: readonly RecommendationItem[]
  readonly source: RecommendationSource
  readonly metadata: SectionMetadata

  private constructor(props: RecommendationSectionProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('RecommendationSection: id must not be empty')
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('RecommendationSection: title must not be empty')
    }
    if (props.metadata.originalCount < 0) {
      throw new Error('RecommendationSection: originalCount must be >= 0')
    }

    this.id = props.id.trim()
    this.type = props.type
    this.title = props.title.trim()
    this.subtitle = props.subtitle?.trim()
    this.items = Object.freeze([...props.items])
    this.source = props.source
    this.metadata = props.metadata
  }

  static create(props: RecommendationSectionProps): RecommendationSection {
    return new RecommendationSection(props)
  }

  /** Display order (lower = shown first in UI) */
  get displayOrder(): number {
    return sectionDisplayOrder(this.type)
  }

  get itemCount(): number {
    return this.items.length
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  /** Create a new section with filtered items */
  withItems(items: RecommendationItem[]): RecommendationSection {
    return RecommendationSection.create({
      ...this,
      items,
      metadata: {
        ...this.metadata,
        diversityFilteredCount: this.metadata.originalCount - items.length,
      },
    })
  }

  /** Sort items by composite score descending */
  sorted(): RecommendationSection {
    return this.withItems([...this.items].sort(RecommendationItem.compare))
  }

  equals(other: RecommendationSection): boolean {
    return this.id === other.id && this.type === other.type
  }
}
