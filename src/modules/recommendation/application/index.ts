// modules/recommendation/application/index.ts — CE9-B Barrel Export

// ─── DTOs ───
export type { RecommendationRequestDto, FeedType } from './dto/RecommendationRequestDto'
export { validateRecommendationRequest } from './dto/RecommendationRequestDto'
export type { RecommendationResponseDto } from './dto/RecommendationResponseDto'
export type { RecommendationItemDto, ScoreBreakdownDto, ReasonDto, SourceDto } from './dto/RecommendationItemDto'
export type { RecommendationFeedDto, FeedSectionDto, FeedMetadataDto, ExperimentInfoDto } from './dto/RecommendationFeedDto'

// ─── Ports ───
export type { IRecommendationAnalyticsPort } from './ports/IRecommendationAnalyticsPort'
export type { IRecommendationProfilePort } from './ports/IRecommendationProfilePort'
export type { IRecommendationCachePort } from './ports/IRecommendationCachePort'
export type { IRecommendationFeedbackPort } from './ports/IRecommendationFeedbackPort'

// ─── Errors ───
export {
  RecommendationApplicationError,
  RecommendationValidationError,
  ProfileNotFoundError,
  FeedGenerationFailedError,
  CacheReadFailedError,
  CacheWriteFailedError,
  TrackingFailedError,
  InsufficientDataError,
} from './errors/RecommendationErrors'

// ─── Events ───
export { ApplicationEventTypes, AppEventFactory } from './events/ApplicationEvents'
export type {
  ApplicationEventType,
  ApplicationEvent,
  RecommendationRequestedEvent,
  RecommendationDeliveredEvent,
  RecommendationCacheHitEvent,
  RecommendationCacheMissEvent,
  RecommendationTrackingRequestedEvent,
  RecommendationTrackingCompletedEvent,
} from './events/ApplicationEvents'

// ─── Mappers ───
export { FeedMapper } from './mappers/FeedMapper'
export { ItemMapper } from './mappers/ItemMapper'
export { ProfileMapper } from './mappers/ProfileMapper'
export type { ProfileDto, GenrePreferenceDto, PersonPreferenceDto, ContentTypePreferenceDto, YearPreferenceDto } from './mappers/ProfileMapper'

// ─── Orchestrator ───
export { RecommendationOrchestrator } from './orchestrators/RecommendationOrchestrator'
export type { OrchestratorDependencies } from './orchestrators/RecommendationOrchestrator'

// ─── Use Cases ───
export { GenerateRecommendationsUseCase } from './use-cases/GenerateRecommendationsUseCase'
export { GetPersonalizedFeedUseCase } from './use-cases/GetPersonalizedFeedUseCase'
export { GetTrendingFeedUseCase } from './use-cases/GetTrendingFeedUseCase'
export { GetContinueWatchingUseCase } from './use-cases/GetContinueWatchingUseCase'
export { GetSimilarContentUseCase } from './use-cases/GetSimilarContentUseCase'
export { TrackRecommendationClickUseCase } from './use-cases/TrackRecommendationClickUseCase'
export { TrackRecommendationConsumeUseCase } from './use-cases/TrackRecommendationConsumeUseCase'
export type { ConsumeAction, ConsumeParams } from './use-cases/TrackRecommendationConsumeUseCase'
