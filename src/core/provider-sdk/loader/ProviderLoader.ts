// src/core/provider-sdk/loader/ProviderLoader.ts - Provider 插件加载器
// P4.3 Provider SDK
//
// 职责：扫描插件目录 → 解析 manifest → 校验 → 动态加载 → 注册
// 禁止：UI、搜索逻辑
//
// 架构：
//   ProviderLoader
//     ├── import.meta.glob (扫描 plugins/*/index.ts + plugins/*/provider.json)
//     ├── ManifestParser (解析 provider.json)
//     ├── ProviderValidator (校验 Provider 接口)
//     └── ProviderRegistry.registerPlugin() (注册到注册中心)

import { ManifestParser } from '../manifest/ManifestParser'
import { ProviderValidator } from '../validator/ProviderValidator'
import type {
  ProviderManifest,
  ProviderModule,
  ProviderLoaderConfig,
  LoadResult,
  InstalledProvider,
} from '../types/provider-sdk.types'
import { ProviderState } from '../types/provider-sdk.types'
import type { IProvider } from '@provider-contracts'

type Subscriber = () => void

/** Vite import.meta.glob 返回类型 */
type GlobModules = Record<string, unknown>

export class ProviderLoader {
  private manifestParser = new ManifestParser()
  private validator = new ProviderValidator()
  private subscribers = new Set<Subscriber>()

  /** manifest.id → { manifest, provider, state, error } */
  private registry = new Map<
    string,
    {
      manifest: ProviderManifest
      provider: IProvider | null
      state: ProviderState
      error?: string
    }
  >()

  /** Vite 静态 glob：扫描所有插件模块（字面量，不可模板化） */
  private static pluginModules = import.meta.glob<ProviderModule>(
    '/plugins/*/index.ts',
    { eager: true },
  )

  /**
   * 加载所有 Provider 插件
   */
  async loadAllProviders(): Promise<LoadResult[]> {
    const results: LoadResult[] = []

    try {
      for (const [path, module] of Object.entries(ProviderLoader.pluginModules)) {
        const dirName = path.split('/').slice(-2, -1)[0] || 'unknown'
        const result = await this._loadModule(dirName, module)
        results.push(result)
      }
    } catch (err) {
      console.error('[ProviderLoader] 扫描插件目录失败:', err)
    }

    this._notify()
    return results
  }

  /**
   * 加载单个 Provider（从已扫描的 glob 中查找）
   */
  async loadProvider(pluginId: string): Promise<LoadResult> {
    const key = `/plugins/${pluginId}/index.ts`
    const module = ProviderLoader.pluginModules[key]

    if (!module) {
      return { id: pluginId, success: false, state: ProviderState.FAILED, error: '模块未找到' }
    }

    // 如果已经加载过，先卸载
    this.unloadProvider(pluginId)

    const result = await this._loadModule(pluginId, module)
    this._notify()
    return result
  }

  /**
   * 卸载 Provider
   */
  unloadProvider(pluginId: string): boolean {
    const entry = this.registry.get(pluginId)
    if (!entry) return false
    this.registry.delete(pluginId)
    this._notify()
    return true
  }

  /**
   * 重载 Provider（unload → load）
   */
  async reloadProvider(pluginId: string): Promise<LoadResult> {
    this.unloadProvider(pluginId)
    return this.loadProvider(pluginId)
  }

  // ==================== 查询 ====================

  /** 获取已安装的 Provider 列表（用于设置页） */
  getInstalledProviders(): InstalledProvider[] {
    return Array.from(this.registry.values()).map((entry) => ({
      id: entry.manifest.id,
      name: entry.manifest.name,
      version: entry.manifest.version,
      author: entry.manifest.author,
      description: entry.manifest.description,
      state: entry.state,
      priority: entry.manifest.priority,
      error: entry.error,
    }))
  }

  /** 获取已加载且启用的 Provider 实例列表 */
  getActiveProviders(): IProvider[] {
    return Array.from(this.registry.values())
      .filter((e) => e.state === ProviderState.LOADED && e.provider)
      .map((e) => e.provider!)
  }

  /** 获取单个 Provider 实例 */
  getProvider(pluginId: string): IProvider | null {
    const entry = this.registry.get(pluginId)
    return entry?.provider || null
  }

  /** 启用 Provider */
  enableProvider(pluginId: string): boolean {
    const entry = this.registry.get(pluginId)
    if (!entry || !entry.provider) return false
    entry.provider.enabled = true
    entry.state = ProviderState.LOADED
    this._notify()
    return true
  }

  /** 禁用 Provider */
  disableProvider(pluginId: string): boolean {
    const entry = this.registry.get(pluginId)
    if (!entry || !entry.provider) return false
    entry.provider.enabled = false
    entry.state = ProviderState.DISABLED
    this._notify()
    return true
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  // ==================== 内部 ====================

  private async _loadModule(
    pluginId: string,
    module: ProviderModule,
  ): Promise<LoadResult> {
    try {
      // Unwrap default export if plugin uses `export default`
      const mod = (module as any).default ? (module as any).default as ProviderModule : module

      // 1. 读取 manifest
      const manifest = mod.manifest
      if (!manifest) {
        return {
          id: pluginId,
          success: false,
          state: ProviderState.FAILED,
          error: 'provider.json 未找到或格式错误',
        }
      }

      // 2. 校验 manifest
      const manifestErrors = this.manifestParser.validate(manifest)
      if (manifestErrors.length > 0) {
        return {
          id: pluginId,
          success: false,
          state: ProviderState.FAILED,
          error: `Manifest 校验失败: ${manifestErrors.join('; ')}`,
        }
      }

      // 3. 创建 Provider 实例
      let provider: IProvider
      try {
        provider = mod.createProvider()
      } catch (err) {
        return {
          id: manifest.id,
          success: false,
          state: ProviderState.FAILED,
          error: `创建 Provider 实例失败: ${(err as Error).message}`,
        }
      }

      // 4. 校验 Provider 接口
      const interfaceErrors = this.validator.validate(provider, manifest.id)
      if (interfaceErrors.length > 0) {
        return {
          id: manifest.id,
          success: false,
          state: ProviderState.FAILED,
          error: `接口校验失败: ${interfaceErrors.join('; ')}`,
        }
      }

      // 5. 注册到内部 registry
      this.registry.set(manifest.id, {
        manifest,
        provider,
        state: provider.enabled ? ProviderState.LOADED : ProviderState.DISABLED,
      })

      return { id: manifest.id, success: true, state: ProviderState.LOADED }
    } catch (err) {
      return {
        id: pluginId,
        success: false,
        state: ProviderState.FAILED,
        error: (err as Error).message,
      }
    }
  }

  private _notify(): void {
    this.subscribers.forEach((fn) => {
      try { fn() } catch { /* ignore */ }
    })
  }
}
