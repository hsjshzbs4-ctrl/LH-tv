// src/governance/index.ts — Ecosystem Governance (PB7-S6) 统一入口
// PB7 最高治理层 — 唯一公开 API: GovernanceFacade

export { GovernanceFacade } from './facade'
export { GovernanceRegistry } from './registry'
export { GovernancePolicy, GovernancePipeline, CommunityPolicyAdapter, EnterprisePolicyAdapter, PermissionPolicyAdapter, MarketplacePolicy, type PipelineHook } from './policy'
export { CertificationManager, SignatureVerifier, TrustChain, type TrustChainInput, type TrustChainResult } from './certification'
export { GovernanceAudit, MetricsCollector, GovernanceReportGenerator } from './audit'
export { GovernanceEventBus, EventSubscriber, EventPublisher } from './event'
export { CloudAdapter, ClusterAdapter, SyncAdapter, TelemetryAdapter, AnalyticsAdapter } from './adapters'
export {
  CertificationLevel, isCertificationValid, meetsCertificationLevel,
  Priority, GovernanceEventType,
  type PipelineContext, type PipelineResult, type PipelineReport,
  type PolicyRule, type CertificationRecord, type GovernanceAuditEntry,
  type MetricsSnapshot, type MetricsDelta, type GovernanceReport, type ReportDiff,
  type GovernanceEvent, type EventListener,
  type CloudAdapter as ICloudAdapter,
  type ClusterAdapter as IClusterAdapter,
  type SyncAdapter as ISyncAdapter,
  type TelemetryAdapter as ITelemetryAdapter,
  type AnalyticsAdapter as IAnalyticsAdapter,
} from './contracts'
