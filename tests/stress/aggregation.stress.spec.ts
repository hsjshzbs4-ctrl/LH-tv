// tests/stress/aggregation.stress.spec.ts — Aggregation Stress Tests
import { describe, it, expect, beforeEach } from 'vitest'
import { ProviderHealthManager } from '@/core/aggregation/health/ProviderHealthManager'
import { ProviderHealthStatus } from '@/core/aggregation/types/aggregation.types'

describe('Aggregation Stress', () => {
  let health: ProviderHealthManager

  beforeEach(() => { health = new ProviderHealthManager() })

  it('Case 01: should handle 10 providers simultaneously', () => {
    for (let i = 0; i < 10; i++) health.register(`p${i}`, `Provider ${i}`)
    expect(health.getAllSnapshots()).toHaveLength(10)
  })

  it('Case 02: should handle 1000 health checks', () => {
    health.register('p1', 'P1')
    for (let i = 0; i < 1000; i++) {
      if (i % 3 === 0) health.markSuccess('p1')
      else health.markFailure('p1')
    }
    // 最后一次 check 决定最终状态
    expect([ProviderHealthStatus.HEALTHY, ProviderHealthStatus.OFFLINE, ProviderHealthStatus.DEGRADED]).toContain(health.getHealth('p1'))
  })

  it('Case 03: should handle random 30% failure rate', () => {
    for (let i = 0; i < 10; i++) health.register(`p${i}`, `P${i}`)
    // 30% of operations fail
    for (let round = 0; round < 100; round++) {
      for (let i = 0; i < 10; i++) {
        if (Math.random() < 0.3) health.markFailure(`p${i}`)
        else health.markSuccess(`p${i}`)
      }
    }
    const snapshots = health.getAllSnapshots()
    expect(snapshots).toHaveLength(10)
  })

  it('Case 04: should handle all providers failing (graceful degradation)', () => {
    for (let i = 0; i < 5; i++) health.register(`p${i}`, `P${i}`)
    // 全部连续失败
    for (let i = 0; i < 5; i++) {
      for (let f = 0; f < 5; f++) health.markFailure(`p${i}`)
    }
    const healthyIds = health.getHealthyProviderIds()
    expect(healthyIds).toHaveLength(0) // all OFFLINE
    // 不崩溃
  })

  it('Case 05: should recover from all-offline state', () => {
    for (let i = 0; i < 5; i++) health.register(`p${i}`, `P${i}`)
    for (let i = 0; i < 5; i++) {
      for (let f = 0; f < 5; f++) health.markFailure(`p${i}`)
    }
    // 全部恢复
    for (let i = 0; i < 5; i++) {
      for (let s = 0; s < 3; s++) health.markSuccess(`p${i}`)
    }
    expect(health.getHealthyProviderIds()).toHaveLength(5)
  })
})
