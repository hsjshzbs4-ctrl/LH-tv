// modules/recommendation/runtime/diversification/DiversityPipeline.ts — CE9-C
// Composable diversity pipeline: Genre → Franchise → Output.

import type { RecommendationItem } from '../../domain/entities/RecommendationItem'
import { GenreDiversifier } from './GenreDiversifier'
import { FranchiseDiversifier } from './FranchiseDiversifier'
import type { FranchiseResolver } from './FranchiseDiversifier'

export interface DiversityConfig {
  readonly maxPerGenre: number
  readonly maxPerFranchise: number
  readonly franchiseResolver?: FranchiseResolver
}

export interface DiversityResult {
  readonly items: RecommendationItem[]
  readonly totalFiltered: number
  readonly genreFiltered: number
  readonly franchiseFiltered: number
  readonly originalCount: number
}

export class DiversityPipeline {
  private genreDiversifier: GenreDiversifier
  private franchiseDiversifier: FranchiseDiversifier
  private config: DiversityConfig

  constructor(config?: Partial<DiversityConfig>) {
    this.config = {
      maxPerGenre: config?.maxPerGenre ?? 5,
      maxPerFranchise: config?.maxPerFranchise ?? 3,
      franchiseResolver: config?.franchiseResolver,
    }
    this.genreDiversifier = new GenreDiversifier(this.config.maxPerGenre)
    this.franchiseDiversifier = new FranchiseDiversifier(
      this.config.maxPerFranchise,
      this.config.franchiseResolver,
    )
  }

  /**
   * Execute diversity pipeline:
   * 1. Franchise filter (coarser, run first)
   * 2. Genre filter (finer, run second)
   */
  execute(items: RecommendationItem[]): DiversityResult {
    const originalCount = items.length
    let totalFiltered = 0
    let franchiseFiltered = 0
    let genreFiltered = 0

    // Stage 1: Franchise diversification
    const franchiseResult = this.franchiseDiversifier.diversify(items)
    franchiseFiltered = franchiseResult.rejected.length
    totalFiltered += franchiseFiltered

    // Stage 2: Genre diversification
    const genreResult = this.genreDiversifier.diversify(franchiseResult.accepted)
    genreFiltered = genreResult.rejected.length
    totalFiltered += genreFiltered

    return {
      items: genreResult.accepted,
      totalFiltered,
      genreFiltered,
      franchiseFiltered,
      originalCount,
    }
  }
}
