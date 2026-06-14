// modules/recommendation/runtime/index.ts — CE9-C Barrel Export

// ─── Providers ───
export { LocalRecommendationProvider } from './providers/LocalRecommendationProvider'
export { TrendingRecommendationProvider } from './providers/TrendingRecommendationProvider'
export type { TrendingSignal } from './providers/TrendingRecommendationProvider'
export { PersonalizedRecommendationProvider } from './providers/PersonalizedRecommendationProvider'
export type { CandidateContent } from './providers/PersonalizedRecommendationProvider'
export { SimilarContentRecommendationProvider } from './providers/SimilarContentRecommendationProvider'
export type { SimilarContentRequest, SimilarContentCandidate } from './providers/SimilarContentRecommendationProvider'
export { AIRecommendationProvider } from './providers/AIRecommendationProvider'

// ─── Generators ───
export { FeedGenerator } from './generators/FeedGenerator'
export type { FeedGeneratorConfig } from './generators/FeedGenerator'

// ─── Ranking ───
export { ScoreNormalizer } from './ranking/ScoreNormalizer'
export { ScoreSortStage, DiversityInterleaveStage, NoveltyBoostStage } from './ranking/RankingStage'
export type { RankingStage } from './ranking/RankingStage'
export { RankingPipeline } from './ranking/RankingPipeline'
export { RankingStrategyRegistry } from './ranking/RankingStrategyRegistry'
export type { PresetName } from './ranking/RankingStrategyRegistry'

// ─── Diversification ───
export { GenreDiversifier } from './diversification/GenreDiversifier'
export { FranchiseDiversifier } from './diversification/FranchiseDiversifier'
export type { FranchiseResolver } from './diversification/FranchiseDiversifier'
export { DiversityPipeline } from './diversification/DiversityPipeline'
export type { DiversityConfig, DiversityResult } from './diversification/DiversityPipeline'

// ─── Cold Start ───
export { ColdStartEngine } from './cold-start/ColdStartEngine'
export type { ColdStartStrategy, ColdStartItem } from './cold-start/ColdStartEngine'

// ─── Cache ───
export { FeedCache } from './cache/FeedCache'

// ─── Telemetry ───
export { TelemetryCollector } from './telemetry/TelemetryCollector'
export type { TelemetryEventType, TelemetryEvent, FlushHandler } from './telemetry/TelemetryCollector'

// ─── Experiments ───
export { ExperimentEngine } from './experiments/ExperimentEngine'
export type {
  Experiment, ExperimentVariant, ExperimentAssignment,
} from './experiments/ExperimentEngine'

// ─── Explanations ───
export { RecommendationExplanationEngine } from './explanations/RecommendationExplanationEngine'
export type { ExplanationInput } from './explanations/RecommendationExplanationEngine'

// ─── Snapshots ───
export { RecommendationSnapshotService } from './snapshots/RecommendationSnapshotService'
export type { RecommendationSnapshot } from './snapshots/RecommendationSnapshotService'

// ─── Metrics ───
export { RuntimeMetrics } from './metrics/RuntimeMetrics'
export type { RuntimeMetricsSnapshot } from './metrics/RuntimeMetrics'

// ─── Health ───
export { RuntimeHealthService } from './health/RuntimeHealthService'
export type { RuntimeHealthSnapshot } from './health/RuntimeHealthService'
