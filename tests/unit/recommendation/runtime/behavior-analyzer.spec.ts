// tests/unit/recommendation/runtime/behavior-analyzer.spec.ts — S5-3 单元测试

import { describe, it, expect } from 'vitest'
import {
  BehaviorAnalyzer,
  BehaviorAction,
  type BehaviorSignal,
} from '@/modules/recommendation/runtime/analyzers/BehaviorAnalyzer'
import { WatchPatternAnalyzer, TimeBucket } from '@/modules/recommendation/runtime/analyzers/WatchPatternAnalyzer'
import { RepeatWatchDetector } from '@/modules/recommendation/runtime/analyzers/RepeatWatchDetector'
import { computeDecayWeight } from '@/modules/recommendation/runtime/analyzers/DecayFunction'

// ── DecayFunction ──

describe('DecayFunction', () => {
  it('returns 1.0 for current timestamp', () => {
    const now = Date.now()
    expect(computeDecayWeight(now, now)).toBe(1)
  })

  it('returns < 1 for old timestamp', () => {
    const now = Date.now()
    const old = now - 60 * 24 * 60 * 60 * 1000 // 60 days ago
    const weight = computeDecayWeight(old, now)
    expect(weight).toBeLessThan(1)
    expect(weight).toBeGreaterThan(0)
  })

  it('never goes below minWeight', () => {
    const now = Date.now()
    const ancient = now - 365 * 24 * 60 * 60 * 1000 // 1 year ago
    const weight = computeDecayWeight(ancient, now, { minWeight: 0.01 })
    expect(weight).toBeGreaterThanOrEqual(0.01)
  })
})

// ── BehaviorAnalyzer ──

describe('BehaviorAnalyzer', () => {
  const analyzer = new BehaviorAnalyzer()

  function makeSignal(overrides?: Partial<BehaviorSignal>): BehaviorSignal {
    return {
      mediaId: 'media-1',
      genre: ['Action', 'Sci-Fi'],
      type: 'movie',
      year: 2024,
      action: BehaviorAction.WATCH,
      timestamp: Date.now(),
      ...overrides,
    }
  }

  it('builds preference vector from signals', () => {
    const signals = [
      makeSignal(),
      makeSignal({ mediaId: 'media-2', genre: ['Action', 'Comedy'], action: BehaviorAction.COMPLETE }),
      makeSignal({ mediaId: 'media-3', genre: ['Drama'], action: BehaviorAction.FAVORITE }),
    ]

    const vector = analyzer.analyze(signals)

    expect(vector.totalSignals).toBe(3)
    // Action: 0.5 (watch) + 1.0 (complete) = 1.5
    expect(vector.genreWeights.get('Action')).toBeGreaterThan(1)
    // Comedy: 1.0 (complete)
    expect(vector.genreWeights.get('Comedy')).toBeCloseTo(1, 1)
    // Drama: 0.9 (favorite)
    expect(vector.genreWeights.get('Drama')).toBeCloseTo(0.9, 1)
  })

  it('handles cold start detection', () => {
    const signals = [makeSignal(), makeSignal()] // only 2
    const vector = analyzer.analyze(signals)
    expect(BehaviorAnalyzer.isColdStart(vector)).toBe(true)
  })

  it('is not cold start with enough signals', () => {
    const signals = [makeSignal(), makeSignal(), makeSignal(), makeSignal()]
    const vector = analyzer.analyze(signals)
    expect(BehaviorAnalyzer.isColdStart(vector)).toBe(false)
  })

  it('merges with existing weights', () => {
    const existing = {
      genreWeights: new Map([['Action', 2.0]]),
      typeWeights: new Map([['movie', 1.5]]),
      yearWeights: new Map([[2020, 1.0]]),
      personWeights: new Map(),
      totalSignals: 5,
      updatedAt: Date.now(),
    }

    const signals = [makeSignal({ genre: ['Comedy'], action: BehaviorAction.FAVORITE })]
    const vector = analyzer.analyze(signals, existing)

    expect(vector.genreWeights.get('Action')).toBe(2.0) // preserved
    expect(vector.genreWeights.get('Comedy')).toBeCloseTo(0.9, 1) // new
    expect(vector.totalSignals).toBe(6)
  })

  it('generates top genres', () => {
    const signals = [
      makeSignal({ genre: ['A', 'B'], action: BehaviorAction.COMPLETE }),
      makeSignal({ genre: ['A'], action: BehaviorAction.FAVORITE }),
      makeSignal({ genre: ['C'], action: BehaviorAction.WATCH }),
    ]
    const vector = analyzer.analyze(signals)
    const top = BehaviorAnalyzer.topGenres(vector, 2)
    expect(top).toEqual(['A', 'B'])
  })
})

