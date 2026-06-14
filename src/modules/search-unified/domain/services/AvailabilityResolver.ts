// modules/search-unified/domain/services/AvailabilityResolver.ts — CE8-A
// Domain service: resolves playability and preferred source for a search result.
//
// Priority:  Local > Jellyfin > Plex > Emby > TMDB > Bangumi > TVMaze
// Quality tie-breaking: higher quality source wins within same priority tier.

import type { IAvailabilityResolver } from '../contracts/IAvailabilityResolver'
import { UnifiedSearchResult } from '../entities/UnifiedSearchResult'
import { AvailabilityInfo } from '../entities/AvailabilityInfo'
import { SearchSource } from '../entities/SearchSource'
import type { SourceType } from '../entities/SearchSource'

export class AvailabilityResolver implements IAvailabilityResolver {
  /** Resolve availability for a single result. */
  resolve(result: UnifiedSearchResult): AvailabilityInfo {
    const sources = [...result.sources]
    const playableSources = sources.filter(s => s.isPlayable())

    if (playableSources.length === 0) {
      return AvailabilityInfo.unavailable()
    }

    // Sort by priority (descending)
    const sorted = this._sortByPriority(playableSources)
    const preferred = sorted[0]
    const bestQuality = preferred?.quality ?? 0
    const localAvailable = sorted.some(s => s.sourceType === 'local')

    return AvailabilityInfo.create({
      playable: true,
      preferredSource: preferred,
      availableSources: sorted,
      bestQuality,
      localAvailable,
    })
  }

  /** Resolve availability for a batch and return updated results. */
  resolveBatch(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
    return results.map(r => {
      const availability = this.resolve(r)
      return UnifiedSearchResult.create({
        contentId: r.contentId,
        title: r.title,
        originalTitle: r.originalTitle,
        mediaType: r.mediaType,
        overview: r.overview,
        poster: r.poster,
        backdrop: r.backdrop,
        year: r.year,
        score: r.score,
        sources: [...r.sources],
        availability,
        genres: [...r.genres],
      })
    })
  }

  /** Sort sources by priority: local > jellyfin > plex > emby > metadata */
  private _sortByPriority(sources: SearchSource[]): SearchSource[] {
    const PRIORITY: Record<SourceType, number> = {
      local: 5,
      jellyfin: 4,
      plex: 3,
      emby: 2,
      tmdb: 1,
      bangumi: 0,
      tvmaze: 0,
    }

    return [...sources].sort((a, b) => {
      const pa = PRIORITY[a.sourceType] ?? 0
      const pb = PRIORITY[b.sourceType] ?? 0
      if (pa !== pb) return pb - pa
      // Same priority tier: higher quality wins
      return b.quality - a.quality
    })
  }
}
