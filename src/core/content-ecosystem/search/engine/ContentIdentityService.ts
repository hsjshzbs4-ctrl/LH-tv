// core/content-ecosystem/search/engine/ContentIdentityService.ts — CE7.1 Content identity
// Generates canonical contentId for cross-source dedup in CE8 Unified Search.
//
// Priority: tmdb → imdb → bangumi → tvmaze → fallback(sourceId + type)
//
// Example:
//   Interstellar on TMDB (id=157336)   → contentId = "tmdb:157336"
//   Interstellar on Jellyfin            → contentId = "tmdb:157336" (via ExternalIds)
//   → CE8 aggregates both as one result

import type { ExternalIds } from '@provider-contracts'
import { SearchDocumentType } from '../contracts/search.types'

export class ContentIdentityService {
  /**
   * Generate canonical contentId from external IDs.
   * Uses first available ID in priority order.
   */
  generateContentId(
    externalIds: ExternalIds,
    type: SearchDocumentType,
    sourceId: string,
  ): string {
    if (externalIds.tmdb !== undefined) {
      return `tmdb:${externalIds.tmdb}`
    }
    if (externalIds.imdb !== undefined) {
      return `imdb:${externalIds.imdb}`
    }
    if (externalIds.bangumi !== undefined) {
      return `bangumi:${externalIds.bangumi}`
    }
    if (externalIds.tvmaze !== undefined) {
      return `tvmaze:${externalIds.tvmaze}`
    }
    // Fallback: no recognized external ID — use source-scoped uniqueness
    return `${sourceId}:${type}`
  }

  /**
   * Check if two documents share the same canonical content.
   */
  isSameContent(contentIdA: string, contentIdB: string): boolean {
    return contentIdA === contentIdB
  }

  /**
   * Group document IDs by their contentId.
   * Returns Map<contentId, docId[]> for aggregation.
   */
  groupByContentId(docs: Array<{ id: string; contentId: string }>): Map<string, string[]> {
    const groups = new Map<string, string[]>()
    for (const doc of docs) {
      const existing = groups.get(doc.contentId)
      if (existing) {
        existing.push(doc.id)
      } else {
        groups.set(doc.contentId, [doc.id])
      }
    }
    return groups
  }
}

/** Singleton */
export const contentIdentityService = new ContentIdentityService()
