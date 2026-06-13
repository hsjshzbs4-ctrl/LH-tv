// src/core/providers/registry/ProviderRegistry.ts - Provider 注册中心

import type { IProvider } from '../types/provider.types'
import type { ProviderHealth } from '../types/provider.types'

export class ProviderRegistry {
  private providers = new Map<string, IProvider>()
  private healthCache = new Map<string, ProviderHealth>()
  private healthTimer: ReturnType<typeof setInterval> | null = null

  // ==================== 注册/注销 ====================

  register(provider: IProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`[Registry] Provider "${provider.id}" 已存在，将被覆盖`)
    }
    this.providers.set(provider.id, provider)
    console.log(`[Registry] 已注册: ${provider.name} (${provider.id}) priority=${provider.priority}`)
  }

  unregister(id: string): void {
    this.providers.delete(id)
    this.healthCache.delete(id)
  }

  // ==================== 查询 ====================

  get(id: string): IProvider | undefined {
    return this.providers.get(id)
  }

  getAll(): IProvider[] {
    return [...this.providers.values()]
  }

  /** 获取全部已注册 Provider（P4.1 聚合引擎使用） */
  getProviders(): IProvider[] {
    return this.getAll()
  }

  /** 获取已启用的 Provider（按 priority 升序排列） */
  getEnabled(): IProvider[] {
    return [...this.providers.values()]
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority)
  }

  /** 获取可用于搜索的 Provider */
  getSearchProviders(): IProvider[] {
    return this.getEnabled()
  }

  // ==================== 启用/禁用 ====================

  enable(id: string): void {
    const p = this.providers.get(id)
    if (p) p.enabled = true
  }

  disable(id: string): void {
    const p = this.providers.get(id)
    if (p) p.enabled = false
  }

  // ==================== 健康检查 ====================

  async checkHealth(): Promise<ProviderHealth[]> {
    const providers = this.getEnabled()
    const results: ProviderHealth[] = []

    for (const p of providers) {
      const start = performance.now()
      let status: ProviderHealth['status'] = 'unknown'
      try {
        const ok = await p.healthCheck()
        status = ok ? 'online' : 'offline'
      } catch {
        status = 'offline'
      }
      const elapsed = performance.now() - start

      const health: ProviderHealth = {
        providerId: p.id,
        status,
        lastCheck: Date.now(),
        responseTime: Math.round(elapsed),
      }
      this.healthCache.set(p.id, health)
      results.push(health)
    }
    return results
  }

  getHealthCache(): ProviderHealth[] {
    return [...this.healthCache.values()]
  }

  /** 启动定时健康检查（每 10 分钟） */
  startPeriodicHealthCheck(): void {
    this.stopPeriodicHealthCheck()
    this.healthTimer = setInterval(() => {
      this.checkHealth().catch(() => { /* silent */ })
    }, 10 * 60 * 1000)
  }

  stopPeriodicHealthCheck(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer)
      this.healthTimer = null
    }
  }

  // ==================== 统计 ====================

  // ==================== P4.3 插件管理 ====================

  /** 注册插件 Provider（与 register 相同，语义化命名） */
  registerPlugin(provider: IProvider): void {
    this.register(provider)
  }

  /** 卸载插件 Provider */
  unregisterPlugin(id: string): void {
    this.unregister(id)
  }

  get count(): number {
    return this.providers.size
  }

  get enabledCount(): number {
    return this.getEnabled().length
  }
}
