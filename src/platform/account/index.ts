// src/platform/account/index.ts — S5-1 User Account Platform 统一导出

// Types
export {
  AccountType,
  AuthState,
  type UserAccount,
  type Session,
  type IAuthProvider,
  type AuthResult,
  type AccountEvent,
  type AccountEventTypeValue,
  AccountEventType,
} from './types/account.types'

// Manager
export { UserAccountManager, userAccountManager } from './manager/UserAccountManager'
export { SessionManager, sessionManager } from './manager/SessionManager'

// Auth
export { LocalAuthProvider } from './auth/LocalAuthProvider'
export type { IAuthProvider as AuthProviderInterface } from './auth/AuthProvider'

// Storage
export { AccountStorage, accountStorage } from './storage/AccountStorage'
