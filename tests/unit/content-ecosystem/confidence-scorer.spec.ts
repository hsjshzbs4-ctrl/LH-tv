// tests/unit/content-ecosystem/confidence-scorer.spec.ts — CE5.5
import { describe, it, expect } from 'vitest'
import { ConfidenceScorer } from '@/core/content-ecosystem/local-media/matcher/ConfidenceScorer'

const scorer = new ConfidenceScorer()

describe('ConfidenceScorer', () => {
  it('scores exact match as 1.0', () => {
    const score = scorer.score({ queryTitle: 'Interstellar', matchTitle: 'Interstellar' })
    expect(score).toBeGreaterThanOrEqual(0.7)
  })

  it('scores partial match', () => {
    const score = scorer.score({ queryTitle: 'Breaking Bad', matchTitle: 'Breaking Bad Season 1' })
    expect(score).toBeGreaterThan(0.5)
  })

  it('scores year match bonus', () => {
    const exact = scorer.score({ queryTitle: 'Dune', queryYear: 2021, matchTitle: 'Dune', matchYear: 2021 })
    const wrong = scorer.score({ queryTitle: 'Dune', queryYear: 2021, matchTitle: 'Dune', matchYear: 1984 })
    expect(exact).toBeGreaterThan(wrong)
  })
})
