// src/platform/plugins/manager/PluginManager.ts — 统一插件管理器
// SSOT: 所有插件操作的唯一入口
// PB5 Adapter Pattern: 包装现有 provider-sdk + plugin-marketplace + developer-platform

import {
  PluginType,
  PluginState,
  type PluginManifest,
  type PluginCapability,
} from '../types/plugin.types'
import { pluginRegistry } from './PluginRegistry'
import { featureFlagManager, FeatureState } from '@platform/flags'

type PluginSubscriber = (manifest: PluginManifest) => void

export class PluginManager {
  private subscribers = new Set<PluginSubscriber>()
  private initialized = false

  /** 初始化 */
  async initialize(): Promise<void> {
    if (this.initialized) return
    if (!featureFlagManager.isEnabled('pb5.plugins')) return

    await pluginRegistry.load()
    this.initialized = true
  }

  /** 安装插件 */
  async install(manifest: PluginManifest, capabilities: PluginCapability[] = []): Promise<void> {
    pluginRegistry.register(manifest, capabilities)
    await pluginRegistry.persist()
    this.notify(manifest)
  }

  /** 卸载插件 */
  async uninstall(id: string): Promise<void> {
    const entry = pluginRegistry.find(id)
    if (!entry) throw new Error(`Plugin not found: ${id}`)

    pluginRegistry.unregister(id)
    await pluginRegistry.persist()
    this.notify({ ...entry.manifest, state: PluginState.DISABLED })
  }

  /** 启用插件 */
  async enable(id: string): Promise<void> {
    const entry = pluginRegistry.find(id)
    if (!entry) throw new Error(`Plugin not found: ${id}`)

    pluginRegistry.setState(id, PluginState.ENABLED)
    await pluginRegistry.persist()
    this.notify(entry.manifest)
  }

  /** 禁用插件 */
  async disable(id: string): Promise<void> {
    const entry = pluginRegistry.find(id)
    if (!entry) throw new Error(`Plugin not found: ${id}`)

    pluginRegistry.setState(id, PluginState.DISABLED)
    await pluginRegistry.persist()
    this.notify(entry.manifest)
  }

  /** 查询插件 */
  getPlugin(id: string): PluginManifest | null {
    return pluginRegistry.find(id)?.manifest ?? null
  }

  /** 按类型查询 */
  getPluginsByType(type: PluginType): PluginManifest[] {
    return pluginRegistry.findByType(type).map((e) => e.manifest)
  }

  /** 列出所有插件 */
  listPlugins(): PluginManifest[] {
    return pluginRegistry.listAll().map((e) => e.manifest)
  }

  /** 获取启用的插件 */
  getEnabledPlugins(): PluginManifest[] {
    return pluginRegistry.findByState(PluginState.ENABLED).map((e) => e.manifest)
  }

  /** 订阅插件变更 */
  subscribe(fn: PluginSubscriber): () => void {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  private notify(manifest: PluginManifest): void {
    for (const sub of this.subscribers) {
      try { sub(manifest) } catch { /* silent */ }
    }
  }
}

export const pluginManager = new PluginManager()
