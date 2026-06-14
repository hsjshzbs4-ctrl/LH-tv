// modules/recommendation/domain/events/DomainEvents.ts — CE9-A
// 8 domain event types + EventFactory. (Req 9 — Telemetry First)

import type { RecommendationContext } from '../entities/RecommendationContext'
import type { RecommendationFeed } from '../entities/RecommendationFeed'

// ─── Event Type Constants ───

export const RecommendationEventTypes = {
  GENERATED: 'recommendations:generated' as const,
  PROFILE_UPDATED: 'recommendations:profile-updated' as const,
  IMPRESSION: 'recommendations:impression' as const,
  CLICKED: 'recommendations:clicked' as const,
  PLAYED: 'recommendations:played' as const,
  FAVORITED: 'recommendations:favorited' as const,
  DISMISSED: 'recommendations:dismissed' as const,
  HIDDEN: 'recommendations:hidden' as const,
  WATCH_COMPLETE: 'recommendations:watch-complete' as const,
} as const

export type RecommendationEventType = typeof RecommendationEventTypes[keyof typeof RecommendationEventTypes]

// ─── System Events ───

export interface RecommendationsGeneratedEvent {
  readonly type: typeof RecommendationEventTypes.GENERATED
  readonly feedId: string
  readonly context: RecommendationContext
  readonly sectionCount: number
  readonly totalItems: number
  readonly generationTimeMs: number
  readonly activeEngines: string[]
  readonly cacheHit: boolean
  readonly timestamp: number
}

export interface ProfileUpdatedEvent {
  readonly type: typeof RecommendationEventTypes.PROFILE_UPDATED
  readonly profileId: string
  readonly dataPoints: number
  readonly topGenres: string[]
  readonly preferredTypes: string[]
  readonly timestamp: number
}

// ─── User Interaction Events (Telemetry — Req 9) ───

export interface RecommendationImpressionEvent {
  readonly type: typeof RecommendationEventTypes.IMPRESSION
  readonly feedId: string
  readonly sectionId: string
  readonly items: string[]
  readonly context: RecommendationContext
  readonly timestamp: number
}

export interface RecommendationClickedEvent {
  readonly type: typeof RecommendationEventTypes.CLICKED
  readonly feedId: string
  readonly sectionId: string
  readonly mediaId: string
  readonly position: number
  readonly context: RecommendationContext
  readonly timestamp: number
}

export interface RecommendationPlayedEvent {
  readonly type: typeof RecommendationEventTypes.PLAYED
  readonly feedId: string
  readonly mediaId: string
  readonly sourceId: string
  readonly context: RecommendationContext
  readonly timestamp: number
}

export interface RecommendationFavoritedEvent {
  readonly type: typeof RecommendationEventTypes.FAVORITED
  readonly feedId: string
  readonly mediaId: string
  readonly context: RecommendationContext
  readonly timestamp: number
}

// ─── Feedback Events ───

export interface RecommendationDismissedEvent {
  readonly type: typeof RecommendationEventTypes.DISMISSED
  readonly feedId: string
  readonly sectionId: string
  readonly mediaId: string
  readonly reason: 'not-interested' | 'already-watched' | 'dislike' | 'other'
  readonly context: RecommendationContext
  readonly timestamp: number
}

export interface RecommendationHiddenEvent {
  readonly type: typeof RecommendationEventTypes.HIDDEN
  readonly feedId: string
  readonly sectionId: string
  readonly context: RecommendationContext
  readonly timestamp: number
}

export interface RecommendationWatchCompleteEvent {
  readonly type: typeof RecommendationEventTypes.WATCH_COMPLETE
  readonly feedId: string
  readonly mediaId: string
  readonly watchedDuration: number
  readonly totalDuration: number
  readonly context: RecommendationContext
  readonly timestamp: number
}

// ─── Union Type ───

