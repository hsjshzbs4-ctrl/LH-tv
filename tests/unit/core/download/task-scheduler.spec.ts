// tests/unit/core/download/task-scheduler.spec.ts — TaskScheduler 单元测试
// 覆盖: schedule/concurrency/onTaskComplete/onTaskFailed/onTaskPaused

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskScheduler, type StartTaskFn } from '@/core/download/queue/TaskScheduler'
import { DownloadQueue } from '@/core/download/queue/DownloadQueue'
import type { DownloadTask } from '@/core/download/types/download.types'

function createTask(id = 'dl-1'): DownloadTask {
  return {
    id, mediaId: 'm1', providerId: 'p1', providerName: 'Test',
    episodeId: 'ep-1', episodeLabel: '第01集', episodeNum: 1,
    title: 'Test Show', cover: '', sourceUrl: 'https://x.com/v.mp4',
    status: 'pending', progress: 0, speed: 0, downloadedBytes: 0, totalBytes: 0,
    supportsResume: true, resumeCount: 0, createdAt: Date.now(), updatedAt: Date.now(),
  }
}

describe('TaskScheduler', () => {
  let queue: DownloadQueue
  let startFn: ReturnType<typeof vi.fn>
  let scheduler: TaskScheduler

  beforeEach(() => {
    queue = new DownloadQueue()
    startFn = vi.fn().mockResolvedValue(undefined)
    scheduler = new TaskScheduler(queue, startFn, 3)
  })

  describe('schedule()', () => {
    it('should start tasks up to maxConcurrent', () => {
      for (let i = 0; i < 5; i++) queue.enqueue(createTask(`dl-${i}`))
      scheduler.schedule()
      expect(startFn).toHaveBeenCalledTimes(3) // maxConcurrent = 3
      expect(scheduler.activeCount).toBe(3)
    })

    it('should stop when queue is empty', () => {
      queue.enqueue(createTask('a'))
      scheduler.schedule()
      expect(startFn).toHaveBeenCalledTimes(1)
      expect(scheduler.activeCount).toBe(1)
    })

    it('should respect custom maxConcurrent', () => {
      const s = new TaskScheduler(queue, startFn, 1)
      for (let i = 0; i < 3; i++) queue.enqueue(createTask(`dl-${i}`))
      s.schedule()
      expect(startFn).toHaveBeenCalledTimes(1)
      expect(s.activeCount).toBe(1)
    })

    it('should clamp maxConcurrent to at least 1', () => {
      const s = new TaskScheduler(queue, startFn, 0)
      expect(s.max).toBe(1)
    })
  })

  describe('onTaskComplete()', () => {
    it('should release slot and schedule next task', () => {
      for (let i = 0; i < 3; i++) queue.enqueue(createTask(`dl-${i}`))
      scheduler.schedule()
      expect(startFn).toHaveBeenCalledTimes(3)

      scheduler.onTaskComplete('dl-0')
      expect(scheduler.activeCount).toBe(2)
    })

    it('should not throw for unknown taskId', () => {
      expect(() => scheduler.onTaskComplete('unknown')).not.toThrow()
    })
  })

  describe('onTaskFailed()', () => {
    it('should release slot and schedule next', () => {
      for (let i = 0; i < 4; i++) queue.enqueue(createTask(`dl-${i}`))
      scheduler.schedule()
      expect(scheduler.activeCount).toBe(3)

      scheduler.onTaskFailed('dl-0')
      expect(scheduler.activeCount).toBe(3) // 立即调起第4个
    })
  })

  describe('onTaskPaused()', () => {
    it('should release slot and schedule next', () => {
      for (let i = 0; i < 4; i++) queue.enqueue(createTask(`dl-${i}`))
      scheduler.schedule()
      expect(scheduler.activeCount).toBe(3)

      scheduler.onTaskPaused('dl-0')
      expect(scheduler.activeCount).toBe(3) // 立即调起第4个
    })
  })

  describe('startTask failure handling', () => {
    it('should catch startTask errors gracefully', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('start failed'))
      const s = new TaskScheduler(queue, failFn, 2)
      queue.enqueue(createTask('a'))
      s.schedule()
      // 不应抛出
      await vi.waitFor(() => expect(failFn).toHaveBeenCalled())
    })
  })

  describe('activeCount / max', () => {
    it('should report correct counts', () => {
      expect(scheduler.activeCount).toBe(0)
      expect(scheduler.max).toBe(3)

      queue.enqueue(createTask('a'))
      scheduler.schedule()
      expect(scheduler.activeCount).toBe(1)

      scheduler.onTaskComplete('a')
      expect(scheduler.activeCount).toBe(0)
    })
  })
})
