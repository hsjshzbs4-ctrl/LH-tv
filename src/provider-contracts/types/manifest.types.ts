// src/provider-contracts/types/manifest.types.ts — Provider 清单类型
// P5.0: 从 provider-sdk 提取到共享 contracts 层

import type { IProvider } from '../interfaces/IProvider'

/** Provider 清单 */
export interface ProviderManifest {
  id: string
  name: string
  version: string
  author: string
  description: string
  homepage?: string
  priority: number
  entry: string
}

/** Provider 插件模块导出契约 */
export interface ProviderModule {
  manifest: ProviderManifest
  createProvider: () => IProvider
}
