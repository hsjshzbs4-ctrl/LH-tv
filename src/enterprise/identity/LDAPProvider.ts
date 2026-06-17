// src/enterprise/identity/LDAPProvider.ts — LDAP 身份提供者
// PB7-S5: 实现 IdentityProvider 抽象基类
// 审查要求: 通过 SSOManager → IdentityRegistry.get() 调用, 禁止直接 new

import { IdentityProvider, type AuthenticationResult, type UserInfo } from './IdentityProvider'
import { IdentityProviderType } from '../contracts'

export class LDAPProvider extends IdentityProvider {
  readonly type = IdentityProviderType.LDAP

  async authenticate(credentials: Record<string, unknown>): Promise<AuthenticationResult> {
    const username = credentials.username as string
    const password = credentials.password as string

    if (!username || !password) {
      return { success: false, error: 'LDAP: username and password are required' }
    }

    // PB7-S5: LDAP 绑定逻辑 stub — 实际实现需 LDAP SDK
    // 当前返回模拟成功, 供集成测试
    return {
      success: true,
      userId: `ldap_${username}`,
      username,
    }
  }

  async getUserInfo(userId: string): Promise<UserInfo | null> {
    // PB7-S5: LDAP 查询 stub
    return {
      userId,
      username: userId.replace('ldap_', ''),
      displayName: userId.replace('ldap_', ''),
    }
  }

  async validateConnection(): Promise<boolean> {
    // PB7-S5: LDAP 连接测试 stub
    return true
  }
}
