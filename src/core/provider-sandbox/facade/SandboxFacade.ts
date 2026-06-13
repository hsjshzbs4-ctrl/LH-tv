// src/core/provider-sandbox/facade/SandboxFacade.ts - 沙箱门面
// P4.4 Provider Sandbox
//
// View 层唯一切入点：Provider 沙箱管理
// 禁止 View 直接访问 WorkerPool / ProviderHost

import { ProviderHost } from '../host/ProviderHost'
import type { ProviderHostConfig } from '../types/sandbox.types'
import type { IProvider, MediaItem, MediaDetail } from '@provider-contracts'
import type { SandboxDebugInfo } from '../types/sandbox.types'

export class SandboxFacade {
  private host: ProviderHost

  constructor(config?: Partial<ProviderHostConfig>) {
    this.host = new ProviderHost(config)
  }

  /** 注册 Provider（自动选择隔离模式） */
  register(provider: IProvider): void {
    this.host.register(provider)
  }

  /** 批量注册 */
  registerAll(providers: IProvider[]): void {
    this.host.registerAll(providers)
  }

  /** 注销 Provider */
  unregister(providerId: string): void {
    this.host.unregister(providerId)
  }

  /** 搜索（通过沙箱隔离执行） */
  async search(providerId: string, keyword: string): Promise<MediaItem[]> {
    return this.host.search(providerId, keyword)
  }

  /** 详情（通过沙箱隔离执行） */
  async detail(providerId: string, mediaId: string): Promise<MediaDetail> {
    return this.host.detail(providerId, mediaId)
  }

  /** 健康检查 */
  async healthCheck(providerId: string): Promise<boolean> {
    return this.host.healthCheck(providerId)
  }

  /** Provider 是否健康 */
  isProviderHealthy(providerId: string): boolean {
    return this.host.isProviderHealthy(providerId)
  }

  /** 获取已注册的 Provider ID 列表 */
  getRegisteredProviderIds(): string[] {
    return this.host.getRegisteredProviderIds()
  }

  /** 获取调试信息（开发模式） */
  getDebugInfo(): (SandboxDebugInfo | null)[] {
    return this.host.getDebugInfo()
  }

  /** 订阅 Provider 状态变更 */
  subscribe(callback: (providerId: string) => void): () => void {
    return this.host.subscribe(callback)
  }

  /** 销毁 */
  destroy(): void {
    this.host.destroy()
  }
}

/** 全局单例 */
export const sandboxFacade = new SandboxFacade()
