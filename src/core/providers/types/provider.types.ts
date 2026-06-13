// src/core/providers/types/provider.types.ts - Provider 接口定义
// P5.0: IProvider 从 provider-contracts 导入并 re-export

// IProvider 从共享 contracts 层 re-export
export type { IProvider } from '@provider-contracts'

/** Provider 元数据 */
export interface ProviderMeta {
  id: string
  name: string
  enabled: boolean
  priority: number
  timeout: number
  maxConcurrent: number
}

/** Provider 健康状态 */
export interface ProviderHealth {
  providerId: string
  status: 'online' | 'offline' | 'unknown'
  lastCheck: number
  responseTime?: number
}

/** Provider 构造选项 */
export interface ProviderOptions {
  timeout?: number
  maxRetries?: number
  headers?: Record<string, string>
}
