// src/governance/registry/AdapterRegistry.ts — 适配器注册 (内部, PB8 预留)

export class AdapterRegistry {
  private adapters = new Map<string, unknown>()

  register<T>(name: string, adapter: T): boolean {
    if (this.adapters.has(name)) return false
    this.adapters.set(name, adapter)
    return true
  }

  get<T>(name: string): T | null { return (this.adapters.get(name) as T) ?? null }
  list(): string[] { return Array.from(this.adapters.keys()) }
  count(): number { return this.adapters.size }
  remove(name: string): boolean { return this.adapters.delete(name) }
  clear(): void { this.adapters.clear() }
}
