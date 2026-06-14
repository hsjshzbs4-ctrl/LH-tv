// tests/unit/recommendation/runtime/ranking.spec.ts — CE9-C Ranking Tests

import { describe, it, expect } from 'vitest'
import { ScoreNormalizer } from '@/modules/recommendation/runtime/ranking/ScoreNormalizer'
import { ScoreSortStage, DiversityInterleaveStage, NoveltyBoostStage } from '@/modules/recommendation/runtime/ranking/RankingStage'
import { RankingPipeline } from '@/modules/recommendation/runtime/ranking/RankingPipeline'
import { RankingStrategyRegistry } from '@/modules/recommendation/runtime/ranking/RankingStrategyRegistry'
import { RecommendationItem } from '@/modules/recommendation/domain/entities/RecommendationItem'
import { RecommendationSource } from '@/modules/recommendation/domain/entities/RecommendationSource'
import { RecommendationScore } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason } from '@/modules/recommendation/domain/value-objects/RecommendationReason'
import { RecommendationProfile } from '@/modules/recommendation/domain/entities/RecommendationProfile'

function makeItem(id: string, interest: number, diversity = 0.5): RecommendationItem {
  return RecommendationItem.create({
    mediaId: id, title: `Title ${id}`, cover: 'x', type: 'movie',
    score: RecommendationScore.create({
      interestScore: interest, noveltyScore: 0.5, diversityScore: diversity,
      popularityScore: 0.5, freshnessScore: 0.5,
    }),
    reason: RecommendationReason.recommendedForYou(),
    sources: [RecommendationSource.create({ sourceType: 'personalized', label: 'P', weight: 1 })],
  })
}

function makeProfile() {
  return RecommendationProfile.create({
    generatedAt: Date.now(),
    genrePreferences: [],
    personPreferences: [],
    contentTypePreference: { movieRatio: 0.5, tvRatio: 0.3, animeRatio: 0.2 },
    preferredYears: [],
    favoriteMediaIds: ['seen-1'],
    historyMediaIds: [],
    dataPoints: 5,
  })
}

describe('ScoreNormalizer', () => {
  it('should normalize scores to 0-1 range', () => {
    const normalizer = new ScoreNormalizer()
    const items = [
      makeItem('a', 0.3),
      makeItem('b', 0.9),
      makeItem('c', 0.6),
    ]
    const normalized = normalizer.normalize(items)
    const composites = normalized.map(i => i.score.composite)
    const min = Math.min(...composites)
    const max = Math.max(...composites)
    expect(min).toBeGreaterThanOrEqual(0)
    expect(max).toBeLessThanOrEqual(1)
  })

  it('should handle single item', () => {
    const normalizer = new ScoreNormalizer()
    const items = [makeItem('a', 0.5)]
    const normalized = normalizer.normalize(items)
    expect(normalized).toHaveLength(1)
  })

  it('should handle empty array', () => {
    const normalizer = new ScoreNormalizer()
    expect(normalizer.normalize([])).toHaveLength(0)
  })

  it('z-score should handle variance', () => {
    const normalizer = new ScoreNormalizer()
    const items = [makeItem('a', 0.3), makeItem('b', 0.9), makeItem('c', 0.6)]
    const normalized = normalizer.normalizeZScore(items)
    expect(normalized).toHaveLength(3)
  })
})

describe('ScoreSortStage', () => {
  it('should sort by composite descending', () => {
    const stage = new ScoreSortStage()
    const items = [makeItem('a', 0.3), makeItem('b', 0.9), makeItem('c', 0.6)]
    const sorted = stage.process(items, makeProfile())
    expect(sorted[0].mediaId).toBe('b')
    expect(sorted[2].mediaId).toBe('a')
  })
})

describe('DiversityInterleaveStage', () => {
  it('should interleave high-score with high-diversity', () => {
    const stage = new DiversityInterleaveStage()
    const items = [
      makeItem('a', 0.9, 0.1),
      makeItem('b', 0.8, 0.9),
    ]
    const result = stage.process(items, makeProfile())
    expect(result).toHaveLength(2)
  })
})

describe('NoveltyBoostStage', () => {
  it('should boost unseen items', () => {
    const stage = new NoveltyBoostStage()
    const items = [makeItem('seen-1', 0.5), makeItem('new', 0.5)]
    const result = stage.process(items, makeProfile())
    expect(result).toHaveLength(2)
    // New item should rank higher after boost
    const newIdx = result.findIndex(i => i.mediaId === 'new')
    const seenIdx = result.findIndex(i => i.mediaId === 'seen-1')
    expect(newIdx).toBeLessThan(seenIdx)
  })
})

describe('RankingPipeline', () => {
  it('should execute stages in order', () => {
    const pipeline = new RankingPipeline([new ScoreSortStage()])
    const items = [makeItem('a', 0.3), makeItem('b', 0.9)]
    const result = pipeline.execute(items, makeProfile())
    expect(result[0].mediaId).toBe('b')
  })

  it('should add and remove stages', () => {
    const pipeline = new RankingPipeline()
    pipeline.addStage(new ScoreSortStage())
    expect(pipeline.stageNames).toContain('score-sort')
    pipeline.removeStage('score-sort')
    expect(pipeline.stageNames).not.toContain('score-sort')
  })

  it('should handle empty input', () => {
    const pipeline = new RankingPipeline([new ScoreSortStage()])
    expect(pipeline.execute([], makeProfile())).toHaveLength(0)
  })
})

describe('RankingStrategyRegistry', () => {
  it('should provide default presets', () => {
    const registry = new RankingStrategyRegistry()
    expect(registry.getPreset('default').stageNames).toBeDefined()
    expect(registry.getPreset('diversity-first').stageNames).toBeDefined()
    expect(registry.getPreset('novelty-first').stageNames).toBeDefined()
    expect(registry.getPreset('score-only').stageNames).toContain('score-sort')
  })

  it('should throw on unknown preset', () => {
    const registry = new RankingStrategyRegistry()
    expect(() => registry.getPreset('unknown' as any)).toThrow()
  })
})
