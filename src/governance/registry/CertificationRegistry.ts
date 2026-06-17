// src/governance/registry/CertificationRegistry.ts — 认证注册 (内部)

import type { CertificationRecord } from '../contracts'

export class CertificationRegistry {
  private records = new Map<string, CertificationRecord>()

  register(record: CertificationRecord): boolean {
    if (this.records.has(record.id)) return false
    this.records.set(record.id, record)
    return true
  }

  get(id: string): CertificationRecord | null { return this.records.get(id) ?? null }
  list(): CertificationRecord[] { return Array.from(this.records.values()) }
  count(): number { return this.records.size }
  remove(id: string): boolean { return this.records.delete(id) }
  clear(): void { this.records.clear() }
}
