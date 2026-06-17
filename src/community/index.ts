// src/community/index.ts — Community Platform (PB7-S4) 统一入口
// PB7 COMMUNITY ERA Foundation

// ── Contracts (SSOT Types) ──
export {
  validateCommunityItem,
  type CommunityItemType,
  type CommunityItem,
  type Rating,
  type ModerationStatus,
  type Comment,
  type SharePlatform,
  type ShareTarget,
  type FeedQuery,
  type FeedEntry,
  type ReportStatus,
  type Report,
  type TemplateConfig,
  type CommunityItemValidationResult,
} from './contracts'

// ── Registry (SSOT) ──
export {
  CommunityRegistry,
  communityRegistry,
  type CommunityStats,
} from './registry'

// ── Governance ──
export {
  CommunityPolicy,
  CommunityAction,
  CommunityPermissionLevel,
} from './governance'

// ── Feed ──
export {
  FeedBuilder,
  FeedService,
  feedService,
} from './feed'

// ── Recommendation ──
export {
  CommunityRecommendation,
  communityRecommendation,
} from './recommendation'

// ── Sharing ──
export {
  ShareService,
  shareService,
} from './sharing'

// ── Template ──
export {
  TemplateRepository,
  templateRepository,
  type TemplateEntry,
} from './template'

// ── Moderation ──
export {
  ModerationService,
  moderationService,
  type ModerationResult,
  ReportService,
  reportService,
} from './moderation'
