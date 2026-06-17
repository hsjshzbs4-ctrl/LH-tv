// src/platform/account/auth/LocalAuthProvider.ts — 本地认证提供者
// PB5 Auth v2: 唯一实现，零网络调用，创建匿名本地身份
// 禁止 OAuth / SSO / External Login

import { AccountType, type IAuthProvider, type AuthResult } from '../types/account.types'
import type { UserAccount, Session } from '../types/account.types'

let idCounter = 0

function generateLocalId(): string {
  idCounter++
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `local_${timestamp}_${random}_${idCounter}`
}

export class LocalAuthProvider implements IAuthProvider {
  readonly name = 'local'
  readonly type = AccountType.LOCAL

  private currentAccount: UserAccount | null = null

  async authenticate(): Promise<AuthResult> {
    // 创建匿名本地账户
    this.currentAccount = {
      id: generateLocalId(),
      displayName: '本地用户',
      type: AccountType.LOCAL,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    }

    const session: Session = {
      id: `sess_${Date.now().toString(36)}`,
      accountId: this.currentAccount.id,
      issuedAt: Date.now(),
      expiresAt: 0, // 本地会话永不过期
      active: true,
    }

    return {
      success: true,
      account: this.currentAccount,
      session,
    }
  }

  async refresh(): Promise<AuthResult> {
    // 本地认证无需刷新
    if (this.currentAccount) {
      this.currentAccount.lastActiveAt = Date.now()
      return {
        success: true,
        account: this.currentAccount,
        session: null,
      }
    }

    return {
      success: false,
      account: null,
      session: null,
      error: 'No active account to refresh',
    }
  }

  async revoke(): Promise<void> {
    this.currentAccount = null
  }

  async getProfile(): Promise<UserAccount | null> {
    return this.currentAccount
  }
}
