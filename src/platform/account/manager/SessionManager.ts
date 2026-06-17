// src/platform/account/manager/SessionManager.ts — 会话生命周期管理
// 本地会话永不过期，云端会话支持 refresh/expire

import type { Session, UserAccount } from '../types/account.types'
import { accountStorage } from '../storage/AccountStorage'

type SessionSubscriber = (session: Session | null) => void

export class SessionManager {
  private currentSession: Session | null = null
  private subscribers = new Set<SessionSubscriber>()
  private initialized = false

  /** 初始化：从持久化恢复会话 */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      this.currentSession = await accountStorage.loadSession()
    } catch {
      this.currentSession = null
    }

    this.initialized = true
  }

  /** 创建新会话 */
  async createSession(account: UserAccount): Promise<Session> {
    // 结束旧会话
    if (this.currentSession) {
      await this.endSession()
    }

    const session: Session = {
      id: `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      accountId: account.id,
      issuedAt: Date.now(),
      expiresAt: 0, // 本地会话永不过期
      active: true,
    }

    this.currentSession = session
    await accountStorage.saveSession(session)
    this.notify(session)
    return session
  }

  /** 获取当前活跃会话 */
  getActiveSession(): Session | null {
    if (!this.currentSession) return null
    if (!this.currentSession.active) return null
    return this.currentSession
  }

  /** 验证会话是否有效 */
  validateSession(): boolean {
    const session = this.currentSession
    if (!session || !session.active) return false

    // 本地会话永不过期 (expiresAt = 0)
    if (session.expiresAt === 0) return true

    // 云端会话检查过期
    return session.expiresAt > Date.now()
  }

  /** 刷新会话 (云端会话可能需要) */
  async refreshSession(): Promise<Session | null> {
    const session = this.currentSession
    if (!session) return null

    // 本地会话无需刷新
    if (session.expiresAt === 0) return session

    // 云端会话 - 延长有效期
    session.issuedAt = Date.now()
    session.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    await accountStorage.saveSession(session)
    this.notify(session)
    return session
  }

  /** 结束当前会话 */
  async endSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.active = false
    }
    this.currentSession = null
    await accountStorage.saveSession(null)
    this.notify(null)
  }

  // ── 订阅机制 ──

  subscribe(fn: SessionSubscriber): () => void {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  private notify(session: Session | null): void {
    for (const sub of this.subscribers) {
      try { sub(session) } catch { /* silent */ }
    }
  }
}

export const sessionManager = new SessionManager()
