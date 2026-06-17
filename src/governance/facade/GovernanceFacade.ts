// src/governance/facade/GovernanceFacade.ts — 唯一公开 API
// PB7-S6: 所有模块只能通过此 Facade 访问 Governance
// 禁止直接 import GovernanceRegistry/PolicyRegistry/CertificationRegistry

import { GovernancePolicy } from '../policy/GovernancePolicy'
import { CertificationManager } from '../certification/CertificationManager'
import { TrustChain } from '../certification/TrustChain'
import { SignatureVerifier } from '../certification/SignatureVerifier'
import { GovernanceAudit } from '../audit/GovernanceAudit'
import { MetricsCollector } from '../audit/MetricsCollector'
import { GovernanceReportGenerator } from '../audit/GovernanceReport'
import { EventPublisher } from '../event/EventPublisher'
import { EventSubscriber } from '../event/EventSubscriber'
import { GovernanceRegistry } from '../registry'
import { GovernanceEventType, Priority } from '../contracts'
import type {
  PipelineContext, PipelineReport, MetricsSnapshot,
  GovernanceReport, ReportDiff, CertificationRecord,
} from '../contracts'
import type { TrustChainInput, TrustChainResult } from '../certification/TrustChain'
import type { EventListener } from '../contracts'

export class GovernanceFacade {
  // ── Pipeline ──
  static executePipeline(ctx: PipelineContext): PipelineReport {
    return GovernancePolicy.executePipeline(ctx)
  }
  static batchExecute(contexts: PipelineContext[]): PipelineReport[] {
    return GovernancePolicy.batchExecute(contexts)
  }
  static batchValidate(contexts: PipelineContext[]): PipelineReport[] {
    return contexts.map((ctx) => GovernancePolicy.executePipeline(ctx))
  }
  static batchAuthorize(contexts: PipelineContext[]): PipelineReport[] {
    return contexts.map((ctx) => GovernancePolicy.executePipeline(ctx))
  }
  static batchAudit(contexts: PipelineContext[]): PipelineReport[] {
    return contexts.map((ctx) => GovernancePolicy.executePipeline(ctx))
  }
  static batchReport(contexts: PipelineContext[]): PipelineReport[] {
    return contexts.map((ctx) => GovernancePolicy.executePipeline(ctx))
  }
  static batchCertify(inputs: Array<{ ctx: PipelineContext; pkgId: string; pubId: string; level: any; hash: string; rtVer: string }>): PipelineReport[] {
    return inputs.map(({ ctx, pkgId, pubId, level, hash, rtVer }) => {
      CertificationManager.issue(pkgId, pubId, level, hash, rtVer)
      return GovernancePolicy.executePipeline(ctx)
    })
  }

  // ── Certification ──
  static issueCertification(packageId: string, publisherId: string, level: any, manifestHash: string, runtimeVersion: string): CertificationRecord {
    return CertificationManager.issue(packageId, publisherId, level, manifestHash, runtimeVersion)
  }
  static revokeCertification(packageId: string): boolean { return CertificationManager.revoke(packageId) }
  static verifyCertification(packageId: string) { return CertificationManager.verify(packageId) }
  static listCertifications() { return CertificationManager.list() }

  // ── TrustChain ──
  static verifyTrustChain(input: TrustChainInput): TrustChainResult { return TrustChain.verify(input) }
  static verifyPackage(packageId: string, manifestHash: string, publisherId: string, signature: string) {
    return SignatureVerifier.verifyPackage(packageId, manifestHash, publisherId, signature)
  }

  // ── Audit ──
  static runAudit() { return GovernanceAudit.run() }
  static collectMetrics(): MetricsSnapshot { return MetricsCollector.snapshot() }
  static generateReport(): GovernanceReport { return GovernanceReportGenerator.generate() }
  static compareReports(prev: GovernanceReport, curr: GovernanceReport): ReportDiff {
    return GovernanceReportGenerator.compare(prev, curr)
  }

  // ── Metrics ──
  static snapshotTenant(tenantId: string): MetricsSnapshot { return MetricsCollector.snapshotTenant(tenantId) }
  static exportTenant(tenantId: string): MetricsSnapshot { return MetricsCollector.exportTenant(tenantId) }
  static clearTenant(tenantId: string): void { MetricsCollector.clearTenant(tenantId) }

  // ── EventBus ──
  static subscribe(type: GovernanceEventType, listener: EventListener, priority = Priority.NORMAL): () => void {
    return EventSubscriber.on(type, listener, priority)
  }
  static publish(type: GovernanceEventType, source: string, payload: Record<string, unknown> = {}, priority = Priority.NORMAL): void {
    EventPublisher.publish(type, source, payload, priority)
  }

  // ── Registry (read-only access) ──
  static getRegistry(): GovernanceRegistry { return GovernanceRegistry.getInstance() }
}
