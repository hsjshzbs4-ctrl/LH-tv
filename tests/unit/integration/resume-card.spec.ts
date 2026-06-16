// tests/unit/integration/resume-card.spec.ts
import { describe, it, expect } from 'vitest'
import { createResumeCard, shouldShowResume } from '@/integration/continueWatching/resumeCard'

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'h1', mediaId: 'm1', episodeId: 'ep1', providerId: 'p1',
    title: 'Test Show', cover: '', episodeLabel: 'E1',
    duration: 1200, currentTime: 400, progress: 0.33,
    lastWatchedAt: Date.now(),
    ...overrides,
  }
}

describe('createResumeCard', () => {
  it('should create card when position > 30s and < 95%', () => {
    const card = createResumeCard(makeItem())
    expect(card).not.toBeNull()
    expect(card!.progressPercent).toBe(33)
    expect(card!.lastPosition).toBe(400)
  })

  it('should return null when position < 30s', () => {
    expect(createResumeCard(makeItem({ currentTime: 10, progress: 0.01 }))).toBeNull()
  })

  it('should return null when progress >= 95%', () => {
    expect(createResumeCard(makeItem({ currentTime: 1180, progress: 0.98 }))).toBeNull()
  })

  it('should return null for null input', () => {
    expect(createResumeCard(null)).toBeNull()
  })
})

describe('shouldShowResume', () => {
  it('should return true for valid resume position', () => {
    expect(shouldShowResume(makeItem())).toBe(true)
  })

  it('should return false for invalid', () => {
    expect(shouldShowResume(makeItem({ currentTime: 5 }))).toBe(false)
    expect(shouldShowResume(null)).toBe(false)
  })
})
