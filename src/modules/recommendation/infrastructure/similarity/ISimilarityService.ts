// modules/recommendation/infrastructure/similarity/ISimilarityService.ts — CE9-D
// Similarity service interface. Metadata-based now, embedding-based in future.

export interface SimilarityResult {
  readonly mediaId: string
  readonly score: number
  readonly matchReasons: string[]
}

export interface ISimilarityService {
  /** Find items similar to a source media */
  findSimilar(sourceId: string, limit: number): Promise<SimilarityResult[]>

  /** Compute similarity between two specific items */
  computeSimilarity(a: string, b: string): Promise<number>
}
