// tests/unit/recommendation/infrastructure/similarity.spec.ts — CE9-D

import { describe, it, expect } from 'vitest'
import { MetadataSimilarityService } from '@/modules/recommendation/infrastructure/similarity/MetadataSimilarityService'
import { EmbeddingSimilarityService } from '@/modules/recommendation/infrastructure/similarity/EmbeddingSimilarityService'

describe('MetadataSimilarityService', () => {
  it('should compute genre-based similarity', async () => {
    const svc = new MetadataSimilarityService()
    svc.indexRecords([
      { mediaId: 'm1', title: 'Action Movie', genres: ['Action', 'Sci-Fi'], actors: ['Actor A'], directors: ['Dir A'], tags: [], collections: [] },
      { mediaId: 'm2', title: 'Another Action', genres: ['Action', 'Thriller'], actors: ['Actor A'], directors: ['Dir B'], tags: [], collections: [] },
      { mediaId: 'm3', title: 'Romance', genres: ['Romance'], actors: ['Actor C'], directors: ['Dir C'], tags: [], collections: [] },
    ])

    const similar = await svc.findSimilar('m1', 2)
    expect(similar.length).toBeGreaterThan(0)
    // m2 should be more similar than m3 (shared Action genre + Actor A)
    expect(similar[0].mediaId).toBe('m2')
  })

  it('should compute direct similarity', async () => {
    const svc = new MetadataSimilarityService()
    svc.indexRecords([
      { mediaId: 'a', title: 'A', genres: ['Action'], actors: [], directors: [], tags: [], collections: [] },
      { mediaId: 'b', title: 'B', genres: ['Action'], actors: [], directors: [], tags: [], collections: [] },
    ])
    const score = await svc.computeSimilarity('a', 'b')
    expect(score).toBeGreaterThan(0)
  })

  it('should return 0 for non-indexed items', async () => {
    const svc = new MetadataSimilarityService()
    expect(await svc.findSimilar('unknown', 5)).toEqual([])
    expect(await svc.computeSimilarity('a', 'b')).toBe(0)
  })
})

describe('EmbeddingSimilarityService', () => {
  it('should return empty in CE9', async () => {
    const svc = new EmbeddingSimilarityService()
    expect(await svc.findSimilar('x', 5)).toEqual([])
    expect(await svc.computeSimilarity('a', 'b')).toBe(0)
  })
})
