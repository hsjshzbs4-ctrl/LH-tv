// tests/unit/enterprise/rbac-manager.spec.ts — RBAC + RoleDefinition 单元测试

import { describe, it, expect, vi } from 'vitest'
import { RBACManager, getRoleById, roleHasPermission, BUILTIN_ROLES } from '@enterprise/index'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
}))

describe('RoleDefinition', () => {
  it('finds built-in admin role', () => {
    const admin = getRoleById('admin')
    expect(admin).not.toBeNull()
    expect(admin!.permissions).toContain('org.*')
  })

  it('finds built-in viewer role', () => {
    const viewer = getRoleById('viewer')
    expect(viewer).not.toBeNull()
    expect(viewer!.permissions).toContain('workspace.read')
  })

  it('returns null for unknown role', () => {
    expect(getRoleById('superhero')).toBeNull()
  })

  it('roleHasPermission supports wildcards', () => {
    const admin = getRoleById('admin')!
    expect(roleHasPermission(admin, 'org.read')).toBe(true)
    expect(roleHasPermission(admin, 'org.write')).toBe(true)
    expect(roleHasPermission(admin, 'workspace.read')).toBe(true)
  })

  it('viewer lacks admin permissions', () => {
    const viewer = getRoleById('viewer')!
    expect(roleHasPermission(viewer, 'org.write')).toBe(false)
    expect(roleHasPermission(viewer, 'compliance.write')).toBe(false)
  })

  it('all built-in roles have valid permission refs', () => {
    for (const role of BUILTIN_ROLES) {
      expect(role.id).toBeTruthy()
      expect(role.permissions.length).toBeGreaterThan(0)
      for (const pid of role.permissions) {
        expect(typeof pid).toBe('string')
      }
    }
  })
})

describe('RBACManager', () => {
  it('assigns role to user', () => {
    const mgr = new RBACManager()
    const r = mgr.assignRole('user1', 'admin')
    expect(r.success).toBe(true)
  })

  it('rejects unknown role', () => {
    const mgr = new RBACManager()
    const r = mgr.assignRole('user1', 'superhero')
    expect(r.success).toBe(false)
  })

  it('checks user permission', () => {
    const mgr = new RBACManager()
    mgr.assignRole('user1', 'admin')
    expect(mgr.hasPermission('user1', 'org.write')).toBe(true)
    expect(mgr.hasPermission('user1', 'community.delete')).toBe(true)
  })

  it('returns false for user without permission', () => {
    const mgr = new RBACManager()
    mgr.assignRole('user1', 'viewer')
    expect(mgr.hasPermission('user1', 'org.write')).toBe(false)
  })

  it('batch permission check', () => {
    const mgr = new RBACManager()
    mgr.assignRole('user1', 'manager')
    expect(mgr.hasAllPermissions('user1', ['org.read', 'workspace.read'])).toBe(true)
    expect(mgr.hasAllPermissions('user1', ['org.read', 'org.write'])).toBe(false)
  })

  it('exports roles and user assignments', () => {
    const mgr = new RBACManager()
    mgr.assignRole('user1', 'member')
    const data = mgr.export()
    expect(data.roles.length).toBe(4) // admin, manager, member, viewer
    expect(data.userRoles.length).toBe(1)
  })

  it('clearTenant removes tenant-scoped users', () => {
    const mgr = new RBACManager()
    mgr.assignRole('acme:user1', 'member')
    mgr.assignRole('beta:user2', 'viewer')
    const removed = mgr.clearTenant('acme')
    expect(removed).toBe(1)
    expect(mgr.hasPermission('acme:user1', 'workspace.read')).toBe(false)
    expect(mgr.hasPermission('beta:user2', 'workspace.read')).toBe(true)
  })
})
