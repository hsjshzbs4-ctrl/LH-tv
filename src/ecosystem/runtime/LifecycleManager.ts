// src/ecosystem/runtime/LifecycleManager.ts — 生命周期管理器
// PB7-S3: 统一状态机 — REGISTERED → INSTALLED → LOADED → RUNNING / STOPPED → UNINSTALLED

import { ExtensionState, type ExtensionManifest } from '../contracts/ExtensionManifest'

/** 合法的状态转换表 */
const VALID_TRANSITIONS: Record<ExtensionState, ExtensionState[]> = {
  [ExtensionState.REGISTERED]: [ExtensionState.INSTALLED, ExtensionState.UNINSTALLED],
  [ExtensionState.INSTALLED]: [ExtensionState.LOADED, ExtensionState.UNINSTALLED],
  [ExtensionState.LOADED]: [ExtensionState.RUNNING, ExtensionState.STOPPED, ExtensionState.UNINSTALLED],
  [ExtensionState.RUNNING]: [ExtensionState.STOPPED, ExtensionState.UNINSTALLED],
  [ExtensionState.STOPPED]: [ExtensionState.RUNNING, ExtensionState.UNINSTALLED],
  [ExtensionState.UNINSTALLED]: [ExtensionState.REGISTERED],
}

/** 生命周期事件 */
export type LifecycleEvent =
  | 'onRegister'
  | 'onInstall'
  | 'onLoad'
  | 'onStart'
  | 'onStop'
  | 'onUninstall'

/** 生命周期钩子 */
export interface LifecycleHooks {
  onRegister?(): Promise<void>
  onInstall?(): Promise<void>
  onLoad?(): Promise<void>
  onStart?(): Promise<void>
  onStop?(): Promise<void>
  onUninstall?(): Promise<void>
}

/** 扩展运行时实例 */
export interface ExtensionInstance {
  manifest: ExtensionManifest
  state: ExtensionState
  hooks?: LifecycleHooks
  error?: string
  registeredAt: number
  updatedAt: number
}

/** 状态变更监听器 */
export type StateChangeListener = (instance: ExtensionInstance, from: ExtensionState, to: ExtensionState) => void

export class LifecycleManager {
  private instances = new Map<string, ExtensionInstance>()
  private listeners = new Set<StateChangeListener>()

  /** 注册扩展 */
  register(manifest: ExtensionManifest): { success: boolean; error?: string } {
    if (this.instances.has(manifest.id)) {
      return { success: false, error: `Extension "${manifest.id}" already registered` }
    }

    const instance: ExtensionInstance = {
      manifest,
      state: ExtensionState.REGISTERED,
      registeredAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.instances.set(manifest.id, instance)
    return { success: true }
  }

  /** 获取扩展实例 */
  get(extensionId: string): ExtensionInstance | null {
    return this.instances.get(extensionId) ?? null
  }

  /** 获取所有实例 */
  list(): ExtensionInstance[] {
    return Array.from(this.instances.values())
  }

  /** 按状态过滤 */
  listByState(state: ExtensionState): ExtensionInstance[] {
    return this.list().filter((i) => i.state === state)
  }

  /** 状态转换 */
  async transition(extensionId: string, to: ExtensionState): Promise<{ success: boolean; error?: string }> {
    const instance = this.instances.get(extensionId)
    if (!instance) {
      return { success: false, error: `Extension "${extensionId}" not found` }
    }

    const from = instance.state

    // 验证状态转换合法性
    const allowed = VALID_TRANSITIONS[from]
    if (!allowed.includes(to)) {
      return {
        success: false,
        error: `Invalid transition: ${from} → ${to}. Allowed: ${allowed.join(', ')}`,
      }
    }

    // 执行生命周期钩子
    try {
      const hookName = this.stateToHook(to)
      if (hookName && instance.hooks?.[hookName]) {
        await instance.hooks[hookName]!()
      }
    } catch (err) {
      instance.error = String(err)
      return { success: false, error: `Lifecycle hook failed: ${String(err)}` }
    }

    instance.state = to
    instance.updatedAt = Date.now()
    instance.error = undefined

    // 通知监听器
    for (const listener of this.listeners) {
      try { listener(instance, from, to) } catch { /* 监听器异常不影响状态转换 */ }
    }

    return { success: true }
  }

  /** 设置生命周期钩子 */
  setHooks(extensionId: string, hooks: LifecycleHooks): void {
    const instance = this.instances.get(extensionId)
    if (instance) {
      instance.hooks = hooks
    }
  }

  /** 设置错误 */
  setError(extensionId: string, error: string): void {
    const instance = this.instances.get(extensionId)
    if (instance) {
      instance.error = error
      instance.updatedAt = Date.now()
    }
  }

  /** 监听状态变更 */
  onStateChange(listener: StateChangeListener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** 删除扩展 */
  remove(extensionId: string): boolean {
    return this.instances.delete(extensionId)
  }

  /** 统计 */
  stats(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const state of Object.values(ExtensionState)) {
      result[state] = 0
    }
    for (const instance of this.instances.values()) {
      result[instance.state] = (result[instance.state] ?? 0) + 1
    }
    return result
  }

  // ── 内部 ──

  private stateToHook(state: ExtensionState): keyof LifecycleHooks | null {
    const map: Partial<Record<ExtensionState, keyof LifecycleHooks>> = {
      [ExtensionState.REGISTERED]: 'onRegister',
      [ExtensionState.INSTALLED]: 'onInstall',
      [ExtensionState.LOADED]: 'onLoad',
      [ExtensionState.RUNNING]: 'onStart',
      [ExtensionState.STOPPED]: 'onStop',
      [ExtensionState.UNINSTALLED]: 'onUninstall',
    }
    return map[state] ?? null
  }
}

export const lifecycleManager = new LifecycleManager()
