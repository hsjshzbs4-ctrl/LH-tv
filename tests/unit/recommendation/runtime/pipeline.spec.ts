// tests/unit/recommendation/runtime/pipeline.spec.ts — CE9-C Diversification + Cold Start + FeedGen Tests

import { describe, it, expect } from 'vitest'
import { GenreDiversifier } from '@/modules/recommendation/runtime/diversification/GenreDiversifier'
import { FranchiseDiversifier } from '@/modules/recommendation/runtime/diversification/FranchiseDiversifier'
import { DiversityPipeline } from '@/modules/recommendation/runtime/diversification/DiversityPipeline'
import { ColdStartEngine } from '@/modules/recommendation/runtime/cold-start/ColdStartEngine'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'
import { RecommendationContext } from '@/modules/recommendation/domain/entities/RecommendationContext'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'

function makeItem(id: string, genres: string[], title?: string): RecommendationItem {
  return RecommendationItem.create({
    mediaId: id, title: title ?? `Title ${id}`, cover: 'x', type: 'movie',
    score: RecommendationScore.zero(),
    reason: RecommendationReason.topPick(),
    sources: [RecommendationSource.create({ sourceType: 'trending', label: 'T', weight: 1 })],
    genres,
  })
}

// ─── GenreDiversifier ───

describe('GenreDiversifier', () => {
  it('should allow items within limit', () => {
    const d = new GenreDiversifier(5)
    const items = [makeItem('a', ['Action']), makeItem('b', ['Comedy'])]
    const result = d.diversify(items)
    expect(result.accepted).toHaveLength(2)
    expect(result.rejected).toHaveLength(0)
  })

  it('should reject items exceeding genre limit', () => {
    const d = new GenreDiversifier(2) // max 2 per genre
    const items = [
      makeItem('a', ['Action']),
      makeItem('b', ['Action']),
      makeItem('c', ['Action']), // should be rejected
    ]
    const result = d.diversify(items)
    expect(result.accepted).toHaveLength(2)
    expect(result.rejected).toHaveLength(1)
  })

  it('wouldViolate should detect saturation', () => {
    const d = new GenreDiversifier(2)
    const existing = [makeItem('a', ['Action']), makeItem('b', ['Action'])]
    expect(d.wouldViolate(makeItem('c', ['Action']), existing)).toBe(true)
    expect(d.wouldViolate(makeItem('d', ['Comedy']), existing)).toBe(false)
  })
})

// ─── FranchiseDiversifier ───

describe('FranchiseDiversifier', () => {
  it('should limit franchise items', () => {
    const d = new FranchiseDiversifier(2)
    const items = [
      makeItem('a', ['Action'], 'Star Wars: Episode 4'),
      makeItem('b', ['Action'], 'Star Wars: Episode 5'),
      makeItem('c', ['Action'], 'Star Wars: Episode 6'), // should be rejected
    ]
    const result = d.diversify(items)
    expect(result.accepted).toHaveLength(2)
    expect(result.rejected).toHaveLength(1)
  })

  it('should pass custom franchise resolver', () => {
    const d = new FranchiseDiversifier(1, () => 'shared-franchise')
    const items = [makeItem('a', ['Action'], 'Movie A'), makeItem('b', ['Drama'], 'Movie B')]
    const result = d.diversify(items)
    expect(result.accepted).toHaveLength(1)
  })
})

// ─── DiversityPipeline ───

describe('DiversityPipeline', () => {
  it('should apply both genre and franchise filters', () => {
    const pipeline = new DiversityPipeline({ maxPerGenre: 3, maxPerFranchise: 2 })
    const items = [
      makeItem('a', ['Action'], 'Franchise X: 1'),
      makeItem('b', ['Action'], 'Franchise X: 2'),
      makeItem('c', ['Action'], 'Franchise X: 3'),
      makeItem('d', ['Action'], 'Movie D'),
    ]
    const result = pipeline.execute(items)
    expect(result.totalFiltered).toBeGreaterThanOrEqual(1)
    expect(result.items.length).toBeLessThan(items.length)
  })
})

// ─── ColdStartEngine ───

describe('ColdStartEngine', () => {
  it('should generate items without profile data', async () => {
    const engine = new ColdStartEngine()
    await engine.initialize()

    engine.updateItems(
      [{ mediaId: 'p1', title: 'Popular', type: 'movie', cover: 'x', genres: ['Action'], popularity: 0.95 }],
      [{ mediaId: 't1', title: 'Trending', type: 'tv', cover: 'x', genres: ['Drama'], popularity: 0.8 }],
      [{ mediaId: 'r1', title: 'Recent', type: 'movie', cover: 'x', genres: ['Comedy'], popularity: 0.6 }],
    )

    const items = await engine.generate(RecommendationContext.default(), RecommendationProfile.empty(), 10)
    expect(items.length).toBeGreaterThan(0)
    // All items should have top-pick or trending-in-genre reason
    expect(items.every(i => i.reason.rendered.length > 0)).toBe(true)
  })

  it('should be available when items exist', async () => {
    const engine = new ColdStartEngine()
    await engine.initialize()
    expect(engine.isAvailable()).toBe(false)
    engine.updateItems(
      [{ mediaId: 'x', title: 'X', type: 'movie', cover: 'x', genres: [], popularity: 0.5 }],
      [], [],
    )
    expect(engine.isAvailable()).toBe(true)
  })

  it('should blend popular/trending/recent with hybrid strategy', async () => {
    const engine = new ColdStartEngine()
    await engine.initialize()
    engine.updateItems(
      Array.from({ length: 10 }, (_, i) => ({ mediaId: `p${i}`, title: `P${i}`, type: 'movie' as const, cover: 'x', genres: ['Action'], popularity: 1 - i * 0.1 })),
      Array.from({ length: 10 }, (_, i) => ({ mediaId: `t${i}`, title: `T${i}`, type: 'tv' as const, cover: 'x', genres: ['Drama'], popularity: 0.8 - i * 0.08 })),
      Array.from({ length: 10 }, (_, i) => ({ mediaId: `r${i}`, title: `R${i}`, type: 'movie' as const, cover: 'x', genres: ['Comedy'], popularity: 0.7 - i * 0.07 })),
    )
    const items = await engine.generate(RecommendationContext.default(), RecommendationProfile.empty(), 10)
    expect(items).toHaveLength(10)
  })
})
