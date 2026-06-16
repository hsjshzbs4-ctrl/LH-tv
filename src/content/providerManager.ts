// src/content/providerManager.ts — PB1.5 Provider 管理服务
// 包装 providerFacade，提供 Provider 注册/启用/禁用/优先级/健康检查

import { providerFacade } from '@/core/providers'
import type { IProvider } from '@provider-contracts'
import type { ProviderInfo } from './contentTypes'

function mapToProviderInfo(provider: IProvider, healthStatus: ProviderInfo['healthStatus'] = 'unknown', lastHealthCheck: number = 0, responseTime?: number): ProviderInfo {
  return {
    id: provider.id,
    name: provider.name,
    enabled: provider.enabled,
    priority: provider.priority,
    type: 'metadata',
    healthStatus,
    lastHealthCheck,
    responseTime,
  }
}

export class ProviderManagerService {
  /** 获取所有 Provider */
  getProviders(): ProviderInfo[] {
    const providers = providerFacade.getProviders()
    const healthCache = providerFacade.getHealthCache()
    return providers.map(p => {
      const h = healthCache.find(hc => hc.providerId === p.id)
      return mapToProviderInfo(p, h?.status, h?.lastCheck, h?.responseTime)
    })
  }

  /** 获取已启用的 Provider */
  getEnabledProviders(): ProviderInfo[] {
    return this.getProviders().filter(p => p.enabled)
  }

  /** 启用 Provider */
  enableProvider(id: string): void {
    const providers = providerFacade.getProviders()
    const target = providers.find(p => p.id === id)
    if (!target) throw new Error(`Provider "${id}" 不存在`)
    target.enabled = true
  }

  /** 禁用 Provider */
  disableProvider(id: string): void {
    const providers = providerFacade.getProviders()
    const target = providers.find(p => p.id === id)
    if (!target) throw new Error(`Provider "${id}" 不存在`)
    target.enabled = false
  }

  /** 设置 Provider 优先级 */
  setPriority(id: string, priority: number): void {
    const providers = providerFacade.getProviders()
    const target = providers.find(p => p.id === id)
    if (!target) throw new Error(`Provider "${id}" 不存在`)
    target.priority = priority
  }

  /** 健康检查（异步执行） */
  async checkHealth(): Promise<ProviderInfo[]> {
    const healthResults = await providerFacade.healthCheck()
    const providers = providerFacade.getProviders()
    return providers.map(p => {
      const h = healthResults.find(hr => hr.providerId === p.id)
      return mapToProviderInfo(p, h?.status, h?.lastCheck, h?.responseTime)
    })
  }

  /** 获取缓存的健康状态（同步） */
  getHealthCache(): ProviderInfo[] {
    const healthCache = providerFacade.getHealthCache()
    const providers = providerFacade.getProviders()
    return providers.map(p => {
      const h = healthCache.find(hc => hc.providerId === p.id)
      return mapToProviderInfo(p, h?.status, h?.lastCheck, h?.responseTime)
    })
  }

  /** 注册新 Provider */
  registerProvider(provider: IProvider): void {
    providerFacade.registerProvider(provider)
  }
}

/** 全局单例 */
export const providerManagerService = new ProviderManagerService()
