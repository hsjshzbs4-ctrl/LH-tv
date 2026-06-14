// modules/recommendation/application/events/ApplicationEvents.ts — CE9-B
// Application-level events. NOT domain events — these are about the application execution layer.

import type { RecommendationRequestDto } from '../dto/RecommendationRequestDto'
import type { RecommendationResponseDto } from '../dto/RecommendationResponseDto'

// ─── Event Type Constants ───

export const ApplicationEventTypes = {
  RECOMMENDATION_REQUESTED: 'app:recommendation:requested' as const,
  RECOMMENDATION_DELIVERED: 'app:recommendation:delivered' as const,
  RECOMMENDATION_CACHE_HIT: 'app:recommendation:cache-hit' as const,
  RECOMMENDATION_CACHE_MISS: 'app:recommendation:cache-miss' as const,
  RECOMMENDATION_TRACKING_REQUESTED: 'app:recommendation:tracking-requested' as const,
  RECOMMENDATION_TRACKING_COMPLETED: 'app:recommendation:tracking-completed' as const,
} as const

export type ApplicationEventType = typeof ApplicationEventTypes[keyof typeof ApplicationEventTypes]

// ─── Event Interfaces ───

export interface RecommendationRequestedEvent {
  readonly type: typeof ApplicationEventTypes.RECOMMENDATION_REQUESTED
  readonly request: RecommendationRequestDto
  readonly timestamp: number
}

export interface RecommendationDeliveredEvent {
  readonly type: typeof ApplicationEventTypes.RECOMMENDATION_DELIVERED
  readonly response: RecommendationResponseDto
  readonly duration: number
  readonly timestamp: number
}

export interface RecommendationCacheHitEvent {
  readonly type: typeof ApplicationEventTypes.RECOMMENDATION_CACHE_HIT
  readonly requestId: string
  readonly cacheKey: string
  readonly timestamp: number
}

export interface RecommendationCacheMissEvent {
  readonly type: typeof ApplicationEventTypes.RECOMMENDATION_CACHE_MISS
  readonly requestId: string
  readonly cacheKey: string
  readonly timestamp: number
}

export interface RecommendationTrackingRequestedEvent {
  readonly type: typeof ApplicationEventTypes.RECOMMENDATION_TRACKING_REQUESTED
  readonly action: string
  readonly mediaId: string
  readonly timestamp: number
}

export interface RecommendationTrackingCompletedEvent {
  readonly type: typeof ApplicationEventTypes.RECOMMENDATION_TRACKING_COMPLETED
  readonly action: string
  readonly mediaId: string
  readonly success: boolean
  readonly timestamp: number
}

// ─── Union Type ───

export type ApplicationEvent =
  | RecommendationRequestedEvent
  | RecommendationDeliveredEvent
  | RecommendationCacheHitEvent
  | RecommendationCacheMissEvent
  | RecommendationTrackingRequestedEvent
  | RecommendationTrackingCompletedEvent

// ─── EventFactory ───

export class AppEventFactory {
  static recommendationRequested(request: RecommendationRequestDto): RecommendationRequestedEvent {
    return {
      type: ApplicationEventTypes.RECOMMENDATION_REQUESTED,
      request,
      timestamp: Date.now(),
    }
  }

  static recommendationDelivered(
    response: RecommendationResponseDto,
    duration: number,
  ): RecommendationDeliveredEvent {
    return {
      type: ApplicationEventTypes.RECOMMENDATION_DELIVERED,
      response,
      duration,
      timestamp: Date.now(),
    }
  }

  static cacheHit(requestId: string, cacheKey: string): RecommendationCacheHitEvent {
    return {
      type: ApplicationEventTypes.RECOMMENDATION_CACHE_HIT,
      requestId,
      cacheKey,
      timestamp: Date.now(),
    }
  }

  static cacheMiss(requestId: string, cacheKey: string): RecommendationCacheMissEvent {
    return {
      type: ApplicationEventTypes.RECOMMENDATION_CACHE_MISS,
      requestId,
      cacheKey,
      timestamp: Date.now(),
    }
  }

  static trackingRequested(action: string, mediaId: string): RecommendationTrackingRequestedEvent {
    return {
      type: ApplicationEventTypes.RECOMMENDATION_TRACKING_REQUESTED,
      action,
      mediaId,
      timestamp: Date.now(),
    }
  }

  static trackingCompleted(
    action: string,
    mediaId: string,
    success: boolean,
  ): RecommendationTrackingCompletedEvent {
    return {
      type: ApplicationEventTypes.RECOMMENDATION_TRACKING_COMPLETED,
      action,
      mediaId,
      success,
      timestamp: Date.now(),
    }
  }
}
