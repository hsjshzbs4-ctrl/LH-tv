// src/governance/contracts/GovernanceTypes.ts — 治理类型定义 (唯一 SSOT)
// PB7-S6: 统一所有治理层类型, 禁止模块自行定义

import type { CertificationLevel } from './CertificationLevel'

// ── Priority ──

export enum Priority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

// ── Pipeline ──

export interface PipelineContext {
  moduleId: string
  action: string
  userId?: string
  tenantId?: string
  payload: Record<string, unknown>
}

export interface PipelineStage {
  name: string
  execute(ctx: PipelineContext): PipelineResult
}

export interface PipelineResult {
  passed: boolean
  stage: string
  reason?: string
  data?: Record<string, unknown>
}

export interface PipelineReport {
  ctx: PipelineContext
  stages: PipelineResult[]
  passed: boolean
  timestamp: number
}

// ── Policy ──

export interface PolicyRule {
  id: string
  name: string
  description: string
  module: string
  action: string
  enabled: boolean
}

export interface PolicyCheckResult {
  passed: boolean
  ruleId: string
  reason?: string
}

// ── Certification ──

export interface CertificationRecord {
  id: string
  packageId: string
  publisherId: string
  level: CertificationLevel
  manifestHash: string
  runtimeVersion: string
  issuedAt: number
  revokedAt?: number
}

// ── Audit ──

export interface GovernanceAuditEntry {
  id: string
  event: GovernanceEventType
  module: string
  userId?: string
  tenantId?: string
  detail: string
  timestamp: number
}

export enum GovernanceEventType {
  POLICY = 'policy',
  CERTIFICATION = 'certification',
  AUDIT = 'audit',
  PERMISSION = 'permission',
  MARKETPLACE = 'marketplace',
  COMMUNITY = 'community',
  ENTERPRISE = 'enterprise',
  INSTALL = 'install',
  REMOVE = 'remove',
  UPDATE = 'update',
}

// ── Metrics ──

export interface MetricsSnapshot {
  installs: number
  removes: number
  updates: number
  publishes: number
  permissions: number
  policies: number
  audits: number
  violations: number
  tenantId?: string
  timestamp: number
}

export interface MetricsDelta {
  field: string
  previous: number
  current: number
  delta: number
}

// ── Report ──

export interface GovernanceReport {
  timestamp: number
  policyCount: number
  violationCount: number
  certificationCount: number
  marketplaceCount: number
  communityCount: number
  enterpriseCount: number
  permissionCount: number
  auditCount: number
  metrics: MetricsSnapshot
  exportJSON(): string
  exportMarkdown(): string
}

export interface ReportDiff {
  policyDelta: MetricsDelta[]
  certificationDelta: MetricsDelta[]
  violationDelta: MetricsDelta[]
  metricsDelta: MetricsDelta[]
}

// ── Cloud Adapters (PB8 Stateless Stubs) ──

export interface CloudAdapter {
  connect(config: Record<string, unknown>): Promise<boolean>
  disconnect(): Promise<void>
  sync(data: unknown): Promise<unknown>
  push(data: unknown): Promise<boolean>
  pull(query: unknown): Promise<unknown>
}

export interface ClusterAdapter {
  join(cluster: unknown): Promise<boolean>
  leave(): Promise<void>
  elect(): Promise<string>
  health(): Promise<Record<string, boolean>>
}

export interface SyncAdapter {
  replicate(from: string, to: string): Promise<boolean>
  conflict(local: unknown, remote: unknown): Promise<unknown>
  merge(base: unknown, theirs: unknown, mine: unknown): Promise<unknown>
  resolve(conflict: unknown): Promise<unknown>
}

export interface TelemetryAdapter {
  track(event: string, data: Record<string, unknown>): void
  metric(name: string, value: number): void
  diagnose(): Promise<string[]>
  alert(severity: string, message: string): void
}

export interface AnalyticsAdapter {
  collect(event: string, data: Record<string, unknown>): void
  aggregate(pipeline: unknown[]): Promise<unknown>
  analyze(query: unknown): Promise<unknown>
  predict(model: string, input: unknown): Promise<unknown>
}
