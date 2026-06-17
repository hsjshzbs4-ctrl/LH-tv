// tests/unit/platform/account/user-account-manager.spec.ts — UserAccountManager 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserAccountManager } from '@platform/account/manager/UserAccountManager'
import { AccountType, AuthState } from '@platform/account/types/account.types'
import { accountStorage } from '@platform/account/storage/AccountStorage'

// Mock storageService
vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock featureFlagManager to default ON for account tests
vi.mock('@platform/flags', () => ({
  featureFlagManager: {
    isEnabled: vi.fn().mockReturnValue(true),
    getState: vi.fn().mockReturnValue('OFF'),
  },
  FeatureState: { OFF: 'OFF', INTERNAL: 'INTERNAL', PUBLIC: 'PUBLIC' },
}))

describe('UserAccountManager', () => {
  let manager: UserAccountManager

  beforeEach(async () => {
    accountStorage.invalidateCache()
    manager = new UserAccountManager()
    await manager.initialize()
  })

  // ── Local First ──

  it('automatically creates a local account on first init', () => {
    const account = manager.getCurrentAccount()
    expect(account).not.toBeNull()
    expect(account!.type).toBe(AccountType.LOCAL)
    expect(account!.displayName).toBe('本地用户')
  })

  it('creates local account with custom display name', async () => {
    const account = await manager.createLocalAccount('小林')
    expect(account.displayName).toBe('小林')
    expect(account.type).toBe(AccountType.LOCAL)
  })

  // ── Auth State ──

  it('is AUTHENTICATED after initialization', () => {
    expect(manager.getAuthState()).toBe(AuthState.AUTHENTICATED)
    expect(manager.isLoggedIn).toBe(true)
  })

  // ── Account CRUD ──

  it('getAllAccounts lists all accounts', () => {
    const all = manager.getAllAccounts()
    expect(all.length).toBeGreaterThanOrEqual(1)
  })

  it('getAccount returns account by ID', () => {
    const current = manager.getCurrentAccount()!
    const found = manager.getAccount(current.id)
    expect(found).not.toBeNull()
    expect(found!.id).toBe(current.id)
  })

  it('getAccount returns null for unknown ID', () => {
    expect(manager.getAccount('nonexistent')).toBeNull()
  })

  it('updates profile', async () => {
    const current = manager.getCurrentAccount()!
    const updated = await manager.updateProfile(current.id, {
      displayName: '新名称',
      metadata: { theme: 'dark' },
    })

    expect(updated).not.toBeNull()
    expect(updated!.displayName).toBe('新名称')
    expect(updated!.metadata).toEqual({ theme: 'dark' })
  })

  // ── Subscribe ──

  it('notifies subscribers on account creation', async () => {
    const subscriber = vi.fn()
    const unsub = manager.subscribe(subscriber)

    await manager.createLocalAccount('subscriber-test')
    expect(subscriber).toHaveBeenCalledTimes(1)

    unsub()
  })

  it('unsubscribe stops notifications', async () => {
    const subscriber = vi.fn()
    const unsub = manager.subscribe(subscriber)
    unsub()

    await manager.createLocalAccount('no-notify')
    expect(subscriber).not.toHaveBeenCalled()
  })

  // ── Delete ──

  it('deletes an account', async () => {
    const account = await manager.createLocalAccount('to-delete')
    expect(manager.getAccount(account.id)).not.toBeNull()

    await manager.deleteAccount(account.id)
    expect(manager.getAccount(account.id)).toBeNull()
  })
})
