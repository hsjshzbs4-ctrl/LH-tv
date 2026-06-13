// core/content-ecosystem/metadata/engine/MetadataEnhancementEngine.ts — CE4
// Metadata Enhancement Pipeline: Filename → Parse → TMDB → Bangumi → TVMaze → Merge

import type { ParsedFilename, EnhancedMetadata, ExternalIds } from '@provider-contracts'
import type { IMetadataProvider } from '@provider-contracts'
import { filenameParser } from '../../utils/FilenameParser'

export interface EnhancementSource {
  provider: IMetadataProvider
  weight: number         // contribution weight for merge
}

export class MetadataEnhancementEngine {
  private sources: EnhancementSource[] = []

  addSource(provider: IMetadataProvider, weight: number): void {
    this.sources.push({ provider, weight })
  }

  // Enhance from filename
  async enhanceFromFilename(
    fileName: string,
    directory: 'Movies' | 'TV' | 'Anime'
  ): Promise<EnhancedMetadata | null> {
    const parsed = filenameParser.parse(fileName, directory)
    if (!parsed) return null
    return this.enhanceFromParsed(parsed)
  }

  // Enhance from already-parsed filename
  async enhanceFromParsed(parsed: ParsedFilename): Promise<EnhancedMetadata | null> {
    // Build search query
    const query = parsed.title + (parsed.year ? ` ${parsed.year}` : '')

    // Search across all sources in parallel
    const searchResults = await Promise.allSettled(
      this.sources.map(s => s.provider.search(query))
    )

    let bestMatch: EnhancedMetadata | null = null
    let bestConfidence = 0

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i]
      if (result.status !== 'fulfilled') continue
      const items = result.value
      if (!items.length) continue

      // Try to get rich detail for the best matching result
      const topItem = items[0]
      const confidence = this.calculateConfidence(topItem.title, parsed)

      if (confidence > bestConfidence) {
        try {
          const detail = await this.sources[i].provider.getMovie(topItem.id).catch(() => null)
            || await this.sources[i].provider.getSeries(topItem.id).catch(() => null)

          if (detail) {
            bestMatch = {
              metadata: {
                title: detail.title,
                overview: (detail as any).overview || '',
                genres: (detail as any).genres || [],
                rating: (detail as any).rating || { average: 0, count: 0 },
                year: (detail as any).year || parsed.year,
                poster: (detail as any).poster || detail.cover,
                backdrop: (detail as any).backdrop || '',
                cast: (detail as any).cast || [],
                crew: (detail as any).crew || [],
              },
              confidence,
              contributors: [this.sources[i].provider.id],
            }
            bestConfidence = confidence
          }
        } catch {
          // This source failed to get detail — try next
        }
      }
    }

    return bestMatch
  }

  // Enhance with specific external IDs
  async enhanceFromExternalIds(ids: ExternalIds): Promise<EnhancedMetadata | null> {
    for (const source of this.sources) {
      try {
        let detail
        if (ids.tmdb) {
          detail = await source.provider.getMovie(String(ids.tmdb)).catch(() =>
            source.provider.getSeries(String(ids.tmdb))
          )
        } else if (ids.bangumi) {
          detail = await source.provider.getSeries(String(ids.bangumi))
        }

        if (detail) {
          return {
            metadata: {
              title: detail.title,
              overview: (detail as any).overview || '',
              genres: (detail as any).genres || [],
              rating: (detail as any).rating || { average: 0, count: 0 },
              poster: (detail as any).poster || detail.cover,
              backdrop: (detail as any).backdrop || '',
              cast: (detail as any).cast || [],
              crew: (detail as any).crew || [],
            },
            confidence: 1.0,
            contributors: [source.provider.id],
          }
        }
      } catch { /* continue */ }
    }
    return null
  }

  private calculateConfidence(title: string, parsed: ParsedFilename): number {
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normalizedParsed = parsed.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (normalizedTitle === normalizedParsed) return 1.0
    if (normalizedTitle.includes(normalizedParsed) || normalizedParsed.includes(normalizedTitle)) return 0.8
    return 0.5
  }
}
