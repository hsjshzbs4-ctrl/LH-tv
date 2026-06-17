// src/platform/account/manager/UserAccountManager.ts — 用户账户核心管理器
// SSOT: 所有用户账户身份的唯一控制点
// PB5 Auth v2: 只做 Local Account，本地匿名身份自动创建

import { AccountType, AuthState, type UserAccount } from '../types/account.types'
import type { AccountEvent, AccountEventTypeValue } from '../types/account.types'
import { AccountEventType } from '../types/account.types'
import { accountStorage } from '../storage/AccountStorage'
import { sessionManager } from './SessionManager'
import { LocalAuthProvider } from '../auth/LocalAuthProvider'
import type { IAuthProvider } from '../auth/AuthProvider'
import { featureFlagManager, FeatureState } from '@platform/flags'

type AccountSubscriber = (event: AccountEvent) => void

export class UserAccountManager {
  /** SSOT: 所有账户 */
  private accounts = new Map<string, UserAccount>()
  /** 当前活跃账户 ID */
  private currentAccountId: string | null = null
  /** 当前 AuthProvider */
  private authProvider: IAuthProvider
  /** 订阅者 */
  private subscribers = new Set<AccountSubscriber>()
  /** 是否已初始化 */
  private initialized = false

  constructor(authProvider?: IAuthProvider) {
    this.authProvider = authProvider ?? new LocalAuthProvider()
  }

  // ── 初始化 ──

  /** 初始化账户系统 */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // 检查功能是否启用
    if (!featureFlagManager.isEnabled('pb5.account')) {
      this.initialized = true
      return
    }

    // 从持久化加载账户
    try {
      const persistedAccounts = await accountStorage.loadAccounts()
      for (const account of persistedAccounts) {
        this.accounts.set(account.id, account)
        if (account.lastActiveAt) {
          this.currentAccountId = account.id
        }
      }
    } catch {
      // 无持久化数据
    }

    // 初始化会话
    await sessionManager.initialize()

    // 如果没有账户，自动创建本地匿名账户 (Local First)
    if (this.accounts.size === 0) {
      await this.createLocalAccount()
    }

    this.initialized = true
  }

  // ── 账户 CRUD ──

  /** 创建本地账户 */
  async createLocalAccount(displayName?: string): Promise<UserAccount> {
    const result = await this.authProvider.authenticate()

    if (!result.success || !result.account) {
      throw new Error('Failed to create local account')
    }

    const account = result.account
    if (displayName) {
      account.displayName = displayName
    }

    this.accounts.set(account.id, account)
    this.currentAccountId = account.id

    // 创建会话
    if (result.session) {
      await sessionManager.createSession(account)
    }

    // 持久化
    await accountStorage.saveAccounts(Array.from(this.accounts.values()))

    // 通知订阅者
    this.emit({
      type: AccountEventType.ACCOUNT_CREATED,
      accountId: account.id,
      timestamp: Date.now(),
    })

    return account
  }

  /** 获取当前活跃账户 */
  getCurrentAccount(): UserAccount | null {
    if (!this.currentAccountId) return null
    return this.accounts.get(this.currentAccountId) ?? null
  }

  /** 获取账户列表 */
  getAllAccounts(): UserAccount[] {
    return Array.from(this.accounts.values())
  }

  /** 获取指定账户 */
  getAccount(id: string): UserAccount | null {
    return this.accounts.get(id) ?? null
  }

  /** 更新账户资料 */
  async updateProfile(id: string, updates: Partial<Pick<UserAccount, 'displayName' | 'avatar' | 'metadata'>>): Promise<UserAccount | null> {
    const account = this.accounts.get(id)
    if (!account) return null

    if (updates.displayName != null) account.displayName = updates.displayName
    if (updates.avatar != null) account.avatar = updates.avatar
    if (updates.metadata != null) account.metadata = { ...account.metadata, ...updates.metadata }
    account.lastActiveAt = Date.now()

    await accountStorage.saveAccounts(Array.from(this.accounts.values()))

    this.emit({
      type: AccountEventType.PROFILE_UPDATED,
      accountId: account.id,
      timestamp: Date.now(),
      data: updates as Record<string, unknown>,
    })

    return account
  }

  /** 切换到指定账户 */
  async switchAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId)
    if (!account) throw new Error(`Account not found: ${accountId}`)

    this.currentAccountId = accountId
    account.lastActiveAt = Date.now()

    // 为该账户创建新会话
    const session = await sessionManager.createSession(account)
    await accountStorage.saveAccounts(Array.from(this.accounts.values()))

    this.emit({
      type: AccountEventType.SESSION_STARTED,
      accountId: account.id,
      timestamp: Date.now(),
      data: { sessionId: session.id },
    })
  }

  /** 删除账户 */
  async deleteAccount(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId)
    if (!account) return

    // 结束该账户的会话
    const currentSession = sessionManager.getActiveSession()
    if (currentSession?.accountId === accountId) {
      await sessionManager.endSession()
    }

    this.accounts.delete(accountId)

    if (this.currentAccountId === accountId) {
      this.currentAccountId = null
    }

    await accountStorage.saveAccounts(Array.from(this.accounts.values()))

    this.emit({
      type: AccountEventType.ACCOUNT_DELETED,
      accountId,
      timestamp: Date.now(),
    })
  }

  // ── 查询 ──

  /** 获取当前认证状态 */
  getAuthState(): AuthState {
    if (!this.initialized || !featureFlagManager.isEnabled('pb5.account')) {
      return AuthState.ANONYMOUS
    }

    const account = this.getCurrentAccount()
    if (!account) return AuthState.UNAUTHENTICATED

    const session = sessionManager.getActiveSession()
    if (!session) return AuthState.UNAUTHENTICATED

    if (sessionManager.validateSession()) {
      return AuthState.AUTHENTICATED
    }

    return AuthState.ANONYMOUS
  }

  /** 是否有活跃用户 */
  get isLoggedIn(): boolean {
    return this.getAuthState() === AuthState.AUTHENTICATED
  }

  // ── 订阅机制 ──

  subscribe(fn: AccountSubscriber): () => void {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  private emit(event: AccountEvent): void {
    for (const sub of this.subscribers) {
      try { sub(event) } catch { /* silent */ }
    }
  }
}

/** 全局单例 */
export const userAccountManager = new UserAccountManager()
