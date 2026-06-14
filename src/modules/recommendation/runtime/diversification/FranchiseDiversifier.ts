// modules/recommendation/runtime/diversification/FranchiseDiversifier.ts — CE9-C
// Franchise diversification: max 3 items per franchise per section (Req 7).

import type { RecommendationItem } from '../../domain/entities/RecommendationItem'

export type FranchiseResolver = (item: RecommendationItem) => string | null

export class FranchiseDiversifier {
  readonly maxPerFranchise: number
  private readonly resolveFranchise: FranchiseResolver

  constructor(maxPerFranchise: number = 3, resolveFranchise?: FranchiseResolver) {
    this.maxPerFranchise = maxPerFranchise
    this.resolveFranchise = resolveFranchise ?? this._defaultResolver
  }

  diversify(items: RecommendationItem[]): {
    accepted: RecommendationItem[]
    rejected: RecommendationItem[]
  } {
    const franchiseCounts = new Map<string, number>()
    const accepted: RecommendationItem[] = []
    const rejected: RecommendationItem[] = []

    for (const item of items) {
      const franchise = this.resolveFranchise(item)
      if (franchise) {
        const count = franchiseCounts.get(franchise) ?? 0
        if (count >= this.maxPerFranchise) {
          rejected.push(item)
          continue
        }
        franchiseCounts.set(franchise, count + 1)
      }
      accepted.push(item)
    }

    return { accepted, rejected }
  }

  private _defaultResolver(item: RecommendationItem): string | null {
    // Default: use title prefix as franchise hint
    // Items with same title prefix (before colon/separator) are in same franchise
    const match = item.title.match(/^(.+?)(?:\s*[:–—]\s*|$)/)
    if (match && match[1].length > 2) {
      return match[1].toLowerCase()
    }
    return null
  }
}
