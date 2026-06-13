// developer-platform/index.ts — P5.3 Developer Platform unified export

// Accounts
export { DeveloperAccountManager, developerAccountManager } from './accounts/DeveloperAccount'

// Publishing
export { PluginSubmissionService, pluginSubmissionService } from './publishing/PluginSubmissionService'

// Repository
export { PluginRegistry, pluginRegistry } from './repository-server/PluginRegistry'
export type { RegisteredPlugin, RegisteredVersion } from './repository-server/PluginRegistry'

// Review
export { PluginReviewService, pluginReviewService } from './review/PluginReviewService'

// Analytics
export { PluginAnalyticsService, pluginAnalyticsService } from './analytics/PluginAnalyticsService'

// Notifications
export { NotificationService, notificationService } from './notifications/NotificationService'

// Shared types
export type {
  DeveloperAccount, DeveloperProfile, DeveloperRole,
  PluginSubmission, PluginAnalytics, PluginRating,
  ReviewState, DeveloperNotification,
} from './shared/types'
