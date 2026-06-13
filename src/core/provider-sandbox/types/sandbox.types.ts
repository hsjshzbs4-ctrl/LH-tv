// src/core/provider-sandbox/types/sandbox.types.ts - Provider 沙箱类型定义
// P4.4 Provider Sandbox

import type { IProvider } from '@provider-contracts'

/** 沙箱请求消息 */
export interface SandboxRequest {
  /** 请求 ID（用于关联响应） */
  id: string
  /** Provider ID */
  providerId: string
  /** 调用的方法名 */
  method: 'search' | 'detail' | 'healthCheck'
  /** 方法参数 */
  params: unknown[]
}

/** 沙箱响应消息 */
export interface SandboxResponse {
  /** 对应请求 ID */
  id: string
  /** 是否成功 */
  success: boolean
  /** 返回数据 */
  data?: unknown
  /** 错误信息 */
  error?: string
}

/** Worker 运行状态 */
export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  RESTARTING = 'restarting',
  TERMINATED = 'terminated',
}

/** Worker 状态追踪 */
export interface WorkerState {
  worker: Worker | null
  provider: IProvider | null
  providerId: string
  status: WorkerStatus
  restartCount: number
  totalCalls: number
  failedCalls: number
  lastUsed: number
  /** 是否在 Worker 中运行（false = 主线程隔离） */
  isolated: boolean
}

/** ProviderHost 配置 */
export interface ProviderHostConfig {
  /** 调用超时（ms） */
  timeout: number
  /** 最大重启次数 */
  maxRestarts: number
  /** 内存限制（MB，仅 Worker 模式） */
  memoryLimitMB: number
}

export const DEFAULT_HOST_CONFIG: ProviderHostConfig = {
  timeout: 10_000,
  maxRestarts: 3,
  memoryLimitMB: 128,
}

/** 沙箱调试信息（开发模式） */
export interface SandboxDebugInfo {
  providerId: string
  status: WorkerStatus
  isolated: boolean
  restartCount: number
  totalCalls: number
  failedCalls: number
  /** 估算内存使用（仅 Worker 模式，MB） */
  memoryMB?: number
}
