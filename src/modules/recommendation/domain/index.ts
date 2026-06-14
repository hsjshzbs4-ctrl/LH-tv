// modules/recommendation/domain/index.ts — CE9-A Barrel Export

// ─── Entities ───
export { RecommendationFeed } from './entities/RecommendationFeed'
export type { FeedMetadata, SourceAttribution, ExperimentInfo, RecommendationFeedProps } from './entities/RecommendationFeed'

export { RecommendationSection } from './entities/RecommendationSection'
export type { SectionMetadata, RecommendationSectionProps } from './entities/RecommendationSection'

export { RecommendationItem } from './entities/RecommendationItem'
export type { RecommendationItemProps } from './entities/RecommendationItem'

export { RecommendationProfile } from './entities/RecommendationProfile'
export type {
  GenrePreference,
  PersonPreference,
  ContentTypePreference,
  YearPreference,
  RecommendationProfileProps,
} from './entities/RecommendationProfile'

export { RecommendationContext } from './entities/RecommendationContext'
export type { InteractionRecord, RecommendationContextProps } from './entities/RecommendationContext'

export { RecommendationSource } from './entities/RecommendationSource'
export type { SourceCategory, RecommendationSourceProps } from './entities/RecommendationSource'

// ─── Value Objects ───
export { RecommendationScore, DEFAULT_SCORE_WEIGHTS } from './value-objects/RecommendationScore'
export type { ScoreBreakdown, ScoreWeights, RecommendationScoreProps } from './value-objects/RecommendationScore'

export { RecommendationReason, REASON_TEMPLATES } from './value-objects/RecommendationReason'
export type { ReasonTemplate, RecommendationReasonProps } from './value-objects/RecommendationReason'

export type { RecommendationType } from './value-objects/RecommendationType'
export { RECOMMENDATION_TYPE_LABELS } from './value-objects/RecommendationType'

export { RecommendationWeight } from './value-objects/RecommendationWeight'
export type { RecommendationWeightProps } from './value-objects/RecommendationWeight'

export { DiversityConstraint } from './value-objects/DiversityConstraint'
export type { DiversityConstraintProps } from './value-objects/DiversityConstraint'

export type { SectionType } from './value-objects/SectionType'
export { SECTION_TYPE_ORDER, SECTION_TYPE_LABELS, sectionDisplayOrder } from './value-objects/SectionType'

// ─── Contracts ───
export type {
  IRecommendationProvider,
  EngineState,
  EngineHealth,
} from './contracts/IRecommendationProvider'

export type { IRecommendationRanker, RankingOptions } from './contracts/IRecommendationRanker'

export type { IRecommendationGenerator, FeedGenerationOptions } from './contracts/IRecommendationGenerator'

export type {
  AIRecommendationProvider,
  AIModelProvider,
  AIModelConfig,
  AIModelCapabilities,
  AIRecommendationResult,
} from './contracts/AIRecommendationProvider'

// ─── Services ───
export { RecommendationScoringService } from './services/RecommendationScoringService'
export type { ScoringInput } from './services/RecommendationScoringService'

export { RecommendationRankingService } from './services/RecommendationRankingService'

export { RecommendationDiversificationService } from './services/RecommendationDiversificationService'
export type {
  DiversificationResult,
  DiversificationViolation,
  FranchiseExtractor,
} from './services/RecommendationDiversificationService'

export { RecommendationReasonGenerator } from './services/RecommendationReasonGenerator'
export type { ReasonContext } from './services/RecommendationReasonGenerator'

export { FeedAssemblyService } from './services/FeedAssemblyService'
export type { FeedAssemblyInput } from './services/FeedAssemblyService'

// ─── Events ───
export {
  RecommendationEventTypes,
  RecommendationEventFactory,
} from './events/DomainEvents'

export type {
  RecommendationEventType,
  RecommendationEvent,
  RecommendationsGeneratedEvent,
  ProfileUpdatedEvent,
  RecommendationImpressionEvent,
  RecommendationClickedEvent,
  RecommendationPlayedEvent,
  RecommendationFavoritedEvent,
  RecommendationDismissedEvent,
  RecommendationHiddenEvent,
  RecommendationWatchCompleteEvent,
} from './events/DomainEvents'
