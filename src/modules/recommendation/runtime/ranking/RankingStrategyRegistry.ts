// modules/recommendation/runtime/ranking/RankingStrategyRegistry.ts — CE9-C
// Registry of ranking strategies. Allows runtime composition of ranking pipelines.

import type { RankingStage } from './RankingStage'
import { ScoreSortStage, DiversityInterleaveStage, NoveltyBoostStage } from './RankingStage'
import { RankingPipeline } from './RankingPipeline'

export type PresetName = 'default' | 'diversity-first' | 'novelty-first' | 'score-only'

export class RankingStrategyRegistry {
  private readonly presets: Map<PresetName, RankingPipeline>

  constructor() {
    this.presets = new Map()
    this._registerDefaults()
  }

  /** Get a preset pipeline by name */
  getPreset(name: PresetName): RankingPipeline {
    const preset = this.presets.get(name)
    if (!preset) {
      throw new Error(`Unknown ranking preset: ${name}`)
    }
    return preset
  }

  /** Register a custom pipeline */
  register(name: string, pipeline: RankingPipeline): void {
    this.presets.set(name as PresetName, pipeline)
  }

  /** Build a custom pipeline from stage names */
  buildFromStages(stages: RankingStage[]): RankingPipeline {
    return new RankingPipeline(stages)
  }

  private _registerDefaults(): void {
    // Default: score sort → novelty boost
    this.presets.set('default', new RankingPipeline([
      new ScoreSortStage(),
      new NoveltyBoostStage(),
    ]))

    // Diversity-first: diversity interleave → score sort
    this.presets.set('diversity-first', new RankingPipeline([
      new DiversityInterleaveStage(),
      new ScoreSortStage(),
    ]))

    // Novelty-first: novelty boost → diversity interleave
    this.presets.set('novelty-first', new RankingPipeline([
      new NoveltyBoostStage(),
      new DiversityInterleaveStage(),
    ]))

    // Score-only: just sort
    this.presets.set('score-only', new RankingPipeline([
      new ScoreSortStage(),
    ]))
  }
}
