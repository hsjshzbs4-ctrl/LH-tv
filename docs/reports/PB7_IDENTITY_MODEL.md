# PB7-S5 Identity Model
> Date: 2026-06-17

## IdentityProviderType enum: SSO, LDAP, SCIM

## IdentityRegistry (SSOT)
register(), unregister(), get(), list(), listByType(), listEnabled(), export(), clearTenant()

## IdentityProvider (abstract)
authenticate(), getUserInfo(), validateConnection()

## Pipeline
User → IdentityRegistry → IdentityProvider → RBACManager → OrganizationService → WorkspaceService → Application

## Providers
- SSOManager: login via IdentityRegistry.get(providerId)
- LDAPProvider: LDAP binding (stub)
- SCIMProvider: SCIM 2.0 bearer token (stub)
