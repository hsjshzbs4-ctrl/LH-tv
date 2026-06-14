// modules/recommendation/domain/services/RecommendationReasonGenerator.ts — CE9-A
// Generates human-readable recommendation reasons (Req 5).
// Every recommendation item MUST have a reason.

import { RecommendationReason } from '../value-objects/RecommendationReason'
import type { ReasonTemplate } from '../value-objects/RecommendationReason'
import type { RecommendationItem } from '../entities/RecommendationItem'
import type { RecommendationProfile } from '../entities/RecommendationProfile'

export interface ReasonContext {
  /** Source item title (for "because you watched X") */
  readonly sourceTitle?: string
  /** Matching genres */
  readonly matchedGenres?: string[]
  /** Matching cast members */
  readonly matchedCast?: string[]
  /** Provider name (for "Popular on X") */
  readonly providerName?: string
  /** The engine that generated this item */
  readonly engineName?: string
}

export class RecommendationReasonGenerator {
  /**
   * Generate the best reason for a recommendation item.
   * Priority: because-you-watched > similar-to > trending-in-genre >
   *   popular-on-provider > recently-added > recommended-for-you > top-pick
   */
  generate(item: RecommendationItem, profile: RecommendationProfile, ctx?: ReasonContext): RecommendationReason {
    // 1. Similar to — if from similarity engine (check BEFORE because-you-watched)
    if (ctx?.sourceTitle && ctx.engineName === 'similarity') {
      return RecommendationReason.similarTo(ctx.sourceTitle)
    }

    // 2. Because you watched — if we know which item triggered this and genres overlap
    if (ctx?.sourceTitle && item.genres.length > 0) {
      const overlap = ctx.matchedGenres ?? this._findGenreOverlap(item, profile)
      if (overlap.length > 0) {
        return RecommendationReason.becauseYouWatched(ctx.sourceTitle)
      }
    }

    // 3. Trending in genre — if genres available
    if (ctx?.matchedGenres && ctx.matchedGenres.length > 0) {
      return RecommendationReason.trendingInGenre(ctx.matchedGenres[0])
    }
    if (item.genres.length > 0) {
      return RecommendationReason.trendingInGenre(item.genres[0])
    }

    // 4. Popular on provider — if provider known
    if (ctx?.providerName) {
      return RecommendationReason.popularOnProvider(ctx.providerName)
    }

    // 5. New on provider — if provider known and content is fresh
    if (ctx?.providerName && item.score.freshnessScore > 0.7) {
      return RecommendationReason.newOnProvider(ctx.providerName)
    }

    // 6. Recently added — if freshness is high
    if (item.score.freshnessScore > 0.8) {
      return RecommendationReason.recentlyAdded()
    }

    // 7. Recommended for you — default personalized
    if (profile.isPersonalized) {
      return RecommendationReason.recommendedForYou()
    }

    // 8. Top pick — cold start fallback
    return RecommendationReason.topPick()
  }

  /**
   * Generate a reason by template name directly.
   */
  generateByTemplate(template: ReasonTemplate, params: Record<string, string>): RecommendationReason {
    return RecommendationReason.create(template, params)
  }

  /** Find overlapping genres between item and user profile */
  private _findGenreOverlap(item: RecommendationItem, profile: RecommendationProfile): string[] {
    const profileGenres = new Set(profile.preferredGenres)
    return item.genres.filter(g => profileGenres.has(g))
  }

  /** Generate a "because you watched X (genre match: Y, Z)" reason */
  becauseYouWatchedWithGenres(sourceTitle: string, matchedGenres: string[]): RecommendationReason {
    const genreList = matchedGenres.slice(0, 3).join(', ')
    return RecommendationReason.create('because-you-watched', {
      title: sourceTitle,
    })
  }

  /** Generate a "Top Pick" reason for cold-start users */
  coldStartReason(): RecommendationReason {
    return RecommendationReason.topPick()
  }
}
