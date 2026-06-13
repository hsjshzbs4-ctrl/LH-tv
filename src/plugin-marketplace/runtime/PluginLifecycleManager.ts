// src/plugin-marketplace/runtime/PluginLifecycleManager.ts — 插件生命周期管理器
// P5.1 Plugin Marketplace Core
import { pluginStorage } from '../storage/PluginStorage'
import { PluginState } from '../storage/types'
import type { PluginLifecycleHooks, RuntimePlugin, PluginMetrics } from './types'

type Subscriber = (pluginId: string, state: PluginState) => void

export class PluginLifecycleManager {
  private instances = new Map<string, RuntimePlugin>()
  private subscribers = new Set<Subscriber>()

  /** 获取或创建运行时实例 */
  getOrCreate(pluginId: string, hooks: PluginLifecycleHooks = {}): RuntimePlugin {
    let instance = this.instances.get(pluginId)
    if (!instance) {
      const meta = pluginStorage.getPlugin(pluginId)
      instance = {
        id: pluginId,
        state: meta?.enabled ? PluginState.ENABLED : PluginState.INSTALLED,
        hooks,
        metrics: this._emptyMetrics(),
      }
      this.instances.set(pluginId, instance)
    }
    return instance
  }

  /** 启用插件 */
  async enable(pluginId: string): Promise<void> {
    const instance = this.getOrCreate(pluginId)
    await this._transition(pluginId, instance, PluginState.ENABLED)
  }

  /** 禁用插件 */
  async disable(pluginId: string): Promise<void> {
    const instance = this.getOrCreate(pluginId)
    await this._transition(pluginId, instance, PluginState.DISABLED)
  }

  /** 获取状态 */
  getState(pluginId: string): PluginState {
    return this.instances.get(pluginId)?.state || PluginState.INSTALLED
  }

  /** 获取指标 */
  getMetrics(pluginId: string): PluginMetrics {
    return this.instances.get(pluginId)?.metrics || this._emptyMetrics()
  }

  /** 记录错误 */
  recordError(pluginId: string, error: string): void {
    const instance = this.instances.get(pluginId)
    if (!instance) return
    instance.metrics.errors++
    instance.metrics.lastError = error
    instance.metrics.lastErrorTime = Date.now()
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb)
    return () => { this.subscribers.delete(cb) }
  }

  private async _transition(pluginId: string, instance: RuntimePlugin, target: PluginState): Promise<void> {
    if (instance.state === target) return
    const prev = instance.state

    // Invoke hooks
    try {
      if (target === PluginState.ENABLED && instance.hooks.onEnable) {
        await instance.hooks.onEnable()
      }
      if (target === PluginState.DISABLED && instance.hooks.onDisable) {
        await instance.hooks.onDisable()
      }
    } catch (err) {
      instance.metrics.errors++
      instance.metrics.lastError = (err as Error).message
    }

    instance.state = target
    instance.metrics.stateChanges++

    // Persist
    const meta = pluginStorage.getPlugin(pluginId)
    if (meta) {
      meta.enabled = target === PluginState.ENABLED
      await pluginStorage.savePlugin(meta)
    }

    this._notify(pluginId, target)
  }

  private _emptyMetrics(): PluginMetrics {
    return { cpuUsage: 0, memoryUsage: 0, errors: 0, stateChanges: 0, permissionDenials: 0 }
  }

  private _notify(pluginId: string, state: PluginState): void {
    this.subscribers.forEach(fn => { try { fn(pluginId, state) } catch { /* */ } })
  }
}

export const pluginLifecycleManager = new PluginLifecycleManager()
