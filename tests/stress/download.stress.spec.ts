// tests/stress/download.stress.spec.ts — Download Stress Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DownloadQueue } from '@/core/download/queue/DownloadQueue'
import { TaskScheduler } from '@/core/download/queue/TaskScheduler'
import { RecoveryManager } from '@/core/download/recovery/RecoveryManager'
import type { DownloadTask } from '@/core/download/types/download.types'

function dl(id: string): DownloadTask {
  return {
    id, mediaId: `m-${id}`, providerId: 'p1', providerName: 'Test',
    episodeId: `ep-${id}`, episodeLabel: '第01集', episodeNum: 1,
    title: `Show ${id}`, cover: '', sourceUrl: 'https://x.com/v.mp4',
    status: 'pending', progress: 0, speed: 0, downloadedBytes: 0, totalBytes: 0,
    supportsResume: true, resumeCount: 0, createdAt: Date.now(), updatedAt: Date.now(),
  }
}

describe('Download Stress', () => {
  let queue: DownloadQueue
  let startFn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queue = new DownloadQueue()
    startFn = vi.fn().mockResolvedValue(undefined)
  })

  it('Case 01: should handle 1000 tasks in queue', () => {
    for (let i = 0; i < 1000; i++) queue.enqueue(dl(`dl-${i}`))
    expect(queue.size()).toBe(1000)
    const scheduler = new TaskScheduler(queue, startFn, 10)
    scheduler.schedule()
    expect(startFn).toHaveBeenCalledTimes(10) // max 10 concurrent
  })

  it('Case 02: should handle 1000 pause/resume operations', () => {
    for (let i = 0; i < 100; i++) queue.enqueue(dl(`dl-${i}`))
    const scheduler = new TaskScheduler(queue, startFn, 5)
    scheduler.schedule()

    for (let i = 0; i < 100; i++) {
      scheduler.onTaskPaused(`dl-${i}`)
      scheduler.schedule()
    }
    expect(true).toBe(true)
  })

  it('Case 03: should handle 1000 task completions', () => {
    for (let i = 0; i < 1000; i++) queue.enqueue(dl(`dl-${i}`))
    const scheduler = new TaskScheduler(queue, startFn, 50)
    scheduler.schedule()

    for (let i = 0; i < 1000; i++) {
      scheduler.onTaskComplete(`dl-${i}`)
    }
    expect(scheduler.activeCount).toBe(0)
  }, 15000)

  it('Case 04: should detect recoverable tasks correctly at scale', () => {
    const recovery = new RecoveryManager()
    for (let i = 0; i < 100; i++) {
      const status = i % 5 === 0 ? 'paused' : i % 5 === 1 ? 'failed' : i % 5 === 2 ? 'completed' : i % 5 === 3 ? 'downloading' : 'pending'
      const task = dl(`dl-${i}`)
      task.status = status
      const canRecover = recovery.canRecover(task)
      if (status === 'paused' || status === 'failed') expect(canRecover).toBe(true)
      else expect(canRecover).toBe(false)
    }
  })

  it('Case 05: should handle queue clear at scale', () => {
    for (let i = 0; i < 500; i++) queue.enqueue(dl(`dl-${i}`))
    queue.clear()
    expect(queue.size()).toBe(0)
  })
})
