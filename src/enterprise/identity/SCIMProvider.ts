// src/enterprise/identity/SCIMProvider.ts — SCIM 2.0 身份提供者
// PB7-S5: 实现 IdentityProvider 抽象基类
// 审查要求: 通过 SSOManager → IdentityRegistry.get() 调用, 禁止直接 new

import { IdentityProvider, type AuthenticationResult, type UserInfo } from './IdentityProvider'
import { IdentityProviderType } from '../contracts'

export class SCIMProvider extends IdentityProvider {
  readonly type = IdentityProviderType.SCIM

  async authenticate(credentials: Record<string, unknown>): Promise<AuthenticationResult> {
    const token = credentials.token as string

    if (!token) {
      return { success: false, error: 'SCIM: bearer token is required' }
    }

    // PB7-S5: SCIM 2.0 验证 stub — 实际实现需 SCIM SDK
    return {
      success: true,
      userId: `scim_${(token as string).slice(0, 8)}`,
      username: `scim_user`,
    }
  }

  async getUserInfo(userId: string): Promise<UserInfo | null> {
    return {
      userId,
      username: userId.replace('scim_', ''),
      displayName: userId.replace('scim_', ''),
      groups: ['scim_users'],
    }
  }

  async validateConnection(): Promise<boolean> {
    return true
  }
}
