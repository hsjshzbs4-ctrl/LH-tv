// src/platform/account/types/account.types.ts — S5-1 账户类型定义
// PB5 Auth v2: 只做 Local Account，禁止 OAuth/SSO/External Login

/** 账户类型 */
export enum AccountType {
  /** 本地账户 (默认，零网络调用) */
  LOCAL = 'local',
  /** 云端链接账户 (PB6 实现) */
  CLOUD = 'cloud',
}

/** 用户账户 */
export interface UserAccount {
  /** 唯一 ID */
  id: string
  /** 显示名称 */
  displayName: string
  /** 账户类型 */
  type: AccountType
  /** 头像 URL (可选) */
  avatar?: string
  /** 创建时间 */
  createdAt: number
  /** 最后活跃时间 */
  lastActiveAt: number
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/** 会话 */
export interface Session {
  /** 会话 ID */
  id: string
  /** 关联的账户 ID */
  accountId: string
  /** 签发时间 */
  issuedAt: number
  /** 过期时间 (本地会话永不过期 = 0) */
  expiresAt: number
  /** 是否活跃 */
  active: boolean
}

/** 认证状态 */
export enum AuthState {
  /** 未登录 */
  UNAUTHENTICATED = 'unauthenticated',
  /** 匿名/本地模式 (默认) */
  ANONYMOUS = 'anonymous',
  /** 已认证 */
  AUTHENTICATED = 'authenticated',
}

/** AuthProvider 接口 */
export interface IAuthProvider {
  readonly name: string
  readonly type: AccountType

  /** 执行认证 */
  authenticate(): Promise<AuthResult>
  /** 刷新认证 */
  refresh(): Promise<AuthResult>
  /** 撤销认证 */
  revoke(): Promise<void>
  /** 获取用户资料 */
  getProfile(): Promise<UserAccount | null>
}

/** 认证结果 */
export interface AuthResult {
  success: boolean
  account: UserAccount | null
  session: Session | null
  error?: string
}

/** 账户事件 */
export interface AccountEvent {
  type: AccountEventTypeValue
  accountId?: string
  timestamp: number
  data?: Record<string, unknown>
}

export const AccountEventType = {
  ACCOUNT_CREATED: 'account:created',
  ACCOUNT_UPDATED: 'account:updated',
  ACCOUNT_DELETED: 'account:deleted',
  SESSION_STARTED: 'session:started',
  SESSION_EXPIRED: 'session:expired',
  SESSION_ENDED: 'session:ended',
  PROFILE_UPDATED: 'profile:updated',
} as const

export type AccountEventTypeValue =
  (typeof AccountEventType)[keyof typeof AccountEventType]
