// src/enterprise/identity/IdentityProvider.ts — 身份提供者抽象基类
// PB7-S5: 所有身份提供者必须实现此接口
// 审查要求: 禁止直接 new LDAPProvider/SCIMProvider, 必须通过 IdentityRegistry

import { identityRegistry } from './IdentityRegistry'
import { IdentityProviderType } from '../contracts'

/** 身份验证结果 */
export interface AuthenticationResult {
  success: boolean
  userId?: string
  username?: string
  error?: string
}

/** 用户信息 */
export interface UserInfo {
  userId: string
  username: string
  email?: string
  displayName?: string
  groups?: string[]
}

/** 身份提供者抽象基类 */
export abstract class IdentityProvider {
  abstract readonly type: IdentityProviderType

  /** 验证用户身份 */
  abstract authenticate(credentials: Record<string, unknown>): Promise<AuthenticationResult>

  /** 获取用户信息 */
  abstract getUserInfo(userId: string): Promise<UserInfo | null>

  /** 验证提供者连接 */
  abstract validateConnection(): Promise<boolean>

  /** 注册到 IdentityRegistry */
  register(id: string, name: string, config: Record<string, unknown> = {}): boolean {
    const result = identityRegistry.register({
      id,
      type: this.type,
      name,
      enabled: true,
      config,
      registeredAt: Date.now(),
    })
    return result.success
  }

  /** 从 IdentityRegistry 注销 */
  unregister(id: string): boolean {
    return identityRegistry.unregister(id)
  }
}