export type RecommendationEvent =
  | RecommendationsGeneratedEvent
  | ProfileUpdatedEvent
  | RecommendationImpressionEvent
  | RecommendationClickedEvent
  | RecommendationPlayedEvent
  | RecommendationFavoritedEvent
  | RecommendationDismissedEvent
  | RecommendationHiddenEvent
  | RecommendationWatchCompleteEvent

// ─── EventFactory ───

export class RecommendationEventFactory {
  /** After a feed is generated */
  static recommendationsGenerated(
    feed: RecommendationFeed,
    generationTimeMs: number,
    cacheHit: boolean,
  ): RecommendationsGeneratedEvent {
    return {
      type: RecommendationEventTypes.GENERATED,
      feedId: feed.feedId,
      context: feed.context,
      sectionCount: feed.sections.length,
      totalItems: feed.totalItems,
      generationTimeMs,
      activeEngines: feed.activeEngines,
      cacheHit,
      timestamp: Date.now(),
    }
  }

  /** When user profile is rebuilt */
  static profileUpdated(
    profileId: string,
    dataPoints: number,
    topGenres: string[],
    preferredTypes: string[],
  ): ProfileUpdatedEvent {
    return {
      type: RecommendationEventTypes.PROFILE_UPDATED,
      profileId,
      dataPoints,
      topGenres,
      preferredTypes,
      timestamp: Date.now(),
    }
  }

  /** When recommendations are displayed to user */
  static impression(
    feedId: string,
    sectionId: string,
    items: string[],
    context: RecommendationContext,
  ): RecommendationImpressionEvent {
    return {
      type: RecommendationEventTypes.IMPRESSION,
      feedId,
      sectionId,
      items,
      context,
      timestamp: Date.now(),
    }
  }

  /** User clicks a recommendation */
  static clicked(
    feedId: string,
    sectionId: string,
    mediaId: string,
    position: number,
    context: RecommendationContext,
  ): RecommendationClickedEvent {
    return {
      type: RecommendationEventTypes.CLICKED,
      feedId,
      sectionId,
      mediaId,
      position,
      context,
      timestamp: Date.now(),
    }
  }

  /** User plays recommended content */
  static played(
    feedId: string,
    mediaId: string,
    sourceId: string,
    context: RecommendationContext,
  ): RecommendationPlayedEvent {
    return {
      type: RecommendationEventTypes.PLAYED,
      feedId,
      mediaId,
      sourceId,
      context,
      timestamp: Date.now(),
    }
  }

  /** User favorites recommended content */
  static favorited(
    feedId: string,
    mediaId: string,
    context: RecommendationContext,
  ): RecommendationFavoritedEvent {
    return {
      type: RecommendationEventTypes.FAVORITED,
      feedId,
      mediaId,
      context,
      timestamp: Date.now(),
    }
  }

  /** User dismisses a recommendation */
  static dismissed(
    feedId: string,
    sectionId: string,
    mediaId: string,
    reason: 'not-interested' | 'already-watched' | 'dislike' | 'other',
    context: RecommendationContext,
  ): RecommendationDismissedEvent {
    return {
      type: RecommendationEventTypes.DISMISSED,
      feedId,
      sectionId,
      mediaId,
      reason,
      context,
      timestamp: Date.now(),
    }
  }

  /** User hides an entire section */
  static hidden(
    feedId: string,
    sectionId: string,
    context: RecommendationContext,
  ): RecommendationHiddenEvent {
    return {
      type: RecommendationEventTypes.HIDDEN,
      feedId,
      sectionId,
      context,
      timestamp: Date.now(),
    }
  }

  /** User completes watching recommended content */
  static watchComplete(
    feedId: string,
    mediaId: string,
    watchedDuration: number,
    totalDuration: number,
    context: RecommendationContext,
  ): RecommendationWatchCompleteEvent {
    return {
      type: RecommendationEventTypes.WATCH_COMPLETE,
      feedId,
      mediaId,
      watchedDuration,
      totalDuration,
      context,
      timestamp: Date.now(),
    }
  }
}
