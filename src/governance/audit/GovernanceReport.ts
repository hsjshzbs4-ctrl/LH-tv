// src/governance/audit/GovernanceReport.ts — 治理报告
// PB7-S6: 支持 JSON/MD 导出 + compare(previous)→ReportDiff

import { MetricsCollector } from './MetricsCollector'
import { GovernanceRegistry } from '../registry'
import type { GovernanceReport, ReportDiff, MetricsDelta, MetricsSnapshot } from '../contracts'

export class GovernanceReportGenerator {
  static generate(): GovernanceReport {
    const reg = GovernanceRegistry.getInstance()
    const metrics = MetricsCollector.snapshot()

    return {
      timestamp: Date.now(),
      policyCount: reg.getPolicyRegistry().count(),
      violationCount: metrics.violations,
      certificationCount: reg.getCertificationRegistry().count(),
      marketplaceCount: 0,
      communityCount: 0,
      enterpriseCount: 0,
      permissionCount: metrics.permissions,
      auditCount: reg.getEventRegistry().count(),
      metrics,
      exportJSON(): string { return JSON.stringify(this, null, 2) },
      exportMarkdown(): string {
        return [
          '# Governance Report',
          `> ${new Date(this.timestamp).toISOString()}`,
          '',
          '| Metric | Value |',
          '|--------|-------|',
          `| Policies | ${this.policyCount} |`,
          `| Violations | ${this.violationCount} |`,
          `| Certifications | ${this.certificationCount} |`,
          `| Audits | ${this.auditCount} |`,
          `| Permissions | ${this.permissionCount} |`,
          '',
          '## Metrics',
          `- Installs: ${metrics.installs}`,
          `- Removes: ${metrics.removes}`,
          `- Updates: ${metrics.updates}`,
          `- Publishes: ${metrics.publishes}`,
        ].join('\n')
      },
    }
  }

  /** 比较两份报告 */
  static compare(previous: GovernanceReport, current: GovernanceReport): ReportDiff {
    const delta = (label: string, prev: number, curr: number): MetricsDelta => ({
      field: label, previous: prev, current: curr, delta: curr - prev,
    })

    return {
      policyDelta: [delta('Policies', previous.policyCount, current.policyCount)],
      certificationDelta: [delta('Certifications', previous.certificationCount, current.certificationCount)],
      violationDelta: [delta('Violations', previous.violationCount, current.violationCount)],
      metricsDelta: [
        delta('Installs', previous.metrics.installs, current.metrics.installs),
        delta('Removes', previous.metrics.removes, current.metrics.removes),
        delta('Updates', previous.metrics.updates, current.metrics.updates),
        delta('Publishes', previous.metrics.publishes, current.metrics.publishes),
        delta('Permissions', previous.metrics.permissions, current.metrics.permissions),
        delta('Audits', previous.metrics.audits, current.metrics.audits),
        delta('Policies', previous.metrics.policies, current.metrics.policies),
        delta('Violations', previous.metrics.violations, current.metrics.violations),
      ],
    }
  }
}
