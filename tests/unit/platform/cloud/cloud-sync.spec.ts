// tests/unit/platform/cloud/cloud-sync.spec.ts — CloudSyncManager 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CloudSyncManager } from '@platform/cloud/manager/CloudSyncManager'
import { SyncQueue } from '@platform/cloud/manager/SyncQueue'
import { ConflictResolver } from '@platform/cloud/manager/ConflictResolver'
import { LocalCloudProvider } from '@platform/cloud/provider/LocalCloudProvider'
import { SyncStatus, ConflictStrategy, SyncableType } from '@platform/cloud/types/cloud.types'
import type { ISyncHandler, SyncRecord } from '@platform/cloud/types/cloud.types'
import { syncStorage } from '@platform/cloud/storage/SyncStorage'

vi.mock('@/shared/storage/storage.service', () => ({
  storageService: {
    getSettings: vi.fn().mockResolvedValue({}),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
  FeatureState: { OFF: 'OFF', INTERNAL: 'INTERNAL', PUBLIC: 'PUBLIC' },
}))

function makeStringRecords(items: string[]): SyncRecord<string>[] {
  return items.map((s, i) => ({
    id: `rec-${i}`,
    type: SyncableType.FAVORITES,
    data: s,
    updatedAt: Date.now() + i,
    deviceId: 'test-device',
    version: 1,
  }))
}

describe('CloudSyncManager', () => {
  let manager: CloudSyncManager

  beforeEach(() => {
    syncStorage.invalidateCache()
    manager = new CloudSyncManager(new LocalCloudProvider())
  })

  it('initializes and stays in Local Only mode with no cloud provider', async () => {
    await manager.initialize()
    expect(manager.getSyncStatus()).toBe(SyncStatus.IDLE)
  })

  it('registers and unregisters sync handlers', () => {
    const handler: ISyncHandler = {
      type: SyncableType.FAVORITES,
      conflictStrategy: ConflictStrategy.MERGE,
      serialize: vi.fn().mockResolvedValue([]),
      deserialize: vi.fn().mockResolvedValue(undefined),
      detectConflicts: vi.fn().mockReturnValue(false),
      merge: vi.fn(),
    }
    manager.registerHandler(handler)
    manager.unregisterHandler(SyncableType.FAVORITES)
  })

  it('subscribes to sync events', () => {
    const sub = vi.fn()
    const unsub = manager.subscribe(sub)
    unsub()
    expect(sub).not.toHaveBeenCalled()
  })

  it('syncAll does nothing in Local Only mode', async () => {
    await manager.syncAll()
    expect(manager.getSyncStatus()).toBe(SyncStatus.OFFLINE)
  })

  it('getQueueSize returns 0 initially', () => {
    expect(manager.getQueueSize()).toBe(0)
  })
})

describe('SyncQueue', () => {
  let queue: SyncQueue

  beforeEach(() => {
    queue = new SyncQueue()
  })

  it('enqueues and dequeues entries', async () => {
    await queue.enqueue(
      { id: 'r1', type: SyncableType.FAVORITES, data: {}, updatedAt: 1, deviceId: 'd1', version: 1 },
      'push' as never,
    )
    expect(queue.size).toBe(1)
    const entry = queue.dequeue()
    expect(entry).not.toBeNull()
  })

  it('completes an entry', async () => {
    const id = await queue.enqueue(
      { id: 'r2', type: SyncableType.HISTORY, data: {}, updatedAt: 2, deviceId: 'd1', version: 1 },
      'pull' as never,
    )
    await queue.complete(id)
    expect(queue.size).toBe(0)
  })

  it('marks failed with retry (exponential backoff)', async () => {
    const id = await queue.enqueue(
      { id: 'r3', type: SyncableType.RESUME, data: {}, updatedAt: 3, deviceId: 'd1', version: 1 },
      'push' as never,
    )
    const result = await queue.markFailed(id)
    expect(result).not.toBeNull()
    expect(result!.shouldRetry).toBe(true)
    expect(result!.delayMs).toBe(1000) // 首次重试 1s
  })

  it('gives up after max retries', async () => {
    const id = await queue.enqueue(
      { id: 'r4', type: SyncableType.RESUME, data: {}, updatedAt: 4, deviceId: 'd1', version: 1 },
      'push' as never,
    )
    // 5 retries + 1 final = 6 markFailed calls should exhaust
    for (let i = 0; i < 5; i++) {
      const result = await queue.markFailed(id)
      expect(result!.shouldRetry).toBe(true)
    }
    const final = await queue.markFailed(id)
    expect(final!.shouldRetry).toBe(false)
    expect(queue.size).toBe(0)
  })
})

describe('ConflictResolver', () => {
  const resolver = new ConflictResolver()

  it('LAST_WRITE_WINS: picks newer record', () => {
    const local = { id: '1', type: 'favorites', data: 'local', updatedAt: 200, deviceId: 'd1', version: 1 }
    const remote = { id: '1', type: 'favorites', data: 'remote', updatedAt: 100, deviceId: 'd2', version: 1 }
    const result = resolver.resolve(
      { local: local as never, remote: remote as never, type: 'favorites' as never },
      ConflictStrategy.LAST_WRITE_WINS,
    )
    expect((result as Record<string, unknown>).data).toBe('local')
  })

  it('KEEP_LOCAL: always picks local', () => {
    const local = { id: '1', type: 'favorites', data: 'local', updatedAt: 100, deviceId: 'd1', version: 1 }
    const remote = { id: '1', type: 'favorites', data: 'remote', updatedAt: 200, deviceId: 'd2', version: 1 }
    const result = resolver.resolve(
      { local: local as never, remote: remote as never, type: 'favorites' as never },
      ConflictStrategy.KEEP_LOCAL,
    )
    expect((result as Record<string, unknown>).data).toBe('local')
  })

  it('MERGE: unions arrays', () => {
    const local = { id: '1', type: 'favorites', data: [{ id: 'a' }, { id: 'b' }], updatedAt: 100, deviceId: 'd1', version: 1 }
    const remote = { id: '1', type: 'favorites', data: [{ id: 'b' }, { id: 'c' }], updatedAt: 200, deviceId: 'd2', version: 1 }
    const result = resolver.resolve(
      { local: local as never, remote: remote as never, type: 'favorites' as never },
      ConflictStrategy.MERGE,
    )
    const data = (result as Record<string, unknown>).data as Array<Record<string, unknown>>
    expect(data.length).toBe(3) // a, b, c (b 去重)
  })
})
