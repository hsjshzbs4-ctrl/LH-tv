// modules/recommendation/domain/services/FeedAssemblyService.ts — CE9-A
// Assembles RecommendationFeed from sections (Req 4, 11).
// Stateless — takes sections + metadata → produces Feed.

import { RecommendationFeed } from '../entities/RecommendationFeed'
import { RecommendationSection } from '../entities/RecommendationSection'
import type { RecommendationContext } from '../entities/RecommendationContext'
import type { FeedMetadata, SourceAttribution } from '../entities/RecommendationFeed'
import type { SectionType } from '../value-objects/SectionType'
import { sectionDisplayOrder } from '../value-objects/SectionType'

export interface FeedAssemblyInput {
  readonly feedId: string
  readonly sections: RecommendationSection[]
  readonly context: RecommendationContext
  readonly generationTimes: Record<string, number>
  readonly activeEngines: string[]
  readonly ttl: number
  readonly schemaVersion?: number
}

export class FeedAssemblyService {
  /** Assemble a complete feed from sections */
  assemble(input: FeedAssemblyInput): RecommendationFeed {
    const sortedSections = this._sortSections(input.sections)
    const totalItems = sortedSections.reduce((sum, s) => sum + s.itemCount, 0)
    const deduplicatedCount = this._countDeduplicated(input.sections)

    const metadata: FeedMetadata = {
      confidence: this._computeConfidence(input.sections, input.activeEngines.length),
      activeEngines: [...input.activeEngines],
      generationTimes: { ...input.generationTimes },
      totalItems,
      deduplicatedCount,
      sourceAttribution: this._buildSourceAttribution(sortedSections),
      experiment: {
        experimentId: input.context.experimentId,
        variantId: input.context.variantId,
        strategyWeights: this._computeStrategyWeights(sortedSections),
      },
      schemaVersion: input.schemaVersion ?? 1,
    }

    return RecommendationFeed.create({
      feedId: input.feedId,
      sections: sortedSections,
      generatedAt: Date.now(),
      ttl: input.ttl,
      context: input.context,
      metadata,
    })
  }

  /**
   * Create a minimal cold-start feed.
   * Used when user has insufficient data for personalization (Req 8).
   */
  assembleColdStart(
    trendingSection: RecommendationSection,
    popularSection: RecommendationSection,
    context: RecommendationContext,
  ): RecommendationFeed {
    const sections = [trendingSection, popularSection].filter(s => !s.isEmpty)
    return this.assemble({
      feedId: `cold_start_${context.userId}_${Date.now()}`,
      sections,
      context,
      generationTimes: {
        trending: 0,
        popular: 0,
      },
      activeEngines: ['trend-based', 'provider-popularity'],
      ttl: 30 * 60 * 1000, // 30 min TTL for cold-start feeds
    })
  }

  // ─── Private helpers ───

  /** Sort sections by their display order */
  private _sortSections(sections: RecommendationSection[]): RecommendationSection[] {
    return [...sections].sort((a, b) => sectionDisplayOrder(a.type) - sectionDisplayOrder(b.type))
  }

  /** Count items deduplicated across engines */
  private _countDeduplicated(sections: RecommendationSection[]): number {
    const allFiltered = sections.reduce(
      (sum, s) => sum + (s.metadata.diversityFilteredCount ?? 0),
      0,
    )
    return allFiltered
  }

  /** Overall feed confidence: average of section confidences */
  private _computeConfidence(sections: RecommendationSection[], activeEngineCount: number): number {
    if (sections.length === 0) return 0
    // More engines → lower individual confidence needed
    const avgItems = sections.reduce((sum, s) => sum + s.itemCount, 0) / sections.length
    const normalizedItems = Math.min(avgItems / 20, 1) // 20 items per section = full confidence
    const engineConfidence = Math.min(activeEngineCount / 4, 1) // 4+ engines = full confidence
    return this._clamp((normalizedItems * 0.6 + engineConfidence * 0.4))
  }

  /** Build source attribution summary */
  private _buildSourceAttribution(sections: RecommendationSection[]): SourceAttribution[] {
    const map = new Map<string, { count: number; weight: number }>()

    for (const section of sections) {
      const key = section.source.sourceType
      const existing = map.get(key) ?? { count: 0, weight: section.source.weight }
      existing.count += section.itemCount
      map.set(key, existing)
    }

    return [...map.entries()].map(([sourceType, data]) => ({
      sourceType: sourceType as import('../value-objects/RecommendationType').RecommendationType,
      itemCount: data.count,
      weight: data.weight,
    }))
  }

  /** Compute effective strategy weights from sections */
  private _computeStrategyWeights(sections: RecommendationSection[]): Record<string, number> {
    const weights: Record<string, number> = {}
    for (const section of sections) {
      if (section.metadata.weights) {
        Object.assign(weights, section.metadata.weights)
      }
    }
    return weights
  }

  private _clamp(value: number): number {
    return Math.max(0, Math.min(1, value))
  }
}
