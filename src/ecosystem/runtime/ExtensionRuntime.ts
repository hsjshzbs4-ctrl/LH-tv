// src/ecosystem/runtime/ExtensionRuntime.ts — 扩展运行时
// PB7-S3: Extension 统一入口 — 加载/卸载/启动/停止
// 强制调用链: Extension → Runtime → PermissionManager → HostAPI → System
// Feature Flag: pb7.extension

import { featureFlagManager } from '@platform/flags'
import { lifecycleManager, type ExtensionInstance } from './LifecycleManager'
import { sandboxManager, type SandboxConfig } from './SandboxManager'
import { validateManifest, type ExtensionManifest } from '../contracts/ExtensionManifest'
import { ExtensionState } from '../contracts/ExtensionManifest'

export class ExtensionRuntime {
  private initialized = false

  /** 初始化运行时 (需 pb7.extension = ON) */
  async initialize(): Promise<void> {
    if (!featureFlagManager.isEnabled('pb7.extension')) return
    if (this.initialized) return
    this.initialized = true
  }

  /** 加载扩展 (完整流程: validate → register → sandbox → install → load → start) */
  async load(
    manifest: unknown,
    sandboxConfig?: Partial<SandboxConfig>,
  ): Promise<{ success: boolean; instance?: ExtensionInstance; error?: string }> {
    this.ensureInitialized()

    // 1. Manifest 校验
    const validation = validateManifest(manifest)
    if (!validation.valid) {
      return { success: false, error: `Manifest validation failed: ${validation.errors.join('; ')}` }
    }
    const validManifest = manifest as ExtensionManifest

    // 2. 注册到生命周期
    const regResult = lifecycleManager.register(validManifest)
    if (!regResult.success) {
      return { success: false, error: regResult.error }
    }

    // 3. 创建沙箱
    sandboxManager.create(validManifest.id, sandboxConfig)

    // 4. 状态流转: REGISTERED → INSTALLED → LOADED → RUNNING
    const installResult = await lifecycleManager.transition(validManifest.id, ExtensionState.INSTALLED)
    if (!installResult.success) {
      return { success: false, error: `Install failed: ${installResult.error}` }
    }

    const loadResult = await lifecycleManager.transition(validManifest.id, ExtensionState.LOADED)
    if (!loadResult.success) {
      return { success: false, error: `Load failed: ${loadResult.error}` }
    }

    const startResult = await lifecycleManager.transition(validManifest.id, ExtensionState.RUNNING)
    if (!startResult.success) {
      return { success: false, error: `Start failed: ${startResult.error}` }
    }

    const instance = lifecycleManager.get(validManifest.id)

    return { success: true, instance: instance ?? undefined }
  }

  /** 停止扩展 */
  async stop(extensionId: string): Promise<{ success: boolean; error?: string }> {
    this.ensureInitialized()
    return lifecycleManager.transition(extensionId, ExtensionState.STOPPED)
  }

  /** 重启扩展 */
  async restart(extensionId: string): Promise<{ success: boolean; error?: string }> {
    this.ensureInitialized()

    const restartCheck = sandboxManager.recordRestart(extensionId)
    if (!restartCheck.allowed) {
      return { success: false, error: restartCheck.reason }
    }

    const stopResult = await lifecycleManager.transition(extensionId, ExtensionState.STOPPED)
    if (!stopResult.success) return stopResult

    return lifecycleManager.transition(extensionId, ExtensionState.RUNNING)
  }

  /** 卸载扩展 */
  async unload(extensionId: string): Promise<{ success: boolean; error?: string }> {
    this.ensureInitialized()

    const instance = lifecycleManager.get(extensionId)
    if (!instance) {
      return { success: false, error: `Extension "${extensionId}" not found` }
    }

    // 如果正在运行，先停止
    if (instance.state === ExtensionState.RUNNING) {
      const stopResult = await lifecycleManager.transition(extensionId, ExtensionState.STOPPED)
      if (!stopResult.success) return stopResult
    }

    // 卸载
    const uninstallResult = await lifecycleManager.transition(extensionId, ExtensionState.UNINSTALLED)
    if (!uninstallResult.success) return uninstallResult

    // 销毁沙箱
    sandboxManager.destroy(extensionId)
    lifecycleManager.remove(extensionId)

    return { success: true }
  }

  /** 获取扩展 */
  get(extensionId: string): ExtensionInstance | null {
    return lifecycleManager.get(extensionId)
  }

  /** 列出所有运行的扩展 */
  listRunning(): ExtensionInstance[] {
    return lifecycleManager.listByState(ExtensionState.RUNNING)
  }

  /** 列出所有扩展 */
  listAll(): ExtensionInstance[] {
    return lifecycleManager.list()
  }

  /** 是否可用 */
  isAvailable(): boolean {
    return this.initialized && featureFlagManager.isEnabled('pb7.extension')
  }

  /** 运行时统计 */
  stats() {
    return {
      available: this.isAvailable(),
      lifecycle: lifecycleManager.stats(),
      sandboxes: sandboxManager.list().length,
    }
  }

  // ── 内部 ──

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Extension Runtime not initialized. Ensure pb7.extension flag is enabled.')
    }
  }
}

export const extensionRuntime = new ExtensionRuntime()
