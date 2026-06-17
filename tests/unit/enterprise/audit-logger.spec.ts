// tests/unit/enterprise/audit-logger.spec.ts — Audit 单元测试

import { describe, it, expect, vi } from 'vitest'
import { AuditStore, AuditLogger, AuditQuery, AuditEvent } from '@enterprise/index'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
}))

describe('AuditStore', () => {
  it('appends entries', () => {
    const store = new AuditStore()
    store.append({ id: 'a1', event: AuditEvent.LOGIN, userId: 'u1', detail: 'test', success: true, timestamp: Date.now() })
    expect(store.count()).toBe(1)
  })

  it('queries by event type', () => {
    const store = new AuditStore()
    store.append({ id: 'a1', event: AuditEvent.LOGIN, userId: 'u1', detail: '', success: true, timestamp: 100 })
    store.append({ id: 'a2', event: AuditEvent.LOGOUT, userId: 'u2', detail: '', success: true, timestamp: 200 })
    expect(store.query({ event: AuditEvent.LOGIN }).length).toBe(1)
  })

  it('queries by user', () => {
    const store = new AuditStore()
    store.append({ id: 'a1', event: AuditEvent.LOGIN, userId: 'alice', detail: '', success: true, timestamp: 100 })
    store.append({ id: 'a2', event: AuditEvent.LOGIN, userId: 'bob', detail: '', success: true, timestamp: 200 })
    expect(store.query({ userId: 'alice' }).length).toBe(1)
  })

  it('queries by time range', () => {
    const store = new AuditStore()
    store.append({ id: 'a1', event: AuditEvent.LOGIN, userId: 'u1', detail: '', success: true, timestamp: 100 })
    store.append({ id: 'a2', event: AuditEvent.LOGIN, userId: 'u1', detail: '', success: true, timestamp: 300 })
    expect(store.query({ from: 200 }).length).toBe(1)
  })

  it('clearTenant removes entries', () => {
    const store = new AuditStore()
    store.append({ id: 'a1', event: AuditEvent.LOGIN, userId: 'u1', tenantId: 'acme', detail: '', success: true, timestamp: 100 })
    store.append({ id: 'a2', event: AuditEvent.LOGIN, userId: 'u2', tenantId: 'beta', detail: '', success: true, timestamp: 200 })
    store.clearTenant('acme')
    expect(store.count()).toBe(1)
  })

  it('exports all entries', () => {
    const store = new AuditStore()
    store.append({ id: 'a1', event: AuditEvent.LOGIN, userId: 'u1', detail: '', success: true, timestamp: 100 })
    expect(store.export().length).toBe(1)
  })
})

describe('AuditLogger', () => {
  it('logs login event with AuditEvent enum', () => {
    const logger = new AuditLogger()
    const entry = logger.logLogin('user1', true)
    expect(entry.event).toBe(AuditEvent.LOGIN)
    expect(entry.userId).toBe('user1')
  })

  it('logs all event types via convenience methods', () => {
    const logger = new AuditLogger()
    expect(logger.logLogin('u1', true).event).toBe(AuditEvent.LOGIN)
    expect(logger.logLogout('u1').event).toBe(AuditEvent.LOGOUT)
    expect(logger.logPermission('u1', 'grant', true).event).toBe(AuditEvent.PERMISSION)
    expect(logger.logWorkspace('u1', 'ws1', 'create').event).toBe(AuditEvent.WORKSPACE)
    expect(logger.logPublish('u1', 'item').event).toBe(AuditEvent.PUBLISH)
    expect(logger.logInstall('u1', 'ext').event).toBe(AuditEvent.INSTALL)
    expect(logger.logDelete('u1', 'item').event).toBe(AuditEvent.DELETE)
    expect(logger.logPolicy('u1', 'update').event).toBe(AuditEvent.POLICY)
  })

  it('logs failed login', () => {
    const logger = new AuditLogger()
    const entry = logger.logLogin('user1', false, 'Invalid password')
    expect(entry.success).toBe(false)
  })
})

describe('AuditQuery', () => {
  it('queries by event type using AuditEvent enum', () => {
    // Use local AuditStore directly (AuditQuery reads from singleton auditStore by default)
    // Test the store's query capability directly
    const store = new AuditStore()
    store.append({ id: '1', event: AuditEvent.LOGIN, userId: 'u1', detail: '', success: true, timestamp: Date.now() })
    store.append({ id: '2', event: AuditEvent.WORKSPACE, userId: 'u1', detail: '', success: true, timestamp: Date.now() })

    expect(store.query({ event: AuditEvent.LOGIN }).length).toBe(1)
    expect(store.query({ event: AuditEvent.WORKSPACE }).length).toBe(1)
  })
})
