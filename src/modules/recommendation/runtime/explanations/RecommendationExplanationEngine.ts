// modules/recommendation/runtime/explanations/RecommendationExplanationEngine.ts — CE9-C
// Deterministic recommendation explanation engine (Req 5).
// Generates "Why Recommended" explanations from recommendation context.

import type { RecommendationItem } from '../../domain/entities/RecommendationItem'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import { RecommendationReason } from '../../domain/value-objects/RecommendationReason'
import type { ReasonTemplate } from '../../domain/value-objects/RecommendationReason'

export interface ExplanationInput {
  readonly item: RecommendationItem
  readonly profile: RecommendationProfile
  readonly sourceTitle?: string
  readonly matchedGenres?: string[]
  readonly providerName?: string
  readonly engineName?: string
}

export class RecommendationExplanationEngine {
  /**
   * Generate a deterministic explanation for why an item was recommended.
   * Priority (highest first):
   * 1. Similar content ("Similar to X")
   * 2. Because you watched X (with genre match)
   * 3. Trending in genre
   * 4. Popular on provider
   * 5. New on provider
   * 6. Recently added
   * 7. Recommended for you (personalized)
   * 8. Top pick (cold start fallback)
   */
  explain(input: ExplanationInput): RecommendationReason {
    const { item, profile, sourceTitle, matchedGenres, providerName, engineName } = input

    // 1. Similar content
    if (engineName === 'similar-content' && sourceTitle) {
      return RecommendationReason.similarTo(sourceTitle)
    }

    // 2. Because you watched
    if (sourceTitle && item.genres.length > 0) {
      const overlap = matchedGenres ?? this._findGenreOverlap(item, profile)
      if (overlap.length > 0) {
        return RecommendationReason.becauseYouWatched(sourceTitle)
      }
    }

    // 3. Trending in genre
    if (matchedGenres && matchedGenres.length > 0) {
      return RecommendationReason.trendingInGenre(matchedGenres[0])
    }
    if (item.genres.length > 0) {
      return RecommendationReason.trendingInGenre(item.genres[0])
    }

    // 4. Popular on provider
    if (providerName) {
      return RecommendationReason.popularOnProvider(providerName)
    }

    // 5. New on provider
    if (providerName && item.score.freshnessScore > 0.7) {
      return RecommendationReason.newOnProvider(providerName)
    }

    // 6. Recently added
    if (item.score.freshnessScore > 0.8) {
      return RecommendationReason.recentlyAdded()
    }

    // 7. Recommended for you
    if (profile.isPersonalized) {
      return RecommendationReason.recommendedForYou()
    }

    // 8. Top pick (cold start)
    return RecommendationReason.topPick()
  }

  /** Bulk-explain a list of items */
  explainAll(inputs: ExplanationInput[]): RecommendationReason[] {
    return inputs.map(input => this.explain(input))
  }

  /** Generate a custom explanation by template */
  byTemplate(template: ReasonTemplate, params: Record<string, string>): RecommendationReason {
    return RecommendationReason.create(template, params)
  }

  private _findGenreOverlap(item: RecommendationItem, profile: RecommendationProfile): string[] {
    const profileGenres = new Set(profile.preferredGenres)
    return item.genres.filter(g => profileGenres.has(g))
  }
}
