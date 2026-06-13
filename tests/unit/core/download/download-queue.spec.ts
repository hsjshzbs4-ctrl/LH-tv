// tests/unit/core/download/download-queue.spec.ts — DownloadQueue 单元测试
// 覆盖: enqueue/dequeue/remove/clear/size/getAll/FIFO order

import { describe, it, expect, beforeEach } from 'vitest'
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

describe('DownloadQueue', () => {
  let queue: DownloadQueue

  beforeEach(() => {
    queue = new DownloadQueue()
  })

  describe('enqueue()', () => {
    it('should add task and increment size', () => {
      queue.enqueue(createTask('a'))
      expect(queue.size()).toBe(1)
      queue.enqueue(createTask('b'))
      expect(queue.size()).toBe(2)
    })
  })

  describe('dequeue()', () => {
    it('should return FIFO order', () => {
      queue.enqueue(createTask('a'))
      queue.enqueue(createTask('b'))
      queue.enqueue(createTask('c'))
      expect(queue.dequeue()?.id).toBe('a')
      expect(queue.dequeue()?.id).toBe('b')
      expect(queue.dequeue()?.id).toBe('c')
    })

    it('should return undefined for empty queue', () => {
      expect(queue.dequeue()).toBeUndefined()
    })
  })

  describe('remove()', () => {
    it('should remove by id and return true', () => {
      queue.enqueue(createTask('a'))
      queue.enqueue(createTask('b'))
      expect(queue.remove('a')).toBe(true)
      expect(queue.size()).toBe(1)
      expect(queue.getAll()[0].id).toBe('b')
    })

    it('should return false for missing id', () => {
      queue.enqueue(createTask('a'))
      expect(queue.remove('missing')).toBe(false)
      expect(queue.size()).toBe(1)
    })
  })

  describe('clear()', () => {
    it('should empty all tasks', () => {
      queue.enqueue(createTask('a'))
      queue.enqueue(createTask('b'))
      queue.clear()
      expect(queue.size()).toBe(0)
      expect(queue.getAll()).toEqual([])
    })
  })

  describe('size()', () => {
    it('should return 0 for new queue', () => {
      expect(queue.size()).toBe(0)
    })

    it('should reflect enqueue/dequeue changes', () => {
      queue.enqueue(createTask())
      expect(queue.size()).toBe(1)
      queue.dequeue()
      expect(queue.size()).toBe(0)
    })
  })

  describe('getAll()', () => {
    it('should return readonly copy of all tasks', () => {
      const a = createTask('a')
      const b = createTask('b')
      queue.enqueue(a)
      queue.enqueue(b)
      const all = queue.getAll()
      expect(all).toEqual([a, b])
    })

    it('should return empty array for new queue', () => {
      expect(queue.getAll()).toEqual([])
    })
  })
})
