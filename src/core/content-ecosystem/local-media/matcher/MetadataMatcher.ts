// local-media/matcher/MetadataMatcher.ts — CE5.5
// Metadata matching pipeline: Filename → TMDB → Bangumi → TVMaze → Merge → Score

import type { ClassifiedFile, MatchResult } from '../contracts/local-media.types'
import { ConfidenceScorer } from './ConfidenceScorer'
import type { IMetadataProvider } from '@provider-contracts'

const AUTO_MATCH_THRESHOLD = 0.8
const MANUAL_REVIEW_THRESHOLD = 0.5

export class MetadataMatcher {
  private scorer = new ConfidenceScorer()
  private providers: IMetadataProvider[] = []

  addProvider(provider: IMetadataProvider): void {
    this.providers.push(provider)
  }

  setProviders(providers: IMetadataProvider[]): void {
    this.providers = providers
  }

  async match(file: ClassifiedFile): Promise<MatchResult | null> {
    if (!file.parsed) return null

    const query = `${file.parsed.title}${file.parsed.year ? ` ${file.parsed.year}` : ''}`

    let bestResult: MatchResult | null = null
    let bestScore = 0

    for (const provider of this.providers) {
      try {
        const results = await provider.search(query)
        if (!results.length) continue

        const top = results[0]
        const score = this.scorer.score({
          queryTitle: file.parsed.title,
          queryYear: file.parsed.year,
          matchTitle: top.title,
        })

        if (score > bestScore && score >= MANUAL_REVIEW_THRESHOLD) {
          // Get rich detail
          let detail
          try {
            if (file.classification === 'movie') {
              detail = await provider.getMovie(top.id)
            } else {
              detail = await provider.getSeries(top.id)
            }
          } catch { detail = null }

          bestResult = {
            metadata: {
              title: detail?.title || top.title,
              originalTitle: (detail as any)?.originalTitle,
              year: (detail as any)?.year || (detail as any)?.firstAirDate?.substring(0, 4),
              poster: (detail as any)?.poster || top.cover,
              backdrop: (detail as any)?.backdrop || '',
              overview: (detail as any)?.overview || top.remark || '',
              genres: (detail as any)?.genres || [],
              rating: top.score || 0,
              runtime: (detail as any)?.runtime || 0,
              externalIds: { [provider.id]: top.id },
            },
            confidence: score,
            provider: provider.id,
          }
          bestScore = score
        }
      } catch {
        // Provider failed, continue
      }
    }

    return bestResult
  }

  async matchBatch(
    files: ClassifiedFile[],
    onProgress?: (done: number, total: number) => void
  ): Promise<Map<string, MatchResult>> {
    const results = new Map<string, MatchResult>()
    for (let i = 0; i < files.length; i++) {
      const match = await this.match(files[i])
      if (match && match.confidence >= MANUAL_REVIEW_THRESHOLD) {
        results.set(files[i].path, match)
      }
      onProgress?.(i + 1, files.length)
    }
    return results
  }

  getAutoMatched(matches: Map<string, MatchResult>): Map<string, MatchResult> {
    const auto = new Map<string, MatchResult>()
    for (const [path, result] of matches) {
      if (result.confidence >= AUTO_MATCH_THRESHOLD) auto.set(path, result)
    }
    return auto
  }

  getManualReview(matches: Map<string, MatchResult>): Map<string, MatchResult> {
    const manual = new Map<string, MatchResult>()
    for (const [path, result] of matches) {
      if (result.confidence >= MANUAL_REVIEW_THRESHOLD && result.confidence < AUTO_MATCH_THRESHOLD) {
        manual.set(path, result)
      }
    }
    return manual
  }
}
