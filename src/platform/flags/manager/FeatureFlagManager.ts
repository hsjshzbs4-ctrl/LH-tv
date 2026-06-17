// src/platform/flags/manager/FeatureFlagManager.ts — Feature Flag 核心管理器
// SSOT: 所有 PB5 功能的唯一控制点
// PB5 Auth v2: FeatureState 三级门控，默认全部 OFF

import {
  FeatureState,
  type FeatureFlag,
  type FlagOverride,
  type FlagChangedEvent,
  type FeatureFlagConfig,
} from '../types/flag.types'
import { PB5_DEFAULT_FLAGS, PB5_DEFAULT_FLAGS_MAP } from '../defaults'
import { flagStorage } from '../storage/FlagStorage'
import { FeatureFlagEvent } from '../events/FeatureFlagEvents'

type Subscriber = (event: FlagChangedEvent) => void

export class FeatureFlagManager {
  /** SSOT: 所有 flag 的运行时状态 */
  private flags = new Map<string, FeatureFlag>()
  /** 活跃的覆盖 */
  private overrides = new Map<string, FlagOverride>()
  /** 订阅者 */
  private subscribers = new Set<Subscriber>()
  /** 是否已初始化 */
  private initialized = false
  /** 初始默认值 Map (用于 clearOverride 恢复) */
  private initialDefaults = new Map<string, FeatureState>()

  /** 注入 config（用于测试和可插拔 userId） */
  private config: FeatureFlagConfig

  constructor(config?: FeatureFlagConfig) {
    this.config = config ?? {}
  }

  // ── 初始化 ──

  /**
   * 初始化 Flag 系统
   * 从 defaults + 持久化覆盖中加载，合并为最终状态
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // 1. 加载默认值
    const defaults = this.config.defaults ?? PB5_DEFAULT_FLAGS
    for (const flag of defaults) {
      this.flags.set(flag.key, { ...flag })
      this.initialDefaults.set(flag.key, flag.state)
    }

    // 2. 加载持久化覆盖
    try {
      const persisted = await flagStorage.load()
      for (const override of persisted.overrides) {
        const flag = this.flags.get(override.flagKey)
        if (flag && (override.expiresAt == null || override.expiresAt > Date.now())) {
          flag.state = override.state
          this.overrides.set(override.flagKey, override)
        }
      }
    } catch {
      // 持久化不可用，仅使用默认值
    }

    this.initialized = true
  }

  // ── 查询接口 ──

  /**
   * 检查 flag 是否启用 (state !== OFF)
   * 这是最常用的查询方法
   */
  isEnabled(key: string): boolean {
    const flag = this.flags.get(key)
    return flag != null && flag.state !== FeatureState.OFF
  }

  /**
   * 获取 flag 精确状态
   */
  getState(key: string): FeatureState {
    const flag = this.flags.get(key)
    return flag?.state ?? FeatureState.OFF
  }

  /**
   * 检查 flag 是否对普通用户可见 (state === PUBLIC)
   */
  isPublic(key: string): boolean {
    return this.getState(key) === FeatureState.PUBLIC
  }

  /**
   * 获取 flag 完整定义
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key)
  }

  /**
   * 获取所有已注册的 flag
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * 获取所有非 OFF 状态的 flag
   */
  getActiveFlags(): FeatureFlag[] {
    return this.getAllFlags().filter((f) => f.state !== FeatureState.OFF)
  }

  // ── 修改接口 (仅用于覆盖，生产环境不应频繁使用) ──

  /**
   * 设置 flag 覆盖 (开发/调试用途)
   * @param key flag key
   * @param state 目标状态
   * @param reason 覆盖原因
   * @param expiresAt 可选过期时间
   */
  async setOverride(
    key: string,
    state: FeatureState,
    reason: string,
    expiresAt?: number,
  ): Promise<void> {
    const flag = this.flags.get(key)
    if (!flag) {
      throw new Error(`Unknown feature flag: ${key}`)
    }

    const oldState = flag.state
    const override: FlagOverride = {
      flagKey: key,
      state,
      reason,
      setAt: Date.now(),
      expiresAt,
    }

    flag.state = state
    this.overrides.set(key, override)

    // 持久化
    await flagStorage.saveOverrides(Array.from(this.overrides.values()))

    // 通知订阅者
    if (oldState !== state) {
      this.notify({
        flagKey: key,
        oldState,
        newState: state,
        source: 'override',
      })
    }
  }

  /**
   * 移除 flag 覆盖，恢复到默认状态
   */
  async clearOverride(key: string): Promise<void> {
    const flag = this.flags.get(key)
    const override = this.overrides.get(key)
    if (!flag || !override) return

    const oldState = flag.state
    const defaultState = this.initialDefaults.get(key) ?? FeatureState.OFF
    flag.state = defaultState
    this.overrides.delete(key)

    await flagStorage.saveOverrides(Array.from(this.overrides.values()))

    if (oldState !== flag.state) {
      this.notify({
        flagKey: key,
        oldState,
        newState: flag.state,
        source: 'override',
      })
    }
  }

  /**
   * 导出所有 flag (用于持久化)
   */
  export(): FeatureFlag[] {
    return this.getAllFlags()
  }

  /**
   * 导入 flag 状态 (用于从外部配置恢复)
   */
  importFlags(flags: FeatureFlag[]): void {
    for (const imported of flags) {
      const existing = this.flags.get(imported.key)
      if (existing) {
        existing.state = imported.state
      }
    }
  }

  // ── 订阅机制 ──

  /**
   * 订阅 flag 变更事件
   * 返回取消订阅函数
   */
  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  /** 通知所有订阅者 */
  private notify(event: FlagChangedEvent): void {
    for (const sub of this.subscribers) {
      try {
        sub(event)
      } catch {
        // 静默吞下订阅者异常
      }
    }
  }
}

/** 全局单例 */
export const featureFlagManager = new FeatureFlagManager()
