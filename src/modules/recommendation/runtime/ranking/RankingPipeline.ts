// modules/recommendation/runtime/ranking/RankingPipeline.ts — CE9-C
// Composable ranking pipeline: ScoreNormalize → Ranking Stages → Diversification → Feed.

import type { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import type { RankingStage } from './RankingStage'
import { ScoreNormalizer } from './ScoreNormalizer'

export class RankingPipeline {
  private stages: RankingStage[] = []
  private normalizer: ScoreNormalizer

  constructor(stages?: RankingStage[]) {
    this.normalizer = new ScoreNormalizer()
    if (stages) {
      this.stages = [...stages]
    }
  }

  /** Add a stage to the end of the pipeline */
  addStage(stage: RankingStage): this {
    this.stages.push(stage)
    return this
  }

  /** Remove a stage by name */
  removeStage(name: string): this {
    this.stages = this.stages.filter(s => s.name !== name)
    return this
  }

  /** Get registered stage names */
  get stageNames(): string[] {
    return this.stages.map(s => s.name)
  }

  /**
   * Execute the full ranking pipeline.
   *
   * Pipeline:
   * Candidate Set → Score Normalize → Stage 1 → Stage 2 → ... → Ranked Output
   */
  execute(items: RecommendationItem[], profile: RecommendationProfile): RecommendationItem[] {
    if (items.length === 0) return []

    // Step 1: Normalize scores
    let processed = this.normalizer.normalize(items)

    // Step 2: Run through each stage
    for (const stage of this.stages) {
      processed = stage.process(processed, profile)
    }

    return processed
  }
}
