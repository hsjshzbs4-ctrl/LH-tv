// src/provider-host/ProviderHostFacade.ts — Provider 宿主门面
// P5.0: SDK → Registry 桥接，负责 Provider 发现、加载、注册
//
// 职责：
//   - 通过 ProviderSDK 扫描并加载所有插件
//   - 将加载的 Provider 注入到 ProviderFacade
//   - 管理 Provider 生命周期
//
// 禁止：UI、搜索逻辑、直接创建 Provider 实例

import { providerSDK } from '@/core/provider-sdk'
import { providerFacade } from '@/core/providers/ProviderFacade'
import type { IProvider } from '@provider-contracts'

type Subscriber = () => void

export class ProviderHostFacade {
  private initDone = false
  private subscribers = new Set<Subscriber>()

  /**
   * 初始化：扫描插件 → 加载 → 注册到 ProviderFacade
   * 应在 app 启动早期调用
   */
  async initialize(): Promise<void> {
    if (this.initDone) return

    try {
      const results = await providerSDK.loadAllProviders()
      const loaded = results.filter((r) => r.success)
      const failed = results.filter((r) => !r.success)

      // 将成功加载的 Provider 注入到核心 Registry
      const activeProviders = providerSDK.getActiveProviders()
      await providerFacade.initialize(activeProviders)

      if (failed.length > 0) {
        console.warn(
          `[ProviderHost] ${failed.length} 个 Provider 加载失败:`,
          failed.map((f) => `${f.id}: ${f.error}`).join(', '),
        )
      }

      console.log(
        `[ProviderHost] 已加载 ${loaded.length} 个 Provider:`,
        loaded.map((r) => r.id).join(', '),
      )
    } catch (err) {
      console.error('[ProviderHost] Provider 加载异常:', err)
    }

    this.initDone = true
    this._notify()
  }

  /** 重新加载所有 Provider */
  async reload(): Promise<void> {
    this.initDone = false
    await this.initialize()
  }

  /** 订阅初始化完成事件 */
  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  /** 是否已初始化 */
  get isInitialized(): boolean {
    return this.initDone
  }

  private _notify(): void {
    this.subscribers.forEach((fn) => {
      try { fn() } catch { /* ignore */ }
    })
  }
}

/** 全局单例 */
export const providerHost = new ProviderHostFacade()
