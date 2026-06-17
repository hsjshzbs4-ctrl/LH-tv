// tests/unit/enterprise/integration-flow.spec.ts — Enterprise 集成流测试
// 验证: Identity → RBAC → Organization → Workspace → Audit 全链路

import { describe, it, expect, vi } from 'vitest'
import {
  IdentityRegistry, IdentityProviderType,
  OrganizationRegistry,
  RBACManager, rbacManager,
  AuditStore, AuditLogger, AuditEvent,
  CompliancePolicy, ComplianceChecker,
  EnterprisePolicy,
} from '@enterprise/index'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
}))

describe('Enterprise Integration Flow', () => {
  it('Identity → RBAC → Org → Workspace → Audit pipeline', () => {
    // 1. Register identity provider
    const idReg = new IdentityRegistry()
    idReg.register({
      id: 'corp-sso', type: IdentityProviderType.SSO, name: 'Corp SSO', enabled: true, config: { url: 'https://sso.corp.com' }, registeredAt: Date.now(),
    })
    expect(idReg.get('corp-sso')).not.toBeNull()

    // 2. Assign RBAC roles
    const rbac = new RBACManager()
    rbac.assignRole('corp:alice', 'admin')
    rbac.assignRole('corp:bob', 'member')
    expect(rbac.hasPermission('corp:alice', 'org.write')).toBe(true)
    expect(rbac.hasPermission('corp:bob', 'org.write')).toBe(false)

    // 3. Create organization
    const orgReg = new OrganizationRegistry()
    const tenant = orgReg.createTenant('Corp')
    expect(tenant.success).toBe(true)
    const dept = orgReg.createDepartment(tenant.tenant!.id, 'Engineering')
    expect(dept.success).toBe(true)
    const ws = orgReg.createWorkspace(tenant.tenant!.id, dept.department!.id, 'Product Team')
    expect(ws.success).toBe(true)

    // 4. Add members to workspace
    orgReg.addWorkspaceMember(ws.workspace!.id, 'corp:alice')
    orgReg.addWorkspaceMember(ws.workspace!.id, 'corp:bob')
    expect(orgReg.getWorkspace(ws.workspace!.id)?.memberIds.length).toBe(2)

    // 5. Export org data
    const exported = orgReg.export()
    expect(exported.tenants.length).toBe(1)
    expect(exported.workspaces.length).toBe(1)

    // 6. Audit entire flow via AuditStore directly
    const store = new AuditStore()
    store.append({ id: 'a1', event: AuditEvent.LOGIN, userId: 'corp:alice', detail: 'login', success: true, timestamp: Date.now() })
    store.append({ id: 'a2', event: AuditEvent.PERMISSION, userId: 'corp:alice', detail: 'org.create', success: true, timestamp: Date.now() })
    store.append({ id: 'a3', event: AuditEvent.WORKSPACE, userId: 'corp:alice', workspaceId: ws.workspace!.id, detail: 'create', success: true, timestamp: Date.now() })

    const entries = store.query({ userId: 'corp:alice' })
    expect(entries.length).toBeGreaterThanOrEqual(3)
  })

  it('EnterprisePolicy maps roles to community actions', () => {
    // EnterprisePolicy uses module-level singleton rbacManager
    rbacManager.assignRole('eptest-admin-x', 'admin')
    rbacManager.assignRole('eptest-viewer-x', 'viewer')

    const adminActions = EnterprisePolicy.getAllowedActions('eptest-admin-x')
    const viewerActions = EnterprisePolicy.getAllowedActions('eptest-viewer-x')
    expect(adminActions.length).toBeGreaterThan(viewerActions.length)
  })

  it('clearTenant cascades across AuditStore', () => {
    const store = new AuditStore()
    store.append({ id: '1', event: AuditEvent.LOGIN, userId: 'acme:u1', tenantId: 'acme', detail: '', success: true, timestamp: Date.now() })
    store.append({ id: '2', event: AuditEvent.LOGIN, userId: 'beta:u1', tenantId: 'beta', detail: '', success: true, timestamp: Date.now() })
    store.clearTenant('acme')
    expect(store.count()).toBe(1)
  })

  it('RBAC clearTenant works', () => {
    const rbac = new RBACManager()
    rbac.assignRole('acme:alice', 'admin')
    rbac.assignRole('beta:bob', 'viewer')
    rbac.clearTenant('acme')
    expect(rbac.hasPermission('acme:alice', 'org.write')).toBe(false)
    expect(rbac.hasPermission('beta:bob', 'workspace.read')).toBe(true)
  })

  it('ComplianceChecker runs all rules successfully', () => {
    const checker = new ComplianceChecker()
    const report = checker.generateReport()
    expect(report.total).toBeGreaterThanOrEqual(5)
    expect(report.failed).toBe(0)
  })

  it('IdentityRegistry export supports backup', () => {
    const reg = new IdentityRegistry()
    reg.register({ id: 's1', type: IdentityProviderType.LDAP, name: 'LDAP', enabled: true, config: {}, registeredAt: Date.now() })
    const exported = reg.export()
    expect(exported.length).toBe(1)
  })
})
