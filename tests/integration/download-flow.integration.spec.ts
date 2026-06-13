// tests/integration/download-flow.integration.spec.ts — DownloadQueue + Scheduler + Manager 集成
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DownloadQueue } from '@/core/download/queue/DownloadQueue'
import { TaskScheduler } from '@/core/download/queue/TaskScheduler'
import { RecoveryManager } from '@/core/download/recovery/RecoveryManager'
import { storageService } from '@/shared/storage/storage.service'
import type { DownloadTask, DownloadStatus } from '@/core/download/types/download.types'

function dl(id: string, status: DownloadStatus = 'pending'): DownloadTask {
  return {
    id, mediaId: `m-${id}`, providerId: 'p1', providerName: 'Test',
    episodeId: `ep-${id}`, episodeLabel: '第01集', episodeNum: 1,
    title: `Show ${id}`, cover: '', sourceUrl: 'https://x.com/v.mp4',
    status, progress: status === 'completed' ? 100 : 0,
    speed: 0, downloadedBytes: 0, totalBytes: 0,
    supportsResume: true, resumeCount: 0,
    createdAt: Date.now(), updatedAt: Date.now(),
  }
}

describe('Download Integration Flow', () => {
  let queue: DownloadQueue
  let startFn: ReturnType<typeof vi.fn>
  let scheduler: TaskScheduler
  let recovery: RecoveryManager

  beforeEach(() => {
    queue = new DownloadQueue()
    startFn = vi.fn().mockResolvedValue(undefined)
    scheduler = new TaskScheduler(queue, startFn, 3)
    recovery = new RecoveryManager()
    vi.clearAllMocks()
  })

  afterEach(() => { vi.restoreAllMocks() })

  // Case 01: Queue → Scheduler → Manager
  it('Case 01: should flow task through Queue → Scheduler', () => {
    for (let i = 0; i < 5; i++) queue.enqueue(dl(`dl-${i}`))
    expect(queue.size()).toBe(5)

    scheduler.schedule()
    expect(startFn).toHaveBeenCalledTimes(3) // maxConcurrent = 3
    expect(scheduler.activeCount).toBe(3)
  })

  // Case 02: Download complete → slot freed → next scheduled
  it('Case 02: should schedule next on completion', () => {
    for (let i = 0; i < 5; i++) queue.enqueue(dl(`dl-${i}`))
    scheduler.schedule()
    expect(startFn).toHaveBeenCalledTimes(3)

    scheduler.onTaskComplete('dl-0')
    // 下一个被调度
    expect(startFn).toHaveBeenCalledTimes(4)
    expect(scheduler.activeCount).toBe(3)
  })

  // Case 03: Pause → resume
  it('Case 03: should handle task pause and release slot', () => {
    for (let i = 0; i < 4; i++) queue.enqueue(dl(`dl-${i}`))
    scheduler.schedule()
    expect(scheduler.activeCount).toBe(3)

    scheduler.onTaskPaused('dl-0')
    // 第4个任务被调度
    expect(startFn).toHaveBeenCalledTimes(4)
  })

  // Case 04: Failed → retry via RecoveryManager
  it('Case 04: should detect recoverable tasks', () => {
    const failed = dl('dl-fail', 'failed')
    const paused = dl('dl-pause', 'paused')
    const completed = dl('dl-done', 'completed')
    const downloading = dl('dl-active', 'downloading')

    expect(recovery.canRecover(failed)).toBe(true)
    expect(recovery.canRecover(paused)).toBe(true)
    expect(recovery.canRecover(completed)).toBe(false)
    expect(recovery.canRecover(downloading)).toBe(false)
  })

  // Case 05: Crash recovery
  it('Case 05: should recover task after simulated crash', async () => {
    const app = (window as Record<string, unknown>).app as Record<string, Record<string, unknown>>
    const downloadEpisode = app.downloadEpisode as ReturnType<typeof vi.fn>
    downloadEpisode.mockResolvedValue({ id: 'new-legacy', status: 'downloading' })

    const task = dl('dl-1', 'paused')
    expect(recovery.canRecover(task)).toBe(true)

    const result = await recovery.recoverTask(task)
    expect(result.id).toBe('new-legacy')
    expect(downloadEpisode).toHaveBeenCalled()
  })
})
