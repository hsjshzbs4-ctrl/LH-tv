// modules/recommendation/domain/services/RecommendationDiversificationService.ts — CE9-A
// Diversity protection service (Req 7).
// Enforces: max 3 items per franchise, max 5 items per genre per section.

import { RecommendationItem } from '../entities/RecommendationItem'
import { DiversityConstraint } from '../value-objects/DiversityConstraint'

export interface DiversificationResult {
  readonly items: RecommendationItem[]
  readonly filteredCount: number
  readonly filteredItems: RecommendationItem[]
  readonly violations: DiversificationViolation[]
}

export interface DiversificationViolation {
  readonly mediaId: string
  readonly reason: 'franchise' | 'genre'
  readonly detail: string
}

/**
 * Extract franchise identifier from a media item.
 * Franchise is inferred from title prefix or series grouping.
 * Override this with actual franchise data when available.
 */
export type FranchiseExtractor = (item: RecommendationItem) => string | null

export class RecommendationDiversificationService {
  private constraint: DiversityConstraint
  private franchiseExtractor: FranchiseExtractor

  constructor(
    constraint?: DiversityConstraint,
    franchiseExtractor?: FranchiseExtractor,
  ) {
    this.constraint = constraint ?? DiversityConstraint.default()
    this.franchiseExtractor = franchiseExtractor ?? (() => null)
  }

  /**
   * Apply diversity constraints to a list of items.
   * Returns filtered items that satisfy diversity rules.
   *
   * Algorithm:
   * 1. Walk items in score order
   * 2. Track per-franchise and per-genre counts
   * 3. Skip items that would exceed limits
   * 4. Return accepted items + violation report
   */
  diversify(items: RecommendationItem[]): DiversificationResult {
    const accepted: RecommendationItem[] = []
    const filtered: RecommendationItem[] = []
    const violations: DiversificationViolation[] = []

    const franchiseCounts = new Map<string, number>()
    const genreCounts = new Map<string, number>()

    // Process items in score order (highest first)
    const sorted = [...items].sort(RecommendationItem.compare)

    for (const item of sorted) {
      let blocked = false

      // Check franchise constraint
      const franchise = this.franchiseExtractor(item)
      if (franchise) {
        const fCount = franchiseCounts.get(franchise) ?? 0
        if (fCount >= this.constraint.maxPerFranchise) {
          blocked = true
          violations.push({
            mediaId: item.mediaId,
            reason: 'franchise',
            detail: `Franchise "${franchise}" already has ${fCount} items (max ${this.constraint.maxPerFranchise})`,
          })
        }
      }

      // Check genre constraint
      if (!blocked && item.genres.length > 0) {
        for (const genre of item.genres) {
          const gCount = genreCounts.get(genre) ?? 0
          if (gCount >= this.constraint.maxPerGenre) {
            blocked = true
            violations.push({
              mediaId: item.mediaId,
              reason: 'genre',
              detail: `Genre "${genre}" already has ${gCount} items (max ${this.constraint.maxPerGenre})`,
            })
            break
          }
        }
      }

      if (blocked) {
        filtered.push(item)
      } else {
        accepted.push(item)
        // Update counts
        if (franchise) {
          franchiseCounts.set(franchise, (franchiseCounts.get(franchise) ?? 0) + 1)
        }
        for (const genre of item.genres) {
          genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
        }
      }
    }

    return {
      items: accepted,
      filteredCount: filtered.length,
      filteredItems: filtered,
      violations,
    }
  }

  /** Check if a single item would violate diversity constraints given existing items */
  wouldViolate(
    item: RecommendationItem,
    existingItems: RecommendationItem[],
  ): boolean {
    const franchise = this.franchiseExtractor(item)
    if (franchise) {
      const fCount = existingItems.filter(
        e => this.franchiseExtractor(e) === franchise,
      ).length
      if (fCount >= this.constraint.maxPerFranchise) return true
    }

    for (const genre of item.genres) {
      const gCount = existingItems.filter(
        e => e.genres.includes(genre),
      ).length
      if (gCount >= this.constraint.maxPerGenre) return true
    }

    return false
  }
}
