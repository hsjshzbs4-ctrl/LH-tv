// src/platform/account/storage/AccountStorage.ts — 账户持久化
// 通过 storageService 持久化账户和会话数据

import { storageService } from '@/shared/storage/storage.service'
import type { UserAccount, Session } from '../types/account.types'

const ACCOUNT_KEY = 'pb5_account'
const SESSION_KEY = 'pb5_session'

interface PersistedAccountData {
  accounts: UserAccount[]
  updatedAt: number
}

export class AccountStorage {
  private accountCache: PersistedAccountData | null = null
  private sessionCache: Session | null = null

  /** 加载所有账户 */
  async loadAccounts(): Promise<UserAccount[]> {
    if (this.accountCache) return this.accountCache.accounts

    try {
      const settings = await storageService.getSettings()
      const raw = settings[ACCOUNT_KEY]
      if (raw && typeof raw === 'string') {
        this.accountCache = JSON.parse(raw) as PersistedAccountData
        return this.accountCache.accounts
      }
    } catch {
      // 首次加载
    }

    this.accountCache = { accounts: [], updatedAt: Date.now() }
    return this.accountCache.accounts
  }

  /** 保存账户列表 */
  async saveAccounts(accounts: UserAccount[]): Promise<void> {
    const data: PersistedAccountData = {
      accounts,
      updatedAt: Date.now(),
    }
    this.accountCache = data
    await storageService.setSettings({ [ACCOUNT_KEY]: JSON.stringify(data) })
  }

  /** 加载活跃会话 */
  async loadSession(): Promise<Session | null> {
    if (this.sessionCache) return this.sessionCache

    try {
      const settings = await storageService.getSettings()
      const raw = settings[SESSION_KEY]
      if (raw && typeof raw === 'string') {
        this.sessionCache = JSON.parse(raw) as Session
        return this.sessionCache
      }
    } catch {
      // 无会话
    }

    return null
  }

  /** 保存会话 */
  async saveSession(session: Session | null): Promise<void> {
    this.sessionCache = session
    if (session) {
      await storageService.setSettings({ [SESSION_KEY]: JSON.stringify(session) })
    } else {
      await storageService.setSettings({ [SESSION_KEY]: '' })
    }
  }

  /** 清空内存缓存 (测试隔离) */
  invalidateCache(): void {
    this.accountCache = null
    this.sessionCache = null
  }
}

export const accountStorage = new AccountStorage()
