// modules/recommendation/application/orchestrators/RecommendationOrchestrator.ts — CE9-B
// Coordinates the recommendation pipeline. Pure orchestration — NO business logic.
// NO scoring, ranking, diversity filtering, or recommendation generation.
// Those belong exclusively to Domain (CE9-A) and Runtime (CE9-C) layers.

import type { RecommendationRequestDto } from '../dto/RecommendationRequestDto'
import type { RecommendationResponseDto } from '../dto/RecommendationResponseDto'
import type { IRecommendationProfilePort } from '../ports/IRecommendationProfilePort'
import type { IRecommendationCachePort } from '../ports/IRecommendationCachePort'
import type { IRecommendationGenerator } from '../../domain/contracts/IRecommendationGenerator'
import { RecommendationProfile } from '../../domain/entities/RecommendationProfile'
import { RecommendationContext } from '../../domain/entities/RecommendationContext'
import { FeedMapper } from '../mappers/FeedMapper'
import { FeedGenerationFailedError } from '../errors/RecommendationErrors'
import { ProfileNotFoundError } from '../errors/RecommendationErrors'
import { RecommendationValidationError } from '../errors/RecommendationErrors'
import {
  validateRecommendationRequest,
} from '../dto/RecommendationRequestDto'
import { AppEventFactory } from '../events/ApplicationEvents'
import type { ApplicationEvent } from '../events/ApplicationEvents'

export interface OrchestratorDependencies {
  readonly profilePort: IRecommendationProfilePort
  readonly cachePort: IRecommendationCachePort
  readonly generator: IRecommendationGenerator
}

export class RecommendationOrchestrator {
  private readonly profilePort: IRecommendationProfilePort
  private readonly cachePort: IRecommendationCachePort
  private readonly generator: IRecommendationGenerator
  private readonly events: ApplicationEvent[] = []

  constructor(deps: OrchestratorDependencies) {
    this.profilePort = deps.profilePort
    this.cachePort = deps.cachePort
    this.generator = deps.generator
  }

  /**
   * Execute the full recommendation pipeline.
   *
   * Pipeline:
   * 1. Validate request
   * 2. Build context
   * 3. Load profile
   * 4. Check cache
   * 5. Delegate to generator (domain/runtime — no business logic here)
   * 6. Map to DTO
   * 7. Emit events
   * 8. Return response
   */
  async execute(request: RecommendationRequestDto): Promise<RecommendationResponseDto> {
    const startTime = Date.now()

    // 1. Validate
    const validationErrors = validateRecommendationRequest(request)
    if (validationErrors) {
      throw new RecommendationValidationError(validationErrors)
    }

    // 2. Build context
    const context = this._buildContext(request)

    // 3. Load profile
    let profile: RecommendationProfile | null
    try {
      profile = await this.profilePort.loadProfile(request.userId)
    } catch {
      throw new ProfileNotFoundError(request.userId)
    }

    if (!profile) {
      // No profile yet — use empty for cold start
      profile = RecommendationProfile.empty()
    }

    // 4. Check cache
    const cacheKey = this._buildCacheKey(request)
    let cacheHit = false

    try {
      const cached = await this.cachePort.readFeed(cacheKey)
      if (cached && !cached.isExpired()) {
        cacheHit = true
        this._emitEvent(AppEventFactory.cacheHit(request.requestId, cacheKey))

        const dto = FeedMapper.toDto(cached)
        const duration = Date.now() - startTime

        const response: RecommendationResponseDto = {
          requestId: request.requestId,
          feed: dto,
          generatedAt: cached.generatedAt,
          duration,
          cacheHit: true,
        }

        this._emitEvent(AppEventFactory.recommendationDelivered(response, duration))
        return response
      }
    } catch {
      // Cache miss or error — continue to generation (non-blocking)
    }

    this._emitEvent(AppEventFactory.cacheMiss(request.requestId, cacheKey))

    // 5. Delegate to generator (domain/runtime)
    //    NO scoring/ranking/diversity here — those are domain services
    try {
      const feed = await this.generator.generateFeed(context, profile, {
        includeSections: request.feedType === 'personalized' ? undefined : [request.feedType],
        maxPoolPerEngine: request.limit * 2,
        ttlOverride: undefined,
      })

      // 6. Map to DTO
      const dto = FeedMapper.toDto(feed)

      // 7. Cache the result (fire-and-forget)
      this.cachePort.writeFeed(cacheKey, feed).catch(() => {
        // Cache write failure is non-blocking
      })

      const duration = Date.now() - startTime

      const response: RecommendationResponseDto = {
        requestId: request.requestId,
        feed: dto,
        generatedAt: feed.generatedAt,
        duration,
        cacheHit: false,
      }

      // 8. Emit events
      this._emitEvent(AppEventFactory.recommendationDelivered(response, duration))

      return response
    } catch (err) {
      throw new FeedGenerationFailedError(
        `Failed to generate feed for request ${request.requestId}`,
        err,
      )
    }
  }

  /** Get collected events for external consumption */
  getEvents(): typeof this.events {
    return [...this.events]
  }

  /** Build domain context from request DTO */
  private _buildContext(request: RecommendationRequestDto): RecommendationContext {
    return RecommendationContext.create({
      userId: request.userId,
      timestamp: request.timestamp,
      experimentId: request.experimentId,
      variantId: request.variantId,
      sessionId: request.sessionId ?? `session_${request.requestId}`,
      activeProviderIds: (request.metadata?.['activeProviderIds'] as string[]) ?? [],
    })
  }

  /** Build deterministic cache key */
  private _buildCacheKey(request: RecommendationRequestDto): string {
    return [
      'recommendation',
      request.userId,
      request.feedType,
      request.experimentId,
      request.variantId,
    ].join(':')
  }

  private _emitEvent(event: ApplicationEvent): void {
    this.events.push(event)
  }
}
