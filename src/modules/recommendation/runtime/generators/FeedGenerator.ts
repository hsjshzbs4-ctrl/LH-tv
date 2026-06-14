// modules/recommendation/runtime/generators/FeedGenerator.ts — CE9-C
// Assembles RecommendationFeed from provider outputs, ranking, and diversity pipelines.
// ALWAYS returns RecommendationFeed — never bare Item[] (Req 4).

import type { IRecommendationProvider } from '../../domain/contracts/IRecommendationProvider'
import { RecommendationSection } from '../../domain/entities/RecommendationSection'
import { RecommendationSource } from '../../domain/entities/RecommendationSource'
import type { RecommendationFeed } from '../../domain/entities/RecommendationFeed'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import { FeedAssemblyService } from '../../domain/services/FeedAssemblyService'
import { RankingPipeline } from '../ranking/RankingPipeline'
import { DiversityPipeline } from '../diversification/DiversityPipeline'
import type { SectionType } from '../../domain/value-objects/SectionType'
import { SECTION_TYPE_LABELS } from '../../domain/value-objects/SectionType'

export interface FeedGeneratorConfig {
  readonly itemsPerSection: number
  readonly rankingPipeline: RankingPipeline
  readonly diversityPipeline: DiversityPipeline
}

const DEFAULT_CONFIG: FeedGeneratorConfig = {
  itemsPerSection: 20,
  rankingPipeline: new RankingPipeline(),
  diversityPipeline: new DiversityPipeline(),
}

export class FeedGenerator {
  private config: FeedGeneratorConfig
  private assemblyService: FeedAssemblyService

  constructor(config?: Partial<FeedGeneratorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.assemblyService = new FeedAssemblyService()
  }

  /**
   * Generate a full recommendation feed from engine outputs.
   *
   * Pipeline:
   * For each engine → generate candidates → rank → diversify → create section → assemble feed
   */
  async generateFeed(
    ctx: RecommendationContext,
    profile: RecommendationProfile,
    engines: IRecommendationProvider[],
    sectionMap: Map<string, SectionType>,
    feedIdPrefix: string,
  ): Promise<RecommendationFeed> {
    const generationTimes: Record<string, number> = {}
    const activeEngines: string[] = []
    const sections: RecommendationSection[] = []

    // Fan-out to all available engines
    const engineResults = await Promise.allSettled(
      engines.filter(e => e.isAvailable()).map(async engine => {
        const start = Date.now()
        try {
          const items = await engine.generate(ctx, profile, this.config.itemsPerSection * 2)
          const elapsed = Date.now() - start
          return { engine, items, elapsed, success: true }
        } catch {
          return { engine, items: [] as import('../../domain/entities/RecommendationItem').RecommendationItem[], elapsed: Date.now() - start, success: false }
        }
      }),
    )

    // Process each engine's results
    for (const result of engineResults) {
      if (result.status === 'rejected') continue
      const { engine, items, elapsed } = result.value

      generationTimes[engine.name] = elapsed

      if (items.length === 0) continue

      activeEngines.push(engine.name)

      // Rank
      const ranked = this.config.rankingPipeline.execute(items, profile)

      // Diversify
      const diversified = this.config.diversityPipeline.execute(ranked)

      // Limit per section
      const limited = diversified.items.slice(0, this.config.itemsPerSection)

      // Determine section type
      const sectionType = sectionMap.get(engine.name) ?? 'for-you'

      // Create section
      const section = RecommendationSection.create({
        id: `${feedIdPrefix}_${engine.name}`,
        type: sectionType,
        title: SECTION_TYPE_LABELS[sectionType],
        items: limited,
        source: RecommendationSource.create({
          sourceType: engine.type,
          label: engine.name,
          weight: 1.0,
        }),
        metadata: {
          originalCount: items.length,
          diversityFilteredCount: diversified.totalFiltered,
          weights: {},
        },
      })

      if (!section.isEmpty) {
        sections.push(section)
      }
    }

    // Assemble feed
    return this.assemblyService.assemble({
      feedId: `${feedIdPrefix}_${Date.now()}`,
      sections,
      context: ctx,
      generationTimes,
      activeEngines,
      ttl: profile.isPersonalized ? 30 * 60 * 1000 : 15 * 60 * 1000, // 30min personalized, 15min cold
    })
  }

  /** Quick cold-start feed (no personalization required) */
  async generateColdStartFeed(
    ctx: RecommendationContext,
    trendingEngine: IRecommendationProvider,
    popularEngine: IRecommendationProvider,
  ): Promise<RecommendationFeed> {
    return this.generateFeed(
      ctx,
      RecommendationProfile.empty(),
      [trendingEngine, popularEngine],
      new Map([
        ['trending-recommendation', 'trending' as SectionType],
        ['provider-popularity', 'popular' as SectionType],
      ]),
      'cold_start',
    )
  }
}
