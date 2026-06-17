// src/platform/flags/types/flag.types.ts — PB5 Feature Flag 核心类型
// PB5 Authorization v2: FeatureState 三级门控，禁用 boolean

/** 功能状态 — 三级门控 (PB5 Auth v2) */
export enum FeatureState {
  /** 完全关闭，用户不可见 */
  OFF = 'OFF',
  /** 内部测试，仅开发者可见 */
  INTERNAL = 'INTERNAL',
  /** 公开发布，所有用户可见 */
  PUBLIC = 'PUBLIC',
}

/** 功能标志定义 */
export interface FeatureFlag {
  /** 唯一标识 */
  key: string
  /** 当前状态 */
  state: FeatureState
  /** 描述 */
  description: string
  /** 所属子系统 */
  subsystem: PB5Subsystem
  /** 是否允许在运行时切换 (部分 flag 只在启动时读取) */
  runtimeToggle: boolean
  /** 依赖的其他 flag (必须先启用依赖) */
  dependencies?: string[]
}

/** PB5 子系统标识 */
export enum PB5Subsystem {
  ACCOUNT = 'account',
  CLOUD = 'cloud',
  RECOMMENDATION = 'recommendation',
  PLUGINS = 'plugins',
  AI = 'ai',
  DATA = 'data',
  DASHBOARD = 'dashboard',
  ECOSYSTEM = 'ecosystem',
}

/** Flag 覆盖 — 用于开发/调试时临时改变 flag 状态 */
export interface FlagOverride {
  flagKey: string
  state: FeatureState
  reason: string
  setAt: number
  expiresAt?: number
}

/** 实验变体 */
export interface ExperimentVariant {
  /** 变体名称 */
  name: string
  /** 流量占比 0~1 */
  weight: number
  /** 关联的功能 flag 状态 */
  flagOverrides?: Partial<Record<string, FeatureState>>
}

/** 实验定义 */
export interface ExperimentDefinition {
  /** 实验 ID */
  id: string
  /** 名称 */
  name: string
  /** 所属 flag key */
  flagKey: string
  /** 变体列表 */
  variants: ExperimentVariant[]
  /** 实验开始时间 */
  startedAt: number
  /** 实验计划结束时间 (可选) */
  endsAt?: number
  /** 是否启用 */
  enabled: boolean
}

/** 实验分配结果 */
export interface ExperimentAssignment {
  experimentId: string
  flagKey: string
  variantIndex: number
  variantName: string
  assignedAt: number
}

/** Flag 变更事件 */
export interface FlagChangedEvent {
  flagKey: string
  oldState: FeatureState
  newState: FeatureState
  source: 'override' | 'experiment' | 'config'
}

/** FeatureFlagManager 配置选项 */
export interface FeatureFlagConfig {
  /** 初始 flag 定义 */
  defaults?: FeatureFlag[]
  /** 持久化 key */
  storageKey?: string
  /** 用户 ID (用于确定性实验分配) */
  userId?: string
}
