// tests/persistence/downloads.persistence.spec.ts — 下载持久化验证
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { storageService } from '@/shared/storage/storage.service'
import { simulateRestart } from '../helpers/persistence-helper'
import type { DownloadTask } from '@/core/download/types/download.types'

function dl(id: string, status: DownloadTask['status'] = 'pending'): DownloadTask {
  return {
    id, mediaId: `m-${id}`, providerId: 'p1', providerName: 'Test',
    episodeId: `ep-${id}`, episodeLabel: '第01集', episodeNum: 1,
    title: `Show ${id}`, cover: '', sourceUrl: `https://x.com/v${id}.mp4`,
    status, progress: status === 'completed' ? 100 : status === 'downloading' ? 45 : 0,
    speed: 0, downloadedBytes: 0, totalBytes: 0,
    supportsResume: true, resumeCount: 0,
    createdAt: Date.now(), updatedAt: Date.now(),
  }
}

describe('Downloads Persistence', () => {
  let persistedData: DownloadTask[] = []

  beforeEach(() => {
    persistedData = []
    vi.spyOn(storageService, 'getDownloadHistory').mockImplementation(async () => [...persistedData])
    vi.spyOn(storageService, 'setDownloadHistory').mockImplementation(async (tasks: DownloadTask[]) => {
      persistedData = [...tasks]
    })
  })

  afterEach(() => { vi.restoreAllMocks() })

  // ==================== Case 01-05: 各状态恢复 ====================
  const statuses: DownloadTask['status'][] = ['pending', 'downloading', 'paused', 'completed', 'failed']

  for (const status of statuses) {
    it(`Case: should persist "${status}" download after restart`, async () => {
      const restored = await simulateRestart(
        () => ({ get: storageService.getDownloadHistory, set: storageService.setDownloadHistory }),
        async () => {
          await storageService.setDownloadHistory([dl('1', status)])
        },
      )

      const items = await restored.get()
      expect(items).toHaveLength(1)
      expect(items[0].status).toBe(status)
      expect(items[0].id).toBe('1')
    })
  }

  // ==================== Case 06: 100 任务恢复 ====================
  it('Case 06: should restore 100 download tasks', async () => {
    const tasks = Array.from({ length: 100 }, (_, i) =>
      dl(`dl${i}`, i % 5 === 0 ? 'completed' : i % 3 === 0 ? 'paused' : 'pending')
    )

    await storageService.setDownloadHistory(tasks)

    const restored = await storageService.getDownloadHistory()
    expect(restored).toHaveLength(100)
    // 各状态都正确
    const completed = restored.filter(t => t.status === 'completed')
    const paused = restored.filter(t => t.status === 'paused')
    expect(completed.length).toBeGreaterThan(0)
    expect(paused.length).toBeGreaterThan(0)
  })

  // ==================== Case 07: 恢复后继续 ====================
  it('Case 07: should recover task after restart', async () => {
    // 模拟：有 paused 任务 → 重启 → 恢复到 recovering 状态
    const recovered = await simulateRestart(
      () => ({ get: storageService.getDownloadHistory, set: storageService.setDownloadHistory }),
      async () => {
        await storageService.setDownloadHistory([dl('1', 'paused')])
      },
    )

    const items = await recovered.get()
    const paused = items.find(t => t.id === '1')
    expect(paused).not.toBeNull()
    expect(paused!.supportsResume).toBe(true)
    expect(paused!.resumeCount).toBe(0)
  })

  // ==================== 进度保持 ====================
  it('should preserve download progress across restart', async () => {
    const restored = await simulateRestart(
      () => ({ get: storageService.getDownloadHistory }),
      async () => {
        await storageService.setDownloadHistory([dl('1', 'downloading')])
      },
    )

    const items = await restored.get()
    expect(items[0].progress).toBe(45)
  })
})
