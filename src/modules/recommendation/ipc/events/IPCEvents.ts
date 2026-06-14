// modules/recommendation/ipc/events/IPCEvents.ts — CE9-E

export const IPCEventTypes = {
  FEED_GENERATED: 'recommendation:feed-generated',
  FEED_REFRESHED: 'recommendation:feed-refreshed',
  RECOMMENDATION_CLICKED: 'recommendation:clicked',
  RECOMMENDATION_CONSUMED: 'recommendation:consumed',
  HEALTH_CHANGED: 'recommendation:health-changed',
} as const

export type IPCEventType = typeof IPCEventTypes[keyof typeof IPCEventTypes]

export interface FeedGeneratedEvent { type: 'recommendation:feed-generated'; feedId: string; timestamp: number }
export interface FeedRefreshedEvent { type: 'recommendation:feed-refreshed'; feedId: string; timestamp: number }
export interface RecommendationClickedEvent { type: 'recommendation:clicked'; mediaId: string; timestamp: number }
export interface RecommendationConsumedEvent { type: 'recommendation:consumed'; mediaId: string; action: string; timestamp: number }
export interface HealthChangedEvent { type: 'recommendation:health-changed'; status: string; timestamp: number }

export type IPCEvent = FeedGeneratedEvent | FeedRefreshedEvent | RecommendationClickedEvent | RecommendationConsumedEvent | HealthChangedEvent
