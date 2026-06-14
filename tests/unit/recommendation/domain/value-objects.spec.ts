// tests/unit/recommendation/domain/value-objects.spec.ts — CE9-A Value Object Tests

import { describe, it, expect } from 'vitest'
import { RecommendationScore, DEFAULT_SCORE_WEIGHTS } from '@/modules/recommendation/domain/value-objects/RecommendationScore'
import { RecommendationReason, REASON_TEMPLATES } from '@/modules/recommendation/domain/value-objects/RecommendationReason'
import { DiversityConstraint } from '@/modules/recommendation/domain/value-objects/DiversityConstraint'
import { RecommendationWeight } from '@/modules/recommendation/domain/value-objects/RecommendationWeight'

// ─── RecommendationScore ───

describe('RecommendationScore', () => {
  it('should create a valid score', () => {
    const score = RecommendationScore.create({
      interestScore: 0.8,
      noveltyScore: 0.6,
      diversityScore: 0.5,
      popularityScore: 0.7,
      freshnessScore: 0.4,
    })
    expect(score.interestScore).toBe(0.8)
    expect(score.composite).toBeGreaterThan(0)
  })

  it('should compute composite as weighted sum', () => {
    const score = RecommendationScore.create({
      interestScore: 1.0,
      noveltyScore: 0.0,
      diversityScore: 0.0,
      popularityScore: 0.0,
      freshnessScore: 0.0,
    })
    // composite = 0.35 * 1.0 + 0.20 * 0 + 0.10 * 0 + 0.15 * 0 + 0.20 * 0
    expect(score.composite).toBeCloseTo(0.35)
  })

  it('should reject out-of-range values', () => {
    expect(() => RecommendationScore.create({
      interestScore: 1.5,
      noveltyScore: 0,
      diversityScore: 0,
      popularityScore: 0,
      freshnessScore: 0,
    })).toThrow()
  })

  it('should reject negative values', () => {
    expect(() => RecommendationScore.create({
      interestScore: -0.1,
      noveltyScore: 0,
      diversityScore: 0,
      popularityScore: 0,
      freshnessScore: 0,
    })).toThrow()
  })

  it('zero() should return all zeros', () => {
    const score = RecommendationScore.zero()
    expect(score.composite).toBe(0)
    expect(score.interestScore).toBe(0)
  })

  it('perfect() should return all ones', () => {
    const score = RecommendationScore.perfect()
    expect(score.composite).toBe(1.0)
    expect(score.confidence).toBe(1)
  })

  it('should compare scores correctly', () => {
    const a = RecommendationScore.create({
      interestScore: 0.9, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0,
    })
    const b = RecommendationScore.create({
      interestScore: 0.3, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0,
    })
    expect(a.compare(b)).toBe(1)
    expect(b.compare(a)).toBe(-1)
    expect(a.compare(a)).toBe(0)
  })

  it('withInterest() should return new score with updated dimension', () => {
    const score = RecommendationScore.zero()
    const updated = score.withInterest(0.7)
    expect(updated.interestScore).toBe(0.7)
    expect(score.interestScore).toBe(0) // original unchanged
  })

  it('isMeaningful should return false for very low scores', () => {
    const score = RecommendationScore.zero()
    expect(score.isMeaningful()).toBe(false)
    expect(score.isMeaningful(0.5)).toBe(false)
    expect(score.isMeaningful(0)).toBe(true) // composite 0 >= threshold 0
  })

  it('should support custom weights', () => {
    const score = RecommendationScore.create(
      { interestScore: 1, noveltyScore: 0, diversityScore: 0, popularityScore: 0, freshnessScore: 0 },
      { interest: 1.0, novelty: 0, diversity: 0, popularity: 0, freshness: 0 },
    )
    expect(score.composite).toBe(1.0)
  })
})

// ─── RecommendationReason ───

describe('RecommendationReason', () => {
  it('should render because-you-watched correctly', () => {
    const reason = RecommendationReason.becauseYouWatched('Breaking Bad')
    expect(reason.rendered).toBe('Because you watched Breaking Bad')
  })

  it('should render trending-in-genre', () => {
    const reason = RecommendationReason.trendingInGenre('Crime Drama')
    expect(reason.rendered).toBe('Trending in Crime Drama')
  })

  it('should render popular-on-provider', () => {
    const reason = RecommendationReason.popularOnProvider('Jellyfin')
    expect(reason.rendered).toBe('Popular on Jellyfin')
  })

  it('should render all 8 templates without error', () => {
    const factories = [
      () => RecommendationReason.becauseYouWatched('X'),
      () => RecommendationReason.trendingInGenre('X'),
      () => RecommendationReason.popularOnProvider('X'),
      () => RecommendationReason.recentlyAdded(),
      () => RecommendationReason.similarTo('X'),
      () => RecommendationReason.recommendedForYou(),
      () => RecommendationReason.newOnProvider('X'),
      () => RecommendationReason.topPick(),
    ]
    for (const factory of factories) {
      const reason = factory()
      expect(reason.rendered.length).toBeGreaterThan(0)
    }
  })

  it('should reject unknown template', () => {
    expect(() => RecommendationReason.create('unknown' as any, {}))
      .toThrow('unknown template')
  })

  it('should render from template with params', () => {
    const reason = RecommendationReason.create('because-you-watched', { title: 'Inception' })
    expect(reason.rendered).toBe('Because you watched Inception')
  })

  it('equals should work for same template and params', () => {
    const a = RecommendationReason.becauseYouWatched('A')
    const b = RecommendationReason.becauseYouWatched('A')
    const c = RecommendationReason.becauseYouWatched('B')
    expect(a.equals(b)).toBe(true)
    expect(a.equals(c)).toBe(false)
  })

  it('toJSON should include rendered text', () => {
    const reason = RecommendationReason.similarTo('The Matrix')
    const json = reason.toJSON()
    expect(json.template).toBe('similar-to')
    expect(json.rendered).toBe('Similar to The Matrix')
  })
})

// ─── DiversityConstraint ───

describe('DiversityConstraint', () => {
  it('default should enforce 3 franchise / 5 genre', () => {
    const c = DiversityConstraint.default()
    expect(c.maxPerFranchise).toBe(3)
    expect(c.maxPerGenre).toBe(5)
  })

  it('should create custom constraint', () => {
    const c = DiversityConstraint.create({ maxPerFranchise: 2, maxPerGenre: 3 })
    expect(c.maxPerFranchise).toBe(2)
    expect(c.maxPerGenre).toBe(3)
  })

  it('should reject invalid values', () => {
    expect(() => DiversityConstraint.create({ maxPerFranchise: 0 })).toThrow()
    expect(() => DiversityConstraint.create({ maxPerGenre: -1 })).toThrow()
  })
})

// ─── RecommendationWeight ───

describe('RecommendationWeight', () => {
  it('should create weight', () => {
    const w = RecommendationWeight.create(0.5, 'content-based')
    expect(w.value).toBe(0.5)
    expect(w.label).toBe('content-based')
  })

  it('should apply weight to score', () => {
    const w = RecommendationWeight.create(0.6, 'test')
    expect(w.apply(100)).toBe(60)
  })

  it('should trim label', () => {
    const w = RecommendationWeight.create(0.5, '  test  ')
    expect(w.label).toBe('test')
  })

  it('zero() should have value 0', () => {
    const w = RecommendationWeight.zero('test')
    expect(w.value).toBe(0)
    expect(w.apply(100)).toBe(0)
  })

  it('full() should have value 1', () => {
    const w = RecommendationWeight.full('test')
    expect(w.value).toBe(1)
    expect(w.apply(100)).toBe(100)
  })
})
