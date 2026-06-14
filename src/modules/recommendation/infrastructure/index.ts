// modules/recommendation/infrastructure/index.ts — CE9-D Barrel Export

// ─── Storage ───
export type { IStorageAdapter } from './storage/IStorageAdapter'
export { InMemoryStorageAdapter } from './storage/IStorageAdapter'

// ─── Providers ───
export { JellyfinRecommendationAdapter } from './providers/JellyfinRecommendationAdapter'
export { PlexRecommendationAdapter } from './providers/PlexRecommendationAdapter'
export { EmbyRecommendationAdapter } from './providers/EmbyRecommendationAdapter'
export { TMDBRecommendationAdapter } from './providers/TMDBRecommendationAdapter'

// ─── Repositories ───
export { RecommendationRepository } from './repositories/RecommendationRepository'
export type { IRecommendationRepository, StoredFeed } from './repositories/RecommendationRepository'
export { AnalyticsRepository } from './repositories/AnalyticsRepository'
export type { IAnalyticsRepository, AnalyticsRecord, AnalyticsQuery } from './repositories/AnalyticsRepository'
export { SnapshotRepository } from './repositories/SnapshotRepository'
export type { ISnapshotRepository } from './repositories/SnapshotRepository'
export { ExperimentRepository } from './repositories/ExperimentRepository'
export type { IExperimentRepository, AssignmentRecord } from './repositories/ExperimentRepository'
export { ProfileRepository } from './repositories/ProfileRepository'
export type { IProfileRepository } from './repositories/ProfileRepository'

// ─── Similarity ───
export type { ISimilarityService, SimilarityResult } from './similarity/ISimilarityService'
export { MetadataSimilarityService } from './similarity/MetadataSimilarityService'
export type { MetadataRecord } from './similarity/MetadataSimilarityService'
export { EmbeddingSimilarityService } from './similarity/EmbeddingSimilarityService'

// ─── Analytics ───
export { AnalyticsPersistence } from './analytics/AnalyticsPersistence'
export type { AnalyticsStats } from './analytics/AnalyticsPersistence'

// ─── Cache ───
export { FeedCachePersistence } from './cache/FeedCachePersistence'

// ─── Telemetry ───
export { TelemetryPersistence } from './telemetry/TelemetryPersistence'

// ─── Experiments ───
export { ExperimentPersistence } from './experiments/ExperimentPersistence'

// ─── Health ───
export { InfrastructureHealthService } from './health/InfrastructureHealthService'
export type { HealthStatus, ComponentHealth, InfrastructureHealthReport } from './health/InfrastructureHealthService'

// ─── Serialization ───
export { FeedSerializer } from './serialization/FeedSerializer'
export { SnapshotSerializer } from './serialization/SnapshotSerializer'
export { ProfileSerializer } from './serialization/ProfileSerializer'

// ─── Mappers ───
export { RecommendationEntityMapper } from './mappers/RecommendationEntityMapper'
export type { StoredItem } from './mappers/RecommendationEntityMapper'
export { AnalyticsMapper } from './mappers/AnalyticsMapper'
export { SnapshotMapper } from './mappers/SnapshotMapper'
export type { StoredSnapshot } from './mappers/SnapshotMapper'
export { ExperimentMapper } from './mappers/ExperimentMapper'
export type { StoredExperiment } from './mappers/ExperimentMapper'
