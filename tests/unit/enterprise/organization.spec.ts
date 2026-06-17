// tests/unit/enterprise/organization.spec.ts — Organization + Workspace 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrganizationRegistry, OrganizationService, WorkspaceService, organizationRegistry } from '@enterprise/index'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
}))

describe('OrganizationRegistry', () => {
  let registry: OrganizationRegistry

  beforeEach(() => {
    registry = new OrganizationRegistry()
  })

  it('creates tenant', () => {
    const r = registry.createTenant('Acme Corp')
    expect(r.success).toBe(true)
    expect(r.tenant?.name).toBe('Acme Corp')
  })

  it('creates department under tenant', () => {
    const t = registry.createTenant('Acme')
    const r = registry.createDepartment(t.tenant!.id, 'Engineering')
    expect(r.success).toBe(true)
    expect(r.department?.tenantId).toBe(t.tenant!.id)
  })

  it('rejects department for non-existent tenant', () => {
    const r = registry.createDepartment('nonexistent', 'Eng')
    expect(r.success).toBe(false)
  })

  it('creates workspace with tenant isolation', () => {
    const t = registry.createTenant('Acme')
    const d = registry.createDepartment(t.tenant!.id, 'Engineering')
    const r = registry.createWorkspace(t.tenant!.id, d.department!.id, 'Project Alpha')
    expect(r.success).toBe(true)
    expect(r.workspace?.tenantId).toBe(t.tenant!.id)
  })

  it('rejects workspace for cross-tenant department', () => {
    const t1 = registry.createTenant('Acme')
    const t2 = registry.createTenant('Beta')
    const d2 = registry.createDepartment(t2.tenant!.id, 'Beta Eng')
    const r = registry.createWorkspace(t1.tenant!.id, d2.department!.id, 'Cross')
    expect(r.success).toBe(false)
  })

  it('lists workspaces by tenant only', () => {
    const t1 = registry.createTenant('Acme')
    const t2 = registry.createTenant('Beta')
    const d1 = registry.createDepartment(t1.tenant!.id, 'Eng')
    const d2 = registry.createDepartment(t2.tenant!.id, 'Eng')
    registry.createWorkspace(t1.tenant!.id, d1.department!.id, 'WS1')
    registry.createWorkspace(t2.tenant!.id, d2.department!.id, 'WS2')
    expect(registry.listWorkspaces(t1.tenant!.id).length).toBe(1)
  })

  it('manages workspace members', () => {
    const t = registry.createTenant('Acme')
    const d = registry.createDepartment(t.tenant!.id, 'Eng')
    const ws = registry.createWorkspace(t.tenant!.id, d.department!.id, 'WS')
    expect(registry.addWorkspaceMember(ws.workspace!.id, 'user1')).toBe(true)
    expect(registry.addWorkspaceMember(ws.workspace!.id, 'user2')).toBe(true)
    expect(registry.getWorkspace(ws.workspace!.id)?.memberIds.length).toBe(2)
    expect(registry.removeWorkspaceMember(ws.workspace!.id, 'user1')).toBe(true)
    expect(registry.getWorkspace(ws.workspace!.id)?.memberIds.length).toBe(1)
  })

  it('exports all data', () => {
    const t = registry.createTenant('Acme')
    registry.createDepartment(t.tenant!.id, 'Eng')
    const data = registry.export()
    expect(data.tenants.length).toBe(1)
    expect(data.departments.length).toBe(1)
  })

  it('clearTenant removes all tenant data', () => {
    const t = registry.createTenant('Acme')
    registry.createDepartment(t.tenant!.id, 'Eng')
    const result = registry.clearTenant(t.tenant!.id)
    expect(result.removed).toBeGreaterThanOrEqual(1)
    expect(registry.listTenants().length).toBe(0)
  })
})

describe('WorkspaceService', () => {
  it('enforces cross-tenant isolation in get()', () => {
    // WorkspaceService uses singleton organizationRegistry
    const t1 = organizationRegistry.createTenant('AcmeCorp')
    const d1 = organizationRegistry.createDepartment(t1.tenant!.id, 'Engineering')
    const ws = organizationRegistry.createWorkspace(t1.tenant!.id, d1.department!.id, 'ProjectWS')

    const svc = new WorkspaceService()
    // Access from same tenant works
    const found = svc.get(ws.workspace!.id, t1.tenant!.id)
    expect(found).not.toBeNull()

    // Access from different tenant returns null
    const notFound = svc.get(ws.workspace!.id, 'other-tenant')
    expect(notFound).toBeNull()
  })
})
