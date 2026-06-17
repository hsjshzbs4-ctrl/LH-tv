// src/enterprise/identity/SSOManager.ts — SSO 流程编排
// PB7-S5: 通过 IdentityRegistry 查找提供者, 禁止直接 new 任何 Provider
// 审查要求: SSOManager → IdentityRegistry.get(providerId)

import { featureFlagManager } from '@platform/flags'
import { identityRegistry } from './IdentityRegistry'
import { IdentityProviderType } from '../contracts'
import type { IdentityProvider } from './IdentityProvider'
import type { AuthenticationResult } from './IdentityProvider'

export class SSOManager {
  /**
   * SSO 登录
   * 通过 IdentityRegistry 查找提供者, 不得直接 new Provider
   */
  async login(providerId: string, credentials: Record<string, unknown>): Promise<AuthenticationResult> {
    this.ensureEnabled()

    const entry = identityRegistry.get(providerId)
    if (!entry) {
      return { success: false, error: `Identity provider "${providerId}" not found in registry` }
    }

    if (!entry.enabled) {
      return { success: false, error: `Identity provider "${providerId}" is disabled` }
    }

    // 委托给实际的 Provider 实例执行验证
    // PB7-S5: Provider 实例由应用层注入, SSOManager 仅编排流程
    const provider = this.resolveProvider(entry.id)
    if (!provider) {
      return { success: false, error: `Provider instance not resolved for "${providerId}"` }
    }

    return provider.authenticate(credentials)
  }

  /**
   * 获取已注册的 SSO 提供者列表
   */
  listProviders(): string[] {
    return identityRegistry.listByType(IdentityProviderType.SSO)
      .filter((p) => p.enabled)
      .map((p) => p.id)
  }

  // ── Provider 实例解析 (由应用层注入) ──
  private providerInstances = new Map<string, IdentityProvider>()

  /** 注册 Provider 实例 */
  registerProvider(provider: IdentityProvider, id: string): void {
    this.providerInstances.set(id, provider)
  }

  private resolveProvider(id: string): IdentityProvider | null {
    return this.providerInstances.get(id) ?? null
  }

  private ensureEnabled(): void {
    if (!featureFlagManager.isEnabled('pb7.enterprise')) {
      throw new Error('Enterprise Integration is not enabled. Enable pb7.enterprise feature flag.')
    }
  }
}

export const ssoManager = new SSOManager()
