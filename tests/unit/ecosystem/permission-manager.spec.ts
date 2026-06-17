// tests/unit/ecosystem/permission-manager.spec.ts — 权限管理器测试
import { describe, it, expect, beforeEach } from 'vitest'
import { PermissionManager, PermissionRiskLevel } from '@ecosystem/index'

describe('PermissionManager', () => {
  let pm: PermissionManager

  beforeEach(() => {
    pm = new PermissionManager()
  })

  it('has built-in permissions loaded', () => {
    const perms = pm.listPermissions()
    expect(perms.length).toBeGreaterThan(0)
    expect(perms.some((p) => p.permissionId === 'storage.read')).toBe(true)
  })

  it('registers a new permission', () => {
    pm.registerPermission({
      permissionId: 'custom.test',
      name: 'Custom Test',
      description: 'A custom test permission',
      riskLevel: PermissionRiskLevel.LOW,
    })
    expect(pm.getPermission('custom.test')).not.toBeNull()
  })

  it('rejects duplicate permission registration', () => {
    expect(() =>
      pm.registerPermission({
        permissionId: 'storage.read',
        name: 'Duplicate',
        description: 'Should fail',
        riskLevel: PermissionRiskLevel.LOW,
      }),
    ).toThrow()
  })

  it('grants permission to extension', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'storage.read', reason: 'testing', timestamp: Date.now() })
    const result = pm.check('test.ext', 'storage.read')
    expect(result.allowed).toBe(true)
  })

  it('denies ungranted permission', () => {
    const result = pm.check('test.ext', 'storage.read')
    expect(result.allowed).toBe(false)
  })

  it('denies unknown permission', () => {
    const result = pm.check('test.ext', 'unknown.perm')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Unknown permission')
  })

  it('flags high-risk permissions for user consent', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'network.fetch', reason: 'api calls', timestamp: Date.now() })
    const result = pm.check('test.ext', 'network.fetch')
    expect(result.allowed).toBe(true)
    expect(result.requiresUserConsent).toBe(true)
  })

  it('flags critical permissions for user consent', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'filesystem.write', reason: 'save data', timestamp: Date.now() })
    const result = pm.check('test.ext', 'filesystem.write')
    expect(result.allowed).toBe(true)
    expect(result.requiresUserConsent).toBe(true)
  })

  it('does not flag low-risk permissions', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'storage.read', reason: 'read config', timestamp: Date.now() })
    const result = pm.check('test.ext', 'storage.read')
    expect(result.allowed).toBe(true)
    expect(result.requiresUserConsent).toBe(false)
  })

  it('revokes permission', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'storage.read', reason: 'testing', timestamp: Date.now() })
    expect(pm.check('test.ext', 'storage.read').allowed).toBe(true)

    pm.revoke('test.ext', 'storage.read')
    expect(pm.check('test.ext', 'storage.read').allowed).toBe(false)
  })

  it('revokes all permissions for extension', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'storage.read', reason: 'r', timestamp: Date.now() })
    pm.grant({ extensionId: 'test.ext', permissionId: 'storage.write', reason: 'w', timestamp: Date.now() })

    pm.revokeAll('test.ext')
    expect(pm.getGrants('test.ext')).toHaveLength(0)
  })

  it('creates audit log entries', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'storage.read', reason: 'test', timestamp: Date.now() })
    pm.check('test.ext', 'storage.read')

    const log = pm.getAuditLog()
    expect(log.length).toBeGreaterThanOrEqual(2)
    expect(log.some((e) => e.action === 'grant')).toBe(true)
    expect(log.some((e) => e.action === 'check')).toBe(true)
  })

  it('checks multiple permissions at once', () => {
    pm.grant({ extensionId: 'test.ext', permissionId: 'storage.read', reason: 'r', timestamp: Date.now() })
    pm.grant({ extensionId: 'test.ext', permissionId: 'notification.send', reason: 'n', timestamp: Date.now() })

    const results = pm.checkAll('test.ext', ['storage.read', 'storage.write', 'notification.send'])
    expect(results).toHaveLength(3)
    expect(results[0].allowed).toBe(true)
    expect(results[1].allowed).toBe(false)
    expect(results[2].allowed).toBe(true)
  })
})