// ── WatchPatternAnalyzer ──

describe('WatchPatternAnalyzer', () => {
  const analyzer = new WatchPatternAnalyzer()

  it('maps hours to time buckets correctly', () => {
    const signals = [
      { mediaId: '1', action: BehaviorAction.WATCH, timestamp: new Date('2026-06-17T08:00:00').getTime() },
      { mediaId: '2', action: BehaviorAction.WATCH, timestamp: new Date('2026-06-17T14:00:00').getTime() },
      { mediaId: '3', action: BehaviorAction.WATCH, timestamp: new Date('2026-06-17T20:00:00').getTime() },
    ] as BehaviorSignal[]

    const pattern = analyzer.analyze(signals)
    expect(pattern.timePreferences.get(TimeBucket.MORNING)).toBe(1)
    expect(pattern.timePreferences.get(TimeBucket.AFTERNOON)).toBe(1)
    expect(pattern.timePreferences.get(TimeBucket.EVENING)).toBe(1)
  })

  it('detects binge watching', () => {
    const baseTime = new Date('2026-06-17T20:00:00').getTime()
    const signals: BehaviorSignal[] = [
      { mediaId: 'ep1', action: BehaviorAction.COMPLETE, timestamp: baseTime,
        metadata: { seriesId: 'show-1' } },
      { mediaId: 'ep2', action: BehaviorAction.COMPLETE, timestamp: baseTime + 20 * 60 * 1000,
        metadata: { seriesId: 'show-1' } },
      { mediaId: 'ep3', action: BehaviorAction.COMPLETE, timestamp: baseTime + 40 * 60 * 1000,
        metadata: { seriesId: 'show-1' } },
    ]

    const pattern = analyzer.analyze(signals)
    expect(pattern.isBingeWatcher).toBe(true)
  })
})

// ── RepeatWatchDetector ──

describe('RepeatWatchDetector', () => {
  const detector = new RepeatWatchDetector()

  it('detects repeated watching of same media', () => {
    const signals: BehaviorSignal[] = [
      { mediaId: 'media-a', genre: ['Action'], action: BehaviorAction.WATCH, timestamp: Date.now() },
      { mediaId: 'media-a', genre: ['Action'], action: BehaviorAction.WATCH, timestamp: Date.now() + 1 },
      { mediaId: 'media-a', genre: ['Action'], action: BehaviorAction.COMPLETE, timestamp: Date.now() + 2 },
      { mediaId: 'media-b', genre: ['Comedy'], action: BehaviorAction.WATCH, timestamp: Date.now() },
    ]

    const result = detector.analyze(signals)
    expect(result.totalRepeatCount).toBe(2) // media-a watched 3 times = 2 repeats
    expect(result.repeatedMedia.get('media-a')).toBe(3)
    expect(result.repeatedGenres.get('Action')).toBe(2)
  })

  it('media watched once is not repeated', () => {
    const signals: BehaviorSignal[] = [
      { mediaId: 'media-b', genre: ['Comedy'], action: BehaviorAction.WATCH, timestamp: Date.now() },
    ]

    const result = detector.analyze(signals)
    expect(result.totalRepeatCount).toBe(0)
  })
})
