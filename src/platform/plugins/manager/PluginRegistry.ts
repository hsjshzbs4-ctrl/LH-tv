// src/platform/plugins/manager/PluginRegistry.ts — 统一插件注册表
// 内存索引 + 持久化存储

import type { PluginManifest, PluginRegistryEntry, PluginCapability } from '../types/plugin.types'
import { PluginType, PluginState } from '../types/plugin.types'
import { storageService } from '@/shared/storage/storage.service'

const REGISTRY_KEY = 'pb5_plugin_registry'

export class PluginRegistry {
  private entries = new Map<string, PluginRegistryEntry>()

  /** 从持久化加载 */
  async load(): Promise<void> {
    try {
      const settings = await storageService.getSettings()
      const raw = settings[REGISTRY_KEY]
      if (raw && typeof raw === 'string') {
        const manifests = JSON.parse(raw) as PluginManifest[]
        for (const m of manifests) {
          this.entries.set(m.id, { manifest: m, capabilities: [] })
        }
      }
    } catch {
      // 无数据
    }
  }

  /** 注册插件 */
  register(manifest: PluginManifest, capabilities: PluginCapability[] = []): void {
    this.entries.set(manifest.id, {
      manifest: { ...manifest, state: PluginState.INSTALLED },
      capabilities,
    })
  }

  /** 注销插件 */
  unregister(id: string): boolean {
    return this.entries.delete(id)
  }

  /** 查找插件 */
  find(id: string): PluginRegistryEntry | null {
    return this.entries.get(id) ?? null
  }

  /** 按类型查找 */
  findByType(type: PluginType): PluginRegistryEntry[] {
    return Array.from(this.entries.values())
      .filter((e) => e.manifest.type === type)
  }

  /** 按状态查找 */
  findByState(state: PluginState): PluginRegistryEntry[] {
    return Array.from(this.entries.values())
      .filter((e) => e.manifest.state === state)
  }

  /** 更新插件状态 */
  setState(id: string, state: PluginState): boolean {
    const entry = this.entries.get(id)
    if (!entry) return false
    entry.manifest.state = state
    entry.manifest.updatedAt = Date.now()
    return true
  }

  /** 列出所有插件 */
  listAll(): PluginRegistryEntry[] {
    return Array.from(this.entries.values())
  }

  /** 获取插件数量 */
  get count(): number {
    return this.entries.size
  }

  /** 持久化 */
  async persist(): Promise<void> {
    const manifests = Array.from(this.entries.values()).map((e) => e.manifest)
    await storageService.setSettings({ [REGISTRY_KEY]: JSON.stringify(manifests) })
  }

  /** 清空 (测试隔离) */
  clear(): void {
    this.entries.clear()
  }
}

export const pluginRegistry = new PluginRegistry()
