// media-servers/contracts/auth.types.ts — CE6.1
// Authentication types for media servers

export type AuthMethod = 'api-key' | 'user-login' | 'token' | 'pin'

export interface AuthCredentials {
  method: AuthMethod
  username?: string
  password?: string
  apiKey?: string
  token?: string
  pin?: string
}

export interface AuthResult {
  success: boolean
  token?: string
  userId?: string
  serverName?: string
  error?: string
}

export interface AuthState {
  authenticated: boolean
  token?: string
  userId?: string
  expiresAt?: number
  lastAuthenticatedAt: number
}
