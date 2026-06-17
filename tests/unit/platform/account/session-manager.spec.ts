// tests/unit/platform/account/session-manager.spec.ts — SessionManager 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionManager } from '@platform/account/manager/SessionManager'
import { AccountType, type UserAccount } from '@platform/account/types/account.types'
import { accountStorage } from '@platform/account/storage/AccountStorage'

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

function makeAccount(id = 'test-1'): UserAccount {
  return {
    id,
    displayName: 'Test User',
    type: AccountType.LOCAL,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  }
}

describe('SessionManager', () => {
  let sessionManager: SessionManager

  beforeEach(async () => {
    accountStorage.invalidateCache()
    sessionManager = new SessionManager()
    await sessionManager.initialize()
  })

  it('has no active session before creation', () => {
    expect(sessionManager.getActiveSession()).toBeNull()
  })

  it('creates a session for an account', async () => {
    const session = await sessionManager.createSession(makeAccount())
    expect(session).not.toBeNull()
    expect(session.active).toBe(true)
    expect(session.accountId).toBe('test-1')
  })

  it('local session never expires', async () => {
    const session = await sessionManager.createSession(makeAccount())
    expect(session.expiresAt).toBe(0)
    expect(sessionManager.validateSession()).toBe(true)
  })

  it('getActiveSession returns current session', async () => {
    await sessionManager.createSession(makeAccount())
    const active = sessionManager.getActiveSession()
    expect(active).not.toBeNull()
    expect(active!.active).toBe(true)
  })

  it('endSession clears active session', async () => {
    await sessionManager.createSession(makeAccount())
    await sessionManager.endSession()

    expect(sessionManager.getActiveSession()).toBeNull()
  })

  it('creating a new session ends the old one', async () => {
    const s1 = await sessionManager.createSession(makeAccount('user-a'))
    expect(sessionManager.getActiveSession()!.id).toBe(s1.id)

    const s2 = await sessionManager.createSession(makeAccount('user-b'))
    expect(sessionManager.getActiveSession()!.id).toBe(s2.id)
    expect(sessionManager.getActiveSession()!.accountId).toBe('user-b')
  })

  it('notifies subscribers', async () => {
    const subscriber = vi.fn()
    const unsub = sessionManager.subscribe(subscriber)

    await sessionManager.createSession(makeAccount())
    expect(subscriber).toHaveBeenCalledTimes(1)

    unsub()
  })
})
