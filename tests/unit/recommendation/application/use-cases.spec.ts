// tests/unit/recommendation/application/use-cases.spec.ts — CE9-B Use Case Tests

import { describe, it, expect, vi } from 'vitest'
import { GenerateRecommendationsUseCase } from '@/modules/recommendation/application/use-cases/GenerateRecommendationsUseCase'
import { GetPersonalizedFeedUseCase } from '@/modules/recommendation/application/use-cases/GetPersonalizedFeedUseCase'
import { GetTrendingFeedUseCase } from '@/modules/recommendation/application/use-cases/GetTrendingFeedUseCase'
import { GetContinueWatchingUseCase } from '@/modules/recommendation/application/use-cases/GetContinueWatchingUseCase'
import { GetSimilarContentUseCase } from '@/modules/recommendation/application/use-cases/GetSimilarContentUseCase'
import { TrackRecommendationClickUseCase } from '@/modules/recommendation/application/use-cases/TrackRecommendationClickUseCase'
import { TrackRecommendationConsumeUseCase } from '@/modules/recommendation/application/use-cases/TrackRecommendationConsumeUseCase'
import type { IRecommendationAnalyticsPort } from '@/modules/recommendation/application/ports/IRecommendationAnalyticsPort'
import { TrackingFailedError } from '@/modules/recommendation/application/errors/RecommendationErrors'

// ─── Helpers ───

function makeMockOrchestrator() {
  return {
    execute: vi.fn().mockResolvedValue({ requestId: 'resp-1', feed: {}, generatedAt: Date.now(), duration: 100, cacheHit: false }),
    getEvents: vi.fn().mockReturnValue([]),
  }
}

function makeMockAnalyticsPort(): IRecommendationAnalyticsPort {
  return {
    recordImpression: vi.fn(),
    recordClick: vi.fn(),
    recordPlay: vi.fn(),
    recordFavorite: vi.fn(),
    recordDismiss: vi.fn(),
    recordHide: vi.fn(),
    recordWatchComplete: vi.fn(),
  }
}

// ─── GenerateRecommendationsUseCase ───

describe('GenerateRecommendationsUseCase', () => {
  it('should delegate to orchestrator', async () => {
    const orchestrator = makeMockOrchestrator()
    const useCase = new GenerateRecommendationsUseCase(orchestrator as any)

    const result = await useCase.execute({
      requestId: 'r1', userId: 'u1', experimentId: 'e1', variantId: 'v1',
      timestamp: Date.now(), feedType: 'personalized', limit: 10, offset: 0,
    })

    expect(result.requestId).toBe('resp-1')
    expect(orchestrator.execute).toHaveBeenCalled()
  })
})

// ─── GetPersonalizedFeedUseCase ───

describe('GetPersonalizedFeedUseCase', () => {
  it('should build correct request and delegate', async () => {
    const orchestrator = makeMockOrchestrator()
    const useCase = new GetPersonalizedFeedUseCase(orchestrator as any)

    const result = await useCase.execute('alice', 'exp-1', 'var-a', 15)
    expect(result).toBeDefined()
    expect(orchestrator.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'alice', feedType: 'personalized', limit: 15 }),
    )
  })

  it('should default limit to 20', async () => {
    const orchestrator = makeMockOrchestrator()
    const useCase = new GetPersonalizedFeedUseCase(orchestrator as any)

    await useCase.execute('bob', 'exp-1', 'var-a')
    expect(orchestrator.execute).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
    )
  })
})

// ─── GetTrendingFeedUseCase ───

describe('GetTrendingFeedUseCase', () => {
  it('should build trending request', async () => {
    const orchestrator = makeMockOrchestrator()
    const useCase = new GetTrendingFeedUseCase(orchestrator as any)

    await useCase.execute('charlie', 'exp-2', 'var-b', 30)
    expect(orchestrator.execute).toHaveBeenCalledWith(
      expect.objectContaining({ feedType: 'trending', limit: 30 }),
    )
  })
})

// ─── GetContinueWatchingUseCase ───

