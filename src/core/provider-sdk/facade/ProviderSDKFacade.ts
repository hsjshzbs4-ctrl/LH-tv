// src/core/provider-sdk/facade/ProviderSDKFacade.ts - Provider SDK 门面
// P4.3 Provider SDK
//
// View 层唯一切入点：Provider 管理（安装/卸载/启用/禁用/重载）
// 禁止 View 直接访问 ProviderLoader / ManifestParser

import { ProviderLoader } from '../loader/ProviderLoader'
import type { LoadResult, InstalledProvider } from '../types/provider-sdk.types'
import type { IProvider } from '@provider-contracts'

export class ProviderSDKFacade {
  private loader = new ProviderLoader()

  /** 加载所有 Provider 插件 */
  async loadAllProviders(): Promise<LoadResult[]> {
    return this.loader.loadAllProviders()
  }

  /** 重载指定 Provider */
  async reloadProvider(pluginId: string): Promise<LoadResult> {
    return this.loader.reloadProvider(pluginId)
  }

  /** 卸载 Provider */
  uninstallProvider(pluginId: string): boolean {
    return this.loader.unloadProvider(pluginId)
  }

  /** 启用 Provider */
  enableProvider(pluginId: string): boolean {
    return this.loader.enableProvider(pluginId)
  }

  /** 禁用 Provider */
  disableProvider(pluginId: string): boolean {
    return this.loader.disableProvider(pluginId)
  }

  /** 获取已安装的 Provider 列表 */
  getInstalledProviders(): InstalledProvider[] {
    return this.loader.getInstalledProviders()
  }

  /** 获取已激活的 Provider 实例（供 ProviderFacade 注册用） */
  getActiveProviders(): IProvider[] {
    return this.loader.getActiveProviders()
  }

  /** 订阅变更 */
  subscribe(callback: () => void): () => void {
    return this.loader.subscribe(callback)
  }
}

/** 全局单例 */
export const providerSDK = new ProviderSDKFacade()
