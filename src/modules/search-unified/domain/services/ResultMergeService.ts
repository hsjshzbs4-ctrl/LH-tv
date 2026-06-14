// modules/search-unified/domain/services/ResultMergeService.ts — CE8-A
// Domain service: merges raw search documents from multiple providers into
// deduplicated, aggregated UnifiedSearchResult[].
//
// Dedup logic: documents with the same contentId are merged into one result
// with multiple sources. Genre lists are unioned. The best score wins.

import type { IResultMerger } from '../contracts/IResultMerger'
import type { SearchDocument } from '../contracts/ISearchProvider'
import { UnifiedSearchResult } from '../entities/UnifiedSearchResult'
import { SearchSource } from '../entities/SearchSource'
import { AvailabilityInfo } from '../entities/AvailabilityInfo'
import { ContentIdentity } from '../value-objects/ContentIdentity'
import { SearchScore } from '../value-objects/SearchScore'
import type { MediaType } from '../entities/UnifiedSearchResult'
import type { SourceType } from '../entities/SearchSource'
import { EventFactory } from '../events/DomainEvents'
import type { SearchResultMerged } from '../events/DomainEvents'

export class ResultMergeService implements IResultMerger {
  merge(documents: SearchDocument[]): UnifiedSearchResult[] {
    const rawCount = documents.length

    // Group by contentId
    const groups = new Map<string, SearchDocument[]>()
    for (const doc of documents) {
      const cid = doc.contentId
      const existing = groups.get(cid)
      if (existing) {
        existing.push(doc)
      } else {
        groups.set(cid, [doc])
      }
    }

    const dedupedCount = rawCount - groups.size

    // Build UnifiedSearchResult for each group
    const results: UnifiedSearchResult[] = []
    for (const [contentId, docs] of groups) {
      const result = this._buildResult(contentId, docs)
      results.push(result)
    }

    return results
  }

  /** Emit domain event for the merge operation. */
  emit(): SearchResultMerged {
    return EventFactory.searchResultMerged(0, 0, 0) // Populated by caller
  }

  private _buildResult(contentId: string, docs: SearchDocument[]): UnifiedSearchResult {
    // Best document (highest popularity) provides metadata
    const best = docs.reduce((a, b) => (a.popularity > b.popularity ? a : b))

    // Convert to SearchSource[]
    const sources = docs.map(d =>
      SearchSource.create({
        sourceId: d.sourceId,
        sourceType: this._mapSourceType(d.source, d.sourceId),
        externalId: d.id,
        available: d.source === 'local' || d.source === 'server',
        quality: this._estimateQuality(d),
      }),
    )

    // Best score from any source
    const score = SearchScore.clamp(Math.min(best.popularity, 100))

    // Union genres
    const genres = [...new Set(docs.flatMap(d => d.genres))]

    // Build availability
    const availability = this._buildAvailability(sources)

    return UnifiedSearchResult.create({
      contentId: ContentIdentity.create(contentId),
      title: best.title,
      originalTitle: best.originalTitle,
      mediaType: this._mapMediaType(best.type),
      overview: best.overview,
      year: best.year,
      score,
      sources,
      availability,
      genres,
    })
  }

  private _mapSourceType(source: string, sourceId: string): SourceType {
    if (source === 'local') return 'local'
    if (sourceId.includes('jellyfin')) return 'jellyfin'
    if (sourceId.includes('plex')) return 'plex'
    if (sourceId.includes('emby')) return 'emby'
    if (sourceId.includes('tmdb')) return 'tmdb'
    if (sourceId.includes('bangumi')) return 'bangumi'
    if (sourceId.includes('tvmaze')) return 'tvmaze'
    return 'tmdb' // default metadata
  }

  private _estimateQuality(doc: SearchDocument): number {
    // Quality heuristic: local=100, server=80, metadata-based on popularity
    if (doc.source === 'local') return 100
    if (doc.source === 'server') return 80
    return Math.min(doc.popularity, 70)
  }

  private _mapMediaType(type: string): MediaType {
    switch (type) {
      case 'movie': return 'movie'
      case 'tv': return 'tv'
      case 'anime': return 'anime'
      default: return 'movie'
    }
  }

  private _buildAvailability(sources: SearchSource[]): AvailabilityInfo {
    const available = sources.filter(s => s.available && s.isPlayable())
    const playable = available.length > 0

    if (!playable) {
      return AvailabilityInfo.unavailable()
    }

    // Preferred: highest rankPriority
    const sorted = [...available].sort((a, b) => b.rankPriority() - a.rankPriority())
    const preferred = sorted[0] ?? null

    return AvailabilityInfo.create({
      playable: true,
      preferredSource: preferred,
      availableSources: sorted,
      bestQuality: preferred?.quality ?? 0,
      localAvailable: available.some(s => s.sourceType === 'local'),
    })
  }
}
