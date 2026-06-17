// src/governance/registry/PolicyRegistry.ts — 策略注册 (内部, 仅 GovernanceRegistry 可访问)

import type { PolicyRule } from '../contracts'

export class PolicyRegistry {
  private rules = new Map<string, PolicyRule>()

  register(rule: PolicyRule): boolean {
    if (this.rules.has(rule.id)) return false
    this.rules.set(rule.id, rule)
    return true
  }

  get(id: string): PolicyRule | null { return this.rules.get(id) ?? null }
  list(): PolicyRule[] { return Array.from(this.rules.values()) }
  count(): number { return this.rules.size }
  remove(id: string): boolean { return this.rules.delete(id) }
  clear(): void { this.rules.clear() }
}
