// tests/unit/core/aggregation/provider-health-manager.spec.ts — ProviderHealthManager 单元测试
// 状态机: HEALTHY → DEGRADED → OFFLINE → (recovery) → HEALTHY

import { describe, it, expect, beforeEach } from 'vitest'
import { ProviderHealthManager } from '@/core/aggregation/health/ProviderHealthManager'
import { ProviderHealthStatus } from '@/core/aggregation/types/aggregation.types'

describe('ProviderHealthManager', () => {
  let health: ProviderHealthManager

  beforeEach(() => { health = new ProviderHealthManager() })

  describe('register()', () => {
    it('should initialize with HEALTHY status', () => {
      health.register('p1', 'Provider 1')
      expect(health.getHealth('p1')).toBe(ProviderHealthStatus.HEALTHY)
    })

    it('should not overwrite existing registration', () => {
      health.register('p1', 'P1')
      health.markFailure('p1') // DEGRADED
      health.register('p1', 'P1-Renamed') // should be noop
      expect(health.getHealth('p1')).toBe(ProviderHealthStatus.DEGRADED)
    })
  })

  describe('unregister()', () => {
    it('should remove state', () => {
      health.register('p1', 'P1')
      health.unregister('p1')
      expect(health.getHealth('p1')).toBe(ProviderHealthStatus.HEALTHY) // default
    })
  })

  describe('State Machine', () => {
    describe('Failure path: HEALTHY → DEGRADED → OFFLINE', () => {
      it('should go to DEGRADED on first failure', () => {
        health.register('p1', 'P1')
        health.markFailure('p1')
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.DEGRADED)
      })

      it('should stay DEGRADED for failures 2-4', () => {
        health.register('p1', 'P1')
        for (let i = 0; i < 4; i++) health.markFailure('p1')
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.DEGRADED)
      })

      it('should go OFFLINE after 5 consecutive failures', () => {
        health.register('p1', 'P1')
        for (let i = 0; i < 5; i++) health.markFailure('p1')
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.OFFLINE)
      })
    })

    describe('Recovery path: DEGRADED → HEALTHY', () => {
      it('should recover after 3 consecutive successes', () => {
        health.register('p1', 'P1')
        health.markFailure('p1') // DEGRADED
        health.markFailure('p1') // 2 failures
        health.markSuccess('p1') // reset failures, 1 success
        health.markSuccess('p1') // 2 successes
        health.markSuccess('p1') // 3 successes → HEALTHY
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.HEALTHY)
      })
    })

    describe('Recovery path: OFFLINE → HEALTHY', () => {
      it('should recover from OFFLINE after 3 consecutive successes', () => {
        health.register('p1', 'P1')
        for (let i = 0; i < 5; i++) health.markFailure('p1') // OFFLINE
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.OFFLINE)

        for (let i = 0; i < 3; i++) health.markSuccess('p1')
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.HEALTHY)
      })
    })

    describe('FAILED state', () => {
      it('should set FAILED status', () => {
        health.register('p1', 'P1')
        health.markFailed('p1')
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.FAILED)
        expect(health.isHealthy('p1')).toBe(false)
      })
    })

    describe('Interleaved success/failure', () => {
      it('should reset counters on alternating results', () => {
        health.register('p1', 'P1')
        health.markFailure('p1') // DEGRADED, failCount=1
        health.markSuccess('p1') // reset failures, success=1
        health.markFailure('p1') // DEGRADED, failCount=1, success reset
        expect(health.getHealth('p1')).toBe(ProviderHealthStatus.DEGRADED)
      })
    })
  })

  describe('isHealthy()', () => {
    it('should return false for OFFLINE', () => {
      health.register('p1', 'P1')
      for (let i = 0; i < 5; i++) health.markFailure('p1')
      expect(health.isHealthy('p1')).toBe(false)
    })

    it('should return false for FAILED', () => {
      health.register('p1', 'P1')
      health.markFailed('p1')
      expect(health.isHealthy('p1')).toBe(false)
    })

    it('should return true for HEALTHY and DEGRADED', () => {
      health.register('p1', 'P1')
      expect(health.isHealthy('p1')).toBe(true)
      health.markFailure('p1')
      expect(health.isHealthy('p1')).toBe(true) // DEGRADED still usable
    })
  })

  describe('getHealthyProviderIds()', () => {
    it('should exclude OFFLINE and FAILED', () => {
      health.register('p1', 'Healthy')
      health.register('p2', 'Degraded')
      health.markFailure('p2')
      health.register('p3', 'Offline')
      for (let i = 0; i < 5; i++) health.markFailure('p3')
      health.register('p4', 'Failed')
      health.markFailed('p4')

      const ids = health.getHealthyProviderIds()
      expect(ids).toContain('p1')
      expect(ids).toContain('p2')
      expect(ids).not.toContain('p3')
      expect(ids).not.toContain('p4')
    })
  })

  describe('getAllSnapshots()', () => {
    it('should return all states', () => {
      health.register('p1', 'P1')
      health.register('p2', 'P2')
      const snapshots = health.getAllSnapshots()
      expect(snapshots).toHaveLength(2)
      expect(snapshots[0]).toHaveProperty('providerId')
      expect(snapshots[0]).toHaveProperty('status')
    })
  })
})
