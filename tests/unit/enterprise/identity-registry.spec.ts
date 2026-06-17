// tests/unit/enterprise/identity-registry.spec.ts — IdentityRegistry + SSOManager 单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IdentityRegistry, SSOManager, LDAPProvider, IdentityProviderType } from '@enterprise/index'

vi.mock('@platform/flags', () => ({
  featureFlagManager: { isEnabled: vi.fn().mockReturnValue(true) },
}))

describe('IdentityRegistry', () => {
  let registry: IdentityRegistry

  beforeEach(() => {
    registry = new IdentityRegistry()
  })

  it('registers an identity provider', () => {
    const result = registry.register({
      id: 'sso-main', type: IdentityProviderType.SSO, name: 'Main SSO', enabled: true, config: {}, registeredAt: Date.now(),
    })
    expect(result.success).toBe(true)
  })

  it('rejects duplicate registration', () => {
    registry.register({ id: 'dup', type: IdentityProviderType.LDAP, name: 'Dup', enabled: true, config: {}, registeredAt: Date.now() })
    const result = registry.register({ id: 'dup', type: IdentityProviderType.LDAP, name: 'Dup', enabled: true, config: {}, registeredAt: Date.now() })
    expect(result.success).toBe(false)
  })

  it('lists providers by type', () => {
    registry.register({ id: 's1', type: IdentityProviderType.SSO, name: 'S1', enabled: true, config: {}, registeredAt: Date.now() })
    registry.register({ id: 'l1', type: IdentityProviderType.LDAP, name: 'L1', enabled: true, config: {}, registeredAt: Date.now() })
    expect(registry.listByType(IdentityProviderType.SSO).length).toBe(1)
    expect(registry.listByType(IdentityProviderType.LDAP).length).toBe(1)
  })

  it('exports all providers', () => {
    registry.register({ id: 'e1', type: IdentityProviderType.SSO, name: 'E1', enabled: true, config: {}, registeredAt: Date.now() })
    expect(registry.export().length).toBe(1)
  })

  it('clearTenant removes tenant-specific providers', () => {
    registry.register({ id: 't1', type: IdentityProviderType.SSO, name: 'T1', enabled: true, config: { tenantId: 'acme' }, registeredAt: Date.now() })
    registry.register({ id: 't2', type: IdentityProviderType.SSO, name: 'T2', enabled: true, config: { tenantId: 'beta' }, registeredAt: Date.now() })
    const removed = registry.clearTenant('acme')
    expect(removed).toBe(1)
    expect(registry.list().length).toBe(1)
  })
})

describe('SSOManager', () => {
  it('rejects login for unregistered provider', async () => {
    const mgr = new SSOManager()
    const result = await mgr.login('nonexistent', {})
    expect(result.success).toBe(false)
  })

  it('lists registered SSO providers', () => {
    const mgr = new SSOManager()
    const providers = mgr.listProviders()
    expect(Array.isArray(providers)).toBe(true)
  })
})
