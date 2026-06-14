// modules/recommendation/infrastructure/similarity/MetadataSimilarityService.ts — CE9-D
// Metadata-based similarity: genre, tags, actors, directors, collections.

import type { ISimilarityService, SimilarityResult } from './ISimilarityService'

export interface MetadataRecord {
  readonly mediaId: string
  readonly title: string
  readonly genres: string[]
  readonly actors: string[]
  readonly directors: string[]
  readonly tags: string[]
  readonly collections: string[]
}

export class MetadataSimilarityService implements ISimilarityService {
  private index: Map<string, MetadataRecord> = new Map()

  /** Index a media record for similarity queries */
  indexRecord(record: MetadataRecord): void {
    this.index.set(record.mediaId, record)
  }

  /** Bulk index */
  indexRecords(records: MetadataRecord[]): void {
    for (const record of records) {
      this.index.set(record.mediaId, record)
    }
  }

  async findSimilar(sourceId: string, limit: number): Promise<SimilarityResult[]> {
    const source = this.index.get(sourceId)
    if (!source) return []

    const results: SimilarityResult[] = []

    for (const [id, target] of this.index) {
      if (id === sourceId) continue

      const score = this._compute(source, target)
      if (score > 0) {
        results.push({
          mediaId: id,
          score,
          matchReasons: this._buildReasons(source, target),
        })
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  async computeSimilarity(a: string, b: string): Promise<number> {
    const recA = this.index.get(a)
    const recB = this.index.get(b)
    if (!recA || !recB) return 0
    return this._compute(recA, recB)
  }

  private _compute(a: MetadataRecord, b: MetadataRecord): number {
    const genreScore = this._jaccard(new Set(a.genres), new Set(b.genres))
    const actorScore = this._jaccard(new Set(a.actors), new Set(b.actors))
    const directorScore = this._jaccard(new Set(a.directors), new Set(b.directors))
    const tagScore = this._jaccard(new Set(a.tags), new Set(b.tags))
    const collectionScore = this._jaccard(new Set(a.collections), new Set(b.collections))

    return (
      genreScore * 0.35 +
      actorScore * 0.25 +
      directorScore * 0.15 +
      tagScore * 0.15 +
      collectionScore * 0.10
    )
  }

  private _jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 0
    const intersection = [...a].filter(x => b.has(x)).length
    const union = new Set([...a, ...b]).size
    return union === 0 ? 0 : intersection / union
  }

  private _buildReasons(a: MetadataRecord, b: MetadataRecord): string[] {
    const reasons: string[] = []
    const sharedGenres = a.genres.filter(g => b.genres.includes(g))
    if (sharedGenres.length > 0) reasons.push(`Genre: ${sharedGenres.slice(0, 2).join(', ')}`)
    const sharedActors = a.actors.filter(ac => b.actors.includes(ac))
    if (sharedActors.length > 0) reasons.push(`Actor: ${sharedActors[0]}`)
    const sharedDirectors = a.directors.filter(d => b.directors.includes(d))
    if (sharedDirectors.length > 0) reasons.push(`Director: ${sharedDirectors[0]}`)
    return reasons
  }
}