describe('GetContinueWatchingUseCase', () => {
  it('should build continue-watching request', async () => {
    const orchestrator = makeMockOrchestrator()
    const useCase = new GetContinueWatchingUseCase(orchestrator as any)

    await useCase.execute('dave', 'exp-1', 'var-a')
    expect(orchestrator.execute).toHaveBeenCalledWith(
      expect.objectContaining({ feedType: 'continue-watching', limit: 10 }),
    )
  })
})

// ─── GetSimilarContentUseCase ───

describe('GetSimilarContentUseCase', () => {
  it('should build similar-content request with source media', async () => {
    const orchestrator = makeMockOrchestrator()
    const useCase = new GetSimilarContentUseCase(orchestrator as any)

    await useCase.execute('eve', 'media-42', 'exp-3', 'var-c', 8)
    expect(orchestrator.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        feedType: 'similar-content',
        limit: 8,
        metadata: { sourceMediaId: 'media-42' },
      }),
    )
  })
})

// ─── TrackRecommendationClickUseCase ───

describe('TrackRecommendationClickUseCase', () => {
  it('should record click via analytics port', async () => {
    const port = makeMockAnalyticsPort()
    const useCase = new TrackRecommendationClickUseCase(port)

    await useCase.execute('feed-1', 'section-1', 'media-99', 3)
    expect(port.recordClick).toHaveBeenCalledWith('feed-1', 'section-1', 'media-99', 3)
  })

  it('should throw TrackingFailedError on failure', async () => {
    const port = makeMockAnalyticsPort()
    port.recordClick = vi.fn().mockRejectedValue(new Error('network down'))
    const useCase = new TrackRecommendationClickUseCase(port)

    await expect(useCase.execute('f', 's', 'm', 0))
      .rejects.toThrow(TrackingFailedError)
  })
})

// ─── TrackRecommendationConsumeUseCase ───

describe('TrackRecommendationConsumeUseCase', () => {
  it('should record play action', async () => {
    const port = makeMockAnalyticsPort()
    const useCase = new TrackRecommendationConsumeUseCase(port)

    await useCase.execute({ feedId: 'f1', mediaId: 'm1', action: 'play', sourceId: 'jellyfin' })
    expect(port.recordPlay).toHaveBeenCalledWith('f1', 'm1', 'jellyfin')
  })

  it('should record favorite action', async () => {
    const port = makeMockAnalyticsPort()
    const useCase = new TrackRecommendationConsumeUseCase(port)

    await useCase.execute({ feedId: 'f1', mediaId: 'm1', action: 'favorite' })
    expect(port.recordFavorite).toHaveBeenCalledWith('f1', 'm1')
  })

  it('should record dismiss action', async () => {
    const port = makeMockAnalyticsPort()
    const useCase = new TrackRecommendationConsumeUseCase(port)

    await useCase.execute({
      feedId: 'f1', mediaId: 'm1', action: 'dismiss',
      sectionId: 's1', dismissReason: 'not-interested',
    })
    expect(port.recordDismiss).toHaveBeenCalledWith('f1', 's1', 'm1', 'not-interested')
  })

  it('should record hide action', async () => {
    const port = makeMockAnalyticsPort()
    const useCase = new TrackRecommendationConsumeUseCase(port)

    await useCase.execute({ feedId: 'f1', mediaId: 'm1', action: 'hide', sectionId: 's1' })
    expect(port.recordHide).toHaveBeenCalledWith('f1', 's1')
  })

  it('should record watch-complete action', async () => {
    const port = makeMockAnalyticsPort()
    const useCase = new TrackRecommendationConsumeUseCase(port)

    await useCase.execute({
      feedId: 'f1', mediaId: 'm1', action: 'watch-complete',
      watchedDuration: 5400, totalDuration: 6000,
    })
    expect(port.recordWatchComplete).toHaveBeenCalledWith('f1', 'm1', 5400, 6000)
  })

  it('should throw TrackingFailedError on failure', async () => {
    const port = makeMockAnalyticsPort()
    port.recordPlay = vi.fn().mockRejectedValue(new Error('fail'))
    const useCase = new TrackRecommendationConsumeUseCase(port)

    await expect(useCase.execute({ feedId: 'f', mediaId: 'm', action: 'play' }))
      .rejects.toThrow(TrackingFailedError)
  })
})
