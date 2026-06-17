// src/enterprise/identity/index.ts — Identity 统一导出

export { IdentityRegistry, identityRegistry } from './IdentityRegistry'
export { IdentityProvider, type AuthenticationResult, type UserInfo } from './IdentityProvider'
export { SSOManager, ssoManager } from './SSOManager'
export { LDAPProvider } from './LDAPProvider'
export { SCIMProvider } from './SCIMProvider'
