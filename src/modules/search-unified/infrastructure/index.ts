// modules/search-unified/infrastructure/index.ts — CE8-C1 Infrastructure barrel export

// ─── Provider Adapters ───
export { LocalSearchProviderAdapter } from './providers/LocalSearchProviderAdapter'
export { TMDBSearchProviderAdapter } from './providers/TMDBSearchProviderAdapter'
export { JellyfinSearchProviderAdapter } from './providers/JellyfinSearchProviderAdapter'
export { PlexSearchProviderAdapter } from './providers/PlexSearchProviderAdapter'
export { EmbySearchProviderAdapter } from './providers/EmbySearchProviderAdapter'

// ─── Mapper ───
export { SearchDocumentMapper } from './mappers/SearchDocumentMapper'
export type { RawDocumentInput } from './mappers/SearchDocumentMapper'

// ─── Cache ───
export { SearchProviderCache } from './cache/SearchProviderCache'

// ─── Client Wrapper ───
export { ProviderClientWrapper } from './adapters/ProviderClientWrapper'
export type { RetryConfig } from './adapters/ProviderClientWrapper'

// ─── Metrics ───
export { SearchProviderMetrics } from './metrics/SearchProviderMetrics'
export type { ProviderMetric, ProviderStats } from './metrics/SearchProviderMetrics'

// ─── Services (CE8-C2) ───
export { SearchProviderRegistry } from './services/SearchProviderRegistry'
export { UnifiedSearchRuntime } from './services/UnifiedSearchRuntime'
export { SuggestionEngine } from './services/SuggestionEngine'
export { SearchAnalyticsRuntime } from './services/SearchAnalyticsRuntime'
export { SearchMetricsAggregator } from './services/SearchMetricsAggregator'
export { SearchHealthMonitor } from './services/SearchHealthMonitor'
export { ProviderPriorityManager } from './services/ProviderPriorityManager'
export { InfrastructureDiagnostics } from './services/InfrastructureDiagnostics'
export { DEFAULT_CONFIG } from './services/SearchInfrastructureConfig'
export type { SearchInfrastructureConfig } from './services/SearchInfrastructureConfig'
export type { SuggestionSource } from './services/SuggestionEngine'
export type { ProviderExecutionResult, SearchExecutionResult } from './services/UnifiedSearchRuntime'
export type { AggregatedMetrics } from './services/SearchMetricsAggregator'
export type { HealthStatus, ProviderHealthState } from './services/SearchHealthMonitor'
export type { DiagnosticsSnapshot, ProviderDiagnostic, HealthDiagnostic, MetricsDiagnostic } from './services/InfrastructureDiagnostics'

// ─── Storage (CE8-C3) ───
export { SearchAnalyticsStore } from './storage/stores/SearchAnalyticsStore'
export { SearchHistoryStore } from './storage/stores/SearchHistoryStore'
export { SearchTrendStore } from './storage/stores/SearchTrendStore'
export { ProviderUsageStore } from './storage/stores/ProviderUsageStore'
export { SuggestionUsageStore } from './storage/stores/SuggestionUsageStore'
export { AnalyticsAggregationService } from './storage/aggregation/AnalyticsAggregationService'
export { UserSearchProfileGenerator } from './storage/profile/UserSearchProfile'
export { AnalyticsReportGenerator } from './storage/reporting/AnalyticsReportGenerator'
export { AnalyticsRetentionService } from './storage/retention/AnalyticsRetentionService'
export type { AnalyticsQueryOptions } from './storage/stores/SearchAnalyticsStore'
export type { AggregatedSummary, AggregationPeriod } from './storage/aggregation/AnalyticsAggregationService'
export type { UserSearchProfile } from './storage/profile/UserSearchProfile'
export type { AnalyticsReport } from './storage/reporting/AnalyticsReportGenerator'
export type { SearchAnalyticsRecord, AnalyticsEventType as StorageEventType } from './storage/models/SearchAnalyticsRecord'
export type { SearchHistoryEntry } from './storage/models/SearchHistoryEntry'
export type { SearchTrendEntry } from './storage/models/SearchTrendEntry'
export type { ProviderUsageEntry } from './storage/models/ProviderUsageEntry'
export type { SuggestionUsageEntry } from './storage/models/SuggestionUsageEntry'
