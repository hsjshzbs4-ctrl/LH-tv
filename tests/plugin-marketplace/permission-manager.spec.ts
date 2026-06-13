// tests/plugin-marketplace/permission-manager.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PermissionManager } from '@/plugin-marketplace/permissions/PermissionManager'
import { PluginPermission } from '@/plugin-marketplace/permissions/types'

describe('PermissionManager', () => {
  let mgr: PermissionManager
  beforeEach(() => { mgr = new PermissionManager() })

  it('should grant and check permission', () => {
    mgr.grant('p1', PluginPermission.NETWORK_ACCESS)
    expect(mgr.check('p1', PluginPermission.NETWORK_ACCESS)).toBe(true)
  })

  it('should return false for ungranted permission', () => {
    expect(mgr.check('p1', PluginPermission.NETWORK_ACCESS)).toBe(false)
  })

  it('should revoke permission', () => {
    mgr.grant('p1', PluginPermission.NETWORK_ACCESS)
    mgr.revoke('p1', PluginPermission.NETWORK_ACCESS)
    expect(mgr.check('p1', PluginPermission.NETWORK_ACCESS)).toBe(false)
  })

  it('should check multiple permissions', () => {
    mgr.grant('p1', PluginPermission.NETWORK_ACCESS)
    mgr.grant('p1', PluginPermission.STORAGE_ACCESS)
    const result = mgr.checkAll('p1', [PluginPermission.NETWORK_ACCESS, PluginPermission.STORAGE_ACCESS])
    expect(result.granted).toBe(true)
    expect(result.denied).toEqual([])
  })

  it('should report denied permissions', () => {
    mgr.grant('p1', PluginPermission.NETWORK_ACCESS)
    const result = mgr.checkAll('p1', [PluginPermission.NETWORK_ACCESS, PluginPermission.DOWNLOAD_ACCESS])
    expect(result.granted).toBe(false)
    expect(result.denied).toContain(PluginPermission.DOWNLOAD_ACCESS)
  })

  it('should get all permissions for a plugin', () => {
    mgr.grant('p1', PluginPermission.NETWORK_ACCESS)
    mgr.grant('p1', PluginPermission.STORAGE_ACCESS)
    expect(mgr.getPermissions('p1')).toHaveLength(2)
  })

  it('should revoke all permissions', () => {
    mgr.grant('p1', PluginPermission.NETWORK_ACCESS)
    mgr.grant('p1', PluginPermission.STORAGE_ACCESS)
    mgr.revokeAll('p1')
    expect(mgr.getPermissions('p1')).toEqual([])
  })

  it('should notify subscribers on grant', () => {
    let notified = false
    mgr.subscribe(() => { notified = true })
    mgr.grant('p1', PluginPermission.NETWORK_ACCESS)
    expect(notified).toBe(true)
  })
})
