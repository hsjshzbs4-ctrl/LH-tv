// tests/unit/content-ecosystem/rate-limiter.spec.ts — CE3
import { describe, it, expect } from 'vitest'
import { RateLimiter } from '@/core/content-ecosystem/utils/RateLimiter'

describe('RateLimiter', () => {
  it('allows tokens up to max', async () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 5 / 1000 })
    expect(limiter.availableTokens).toBeGreaterThanOrEqual(4)

    // Consume all tokens
    for (let i = 0; i < 5; i++) {
      await limiter.acquire()
    }
    expect(limiter.availableTokens).toBe(0)
  })

  it('respects token bucket limits', () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillRate: 10 / 1000 })
    expect(limiter.availableTokens).toBeGreaterThanOrEqual(8)
    expect(limiter.availableTokens).toBeLessThanOrEqual(10)
  })
})
