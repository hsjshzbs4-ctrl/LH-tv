// src/governance/audit/GovernanceAudit.ts — 统一治理审计

import { GovernanceRegistry } from '../registry'
import type { MetricsSnapshot } from '../contracts'

export class GovernanceAudit {
  static run(): { events: number; policies: number; certifications: number } {
    const reg = GovernanceRegistry.getInstance()
    return {
      events: reg.getEventRegistry().count(),
      policies: reg.getPolicyRegistry().count(),
      certifications: reg.getCertificationRegistry().count(),
    }
  }

  static collect(): MetricsSnapshot {
    return GovernanceRegistry.getInstance().snapshot()
  }

  static summarize(): string {
    const s = GovernanceAudit.collect()
    return `Policies: ${s.policies}, Audits: ${s.audits}, Violations: ${s.violations}`
  }
}
