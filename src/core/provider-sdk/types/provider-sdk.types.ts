// src/core/provider-sdk/types/provider-sdk.types.ts - Provider SDK 类型定义
// P4.3 Provider SDK
// P5.0: ProviderManifest / ProviderModule 从 contracts 层 re-export

import type { IProvider } from '@provider-contracts'

// 从共享 contracts 层 re-export
export type { ProviderManifest, ProviderModule } from '@provider-contracts'

/** Provider 插件运行时状态 */
export enum ProviderState {
  LOADED = 'loaded',
  DISABLED = 'disabled',
  FAILED = 'failed',
  LOADING = 'loading',
}

/** 已安装的 Provider 信息（视图层消费） */
export interface InstalledProvider {
  id: string
  name: string
  version: string
  author: string
  description: string
  state: ProviderState
  priority: number
  /** 错误信息（FAILED 状态时） */
  error?: string
}

/** ProviderLoader 配置 */
export interface ProviderLoaderConfig {
  /** 是否启用热重载（开发模式） */
  hotReload?: boolean
  /** 插件目录（glob pattern） */
  pluginGlob?: string
}

/** 加载结果 */
export interface LoadResult {
  id: string
  success: boolean
  state: ProviderState
  error?: string
}
