// src/integration/index.ts — PB2-S2 Integration Layer barrel export

// Events
export { IntegrationEvent, integrationEvents } from './events/integrationEvents'

// Continue Watching
export {
  ContinueWatchingService,
  continueWatchingService,
  createResumeCard,
  shouldShowResume,
} from './continueWatching'
export type { ResumeCard } from './continueWatching'

// Progress Sync
export { ProgressSyncService } from './progress'

// Recommendation
export { RecommendationBridge, recommendationBridge, RecommendationCache } from './recommendation'

// Analytics
export { PlaybackAnalytics, playbackAnalytics } from './analytics'
export type { PlaybackAnalyticsSnapshot } from './analytics'
