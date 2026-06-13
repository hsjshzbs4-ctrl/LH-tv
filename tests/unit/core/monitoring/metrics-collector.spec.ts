// tests/unit/core/monitoring/metrics-collector.spec.ts — MetricsCollector 单元测试
import { describe, it, expect, beforeEach } from 'vitest'
import { MetricsCollector } from '@/core/monitoring/metrics/MetricsCollector'

describe('MetricsCollector', () => {
  let collector: MetricsCollector

  beforeEach(() => { collector = new MetricsCollector() })

  describe('record()', () => {
    it('should track sum, count, min, max', () => {
      collector.record('search_time', 100)
      collector.record('search_time', 200)
      collector.record('search_time', 50)

      const stats = collector.getStats('search_time')
      expect(stats!.count).toBe(3)
      expect(stats!.sum).toBe(350)
      expect(stats!.avg).toBeCloseTo(116.67, 1)
      expect(stats!.min).toBe(50)
      expect(stats!.max).toBe(200)
    })

    it('should track tags', () => {
      collector.record('search_time', 100, { provider: 'p1' })
      collector.record('search_time', 200, { provider: 'p2' })
      const stats = collector.getStats('search_time')
      expect(stats!.count).toBe(2)
      expect(stats!.sum).toBe(300)
    })
  })

  describe('increment()', () => {
    it('should increment counter by 1', () => {
      collector.increment('errors')
      collector.increment('errors')
      collector.increment('errors')
      expect(collector.getCount('errors')).toBe(3)
      expect(collector.getSum('errors')).toBe(3)
    })
  })

  describe('gauge()', () => {
    it('should set absolute value', () => {
      collector.record('memory', 100)
      collector.gauge('memory', 200)
      expect(collector.getSum('memory')).toBe(200)
    })
  })

  describe('getMetricNames()', () => {
    it('should return all tracked metric names', () => {
      collector.increment('a')
      collector.increment('b')
      collector.record('c', 10)
      expect(collector.getMetricNames()).toEqual(expect.arrayContaining(['a', 'b', 'c']))
    })
  })

  describe('reset() / resetAll()', () => {
    it('should reset specific metric', () => {
      collector.increment('a')
      collector.increment('b')
      collector.reset('a')
      expect(collector.getStats('a')).toBeNull()
      expect(collector.getStats('b')).not.toBeNull()
    })

    it('should reset all metrics', () => {
      collector.increment('a')
      collector.increment('b')
      collector.resetAll()
      expect(collector.getMetricNames()).toEqual([])
    })
  })
})
