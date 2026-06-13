// core/content-ecosystem/utils/RateLimiter.ts — CE3
// Token-bucket rate limiter for external APIs
// Zero Electron dependency — testable in vitest

import type { RateLimitConfig } from '@provider-contracts'

export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = []
  private processing = false

  constructor(private config: RateLimitConfig) {
    this.tokens = config.maxTokens
    this.lastRefill = Date.now()
  }

  async acquire(): Promise<void> {
    this.refill()
    if (this.tokens > 0) {
      this.tokens--
      return
    }
    // Queue and wait
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject })
      if (!this.processing) this._processQueue()
    })
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const newTokens = elapsed * this.config.refillRate
    this.tokens = Math.min(this.config.maxTokens, this.tokens + newTokens)
    this.lastRefill = now
  }

  private _processQueue(): void {
    this.processing = true
    const interval = setInterval(() => {
      this.refill()
      while (this.queue.length > 0 && this.tokens > 0) {
        const next = this.queue.shift()!
        this.tokens--
        next.resolve()
      }
      if (this.queue.length === 0) {
        clearInterval(interval)
        this.processing = false
      }
    }, 100) // check every 100ms
  }

  get availableTokens(): number {
    this.refill()
    return Math.floor(this.tokens)
  }
}

// Pre-configured rate limits for external APIs
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  TMDB:    { maxTokens: 40, refillRate: 40 / 1000 },        // 40 req/s
  BANGUMI: { maxTokens: 5,  refillRate: 5 / 1000 },         // 5 req/s
  TVMAZE:  { maxTokens: 20, refillRate: 20 / 10000 },       // 20 req/10s
}
