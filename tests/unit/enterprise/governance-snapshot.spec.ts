// tests/unit/enterprise/governance-snapshot.spec.ts — Snapshot + EventBus + PolicyVersion 测试
// PB7-S5.1: RegistrySnapshot, GovernanceEventBus, CompliancePolicy.version

import { describe, it, expect, vi } from 'vitest'
import {
  IdentityRegistry, IdentityProviderType,
  OrganizationRegistry,
  RegistrySnapshotService,
  GovernanceEventBus, GovernanceEventType,
  CompliancePolicy,
} from '@enterprise/index'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
}))

// Mock frozen registries
vi.mock('@community/index', async () => {
  const actual = await vi.importActual('@community/index')
  return {
    ...actual,
    communityRegistry: { listAll: vi.fn().mockReturnValue([]) },
  }
})
vi.mock('@ecosystem/index', async () => {
  const actual = await vi.importActual('@ecosystem/index')
  return {
    ...actual,
    marketplaceRegistry: { listAll: vi.fn().mockReturnValue([]) },
  }
})

describe('RegistrySnapshot (IdentityRegistry + OrganizationRegistry)', () => {
  it('IdentityRegistry supports snapshot/restore/checksum', () => {
    const reg = new IdentityRegistry()
    reg.register({ id: 'sso-1', type: IdentityProviderType.SSO, name: 'SSO1', enabled: true, config: {}, registeredAt: 100 })

    const snap = reg.snapshot()
    expect(snap.registry).toBe('IdentityRegistry')
    expect(snap.version).toBe(1)
    expect(snap.data.length).toBe(1)
    expect(snap.checksum).toBeTruthy()

    const cs = reg.checksum()
    expect(cs).toBe(snap.checksum)

    // Restore
    reg.register({ id: 'temp', type: IdentityProviderType.LDAP, name: 'Temp', enabled: true, config: {}, registeredAt: 200 })
    expect(reg.list().length).toBe(2)

    const result = reg.restore(snap)
    expect(result.success).toBe(true)
    expect(reg.list().length).toBe(1)
    expect(reg.get('sso-1')).not.toBeNull()
  })

  it('rejects restore with wrong registry type', () => {
    const reg = new IdentityRegistry()
    const badSnap = { registry: 'WrongRegistry', version: 1, timestamp: 0, checksum: '', data: [] }
    const result = reg.restore(badSnap as any)
    expect(result.success).toBe(false)
  })
})

describe('OrganizationRegistry Snapshot', () => {
  it('supports snapshot/restore roundtrip', () => {
    const reg = new OrganizationRegistry()
    const t = reg.createTenant('Acme')
    reg.createDepartment(t.tenant!.id, 'Engineering')

    const snap = reg.snapshot()
    expect(snap.data.tenants.length).toBe(1)

    // Add more data then restore
    reg.createTenant('Temp')
    expect(reg.listTenants().length).toBe(2)

    const result = reg.restore(snap)
    expect(result.success).toBe(true)
    expect(reg.listTenants().length).toBe(1)
  })

  it('rejects corrupted snapshot', () => {
    const reg = new OrganizationRegistry()
    reg.createTenant('Acme')
    const snap = reg.snapshot()
    snap.checksum = 'ffffffff' // corrupt

    const result = reg.restore(snap)
    expect(result.success).toBe(false)
    expect(result.error).toContain('checksum')
  })
})

describe('RegistrySnapshotService (cross-registry)', () => {
  it('captures system snapshot', () => {
    const snap = RegistrySnapshotService.capture()
    expect(snap.registries.identity).toBeDefined()
    expect(snap.registries.organization).toBeDefined()
    expect(snap.registries.community).toBeDefined()
    expect(snap.registries.marketplace).toBeDefined()
    expect(snap.checksum).toBeTruthy()
  })

  it('computeChecksum is deterministic', () => {
    const cs1 = RegistrySnapshotService.computeChecksum('hello')
    const cs2 = RegistrySnapshotService.computeChecksum('hello')
    expect(cs1).toBe(cs2)
  })
})

describe('GovernanceEventBus', () => {
  it('subscribes and receives events', () => {
    const bus = new GovernanceEventBus()
    const events: string[] = []

    bus.subscribe(GovernanceEventType.ROLE_ASSIGNED, (e) => {
      events.push(e.payload.userId as string)
    })

    bus.publish(GovernanceEventType.ROLE_ASSIGNED, 'rbac', { userId: 'user1' })
    bus.publish(GovernanceEventType.ROLE_ASSIGNED, 'rbac', { userId: 'user2' })

    expect(events).toEqual(['user1', 'user2'])
  })

  it('wildcard listener receives all events', () => {
    const bus = new GovernanceEventBus()
    const types: string[] = []

    bus.subscribeAll((e) => types.push(e.type))

    bus.publish(GovernanceEventType.TENANT_CREATED, 'org', {})
    bus.publish(GovernanceEventType.POLICY_CREATED, 'compliance', {})

    expect(types).toContain(GovernanceEventType.TENANT_CREATED)
    expect(types).toContain(GovernanceEventType.POLICY_CREATED)
  })

  it('unsubscribe works', () => {
    const bus = new GovernanceEventBus()
    let count = 0
    const unsub = bus.subscribe(GovernanceEventType.SYSTEM_ERROR, () => count++)
    bus.publish(GovernanceEventType.SYSTEM_ERROR, 'test', {})
    unsub()
    bus.publish(GovernanceEventType.SYSTEM_ERROR, 'test', {})
    expect(count).toBe(1)
  })

  it('listener exceptions do not affect other listeners', () => {
    const bus = new GovernanceEventBus()
    let received = false
    bus.subscribe(GovernanceEventType.SYSTEM_ERROR, () => { throw new Error('crash') })
    bus.subscribe(GovernanceEventType.SYSTEM_ERROR, () => { received = true })
    bus.publish(GovernanceEventType.SYSTEM_ERROR, 'test', {})
    expect(received).toBe(true)
  })
})

describe('CompliancePolicy Versioning', () => {
  it('starts at version 1 with effectiveAt set', () => {
    const policy = new CompliancePolicy()
    expect(policy.version).toBe(1)
    expect(policy.effectiveAt).toBeGreaterThan(0)
    expect(policy.deprecatedAt).toBeUndefined()
  })

  it('upgrade increments version', () => {
    const policy = new CompliancePolicy()
    const v1 = policy.version
    const result = policy.upgrade()
    expect(result.version).toBe(v1 + 1)
    expect(policy.version).toBe(2)
    expect(policy.versionHistory.length).toBe(2)
  })

  it('deprecate sets deprecatedAt', () => {
    const policy = new CompliancePolicy()
    policy.deprecate()
    expect(policy.deprecatedAt).toBeGreaterThan(0)
  })
})
