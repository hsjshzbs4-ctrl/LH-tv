// src/platform/flags/defaults.ts — PB5 所有 Feature Flag 默认定义
// 默认全部 OFF，由 Phase 1 ~ Phase 5 逐步内部启用

import { FeatureFlag, FeatureState, PB5Subsystem } from './types/flag.types'

/**
 * PB5 所有功能标志默认值
 *
 * 按授权要求：所有 Flag 默认 OFF
 * 每个模块独立门控，互不影响
 */
export const PB5_DEFAULT_FLAGS: FeatureFlag[] = [
  // ── S5-7: Feature Flags 本身 ──
  {
    key: 'pb5.account',
    state: FeatureState.OFF,
    description: 'User Account Platform — local account identity',
    subsystem: PB5Subsystem.ACCOUNT,
    runtimeToggle: false,
  },
  {
    key: 'pb5.cloud',
    state: FeatureState.OFF,
    description: 'Cloud Sync Framework — multi-device synchronization',
    subsystem: PB5Subsystem.CLOUD,
    runtimeToggle: true,
    dependencies: ['pb5.account'],
  },
  {
    key: 'pb5.recommendation',
    state: FeatureState.OFF,
    description: 'Recommendation Engine v2 — BehaviorAnalyzer + enriched profiles',
    subsystem: PB5Subsystem.RECOMMENDATION,
    runtimeToggle: true,
  },
  {
    key: 'pb5.plugins',
    state: FeatureState.OFF,
    description: 'Unified Plugin Platform — PluginManager + PluginRegistry + PluginSandbox',
    subsystem: PB5Subsystem.PLUGINS,
    runtimeToggle: false,
  },
  {
    key: 'pb5.ai',
    state: FeatureState.OFF,
    description: 'AI Assistant Framework — MockProvider only in PB5',
    subsystem: PB5Subsystem.AI,
    runtimeToggle: true,
  },
  {
    key: 'pb5.data',
    state: FeatureState.OFF,
    description: 'Data Platform Foundation — DataPipeline + MetricsAggregator + EventWarehouse',
    subsystem: PB5Subsystem.DATA,
    runtimeToggle: false,
  },
  {
    key: 'pb5.dashboard',
    state: FeatureState.OFF,
    description: 'Platform Dashboard — read-only admin panel',
    subsystem: PB5Subsystem.DASHBOARD,
    runtimeToggle: true,
    dependencies: ['pb5.data'],
  },
  // ── PB6 AI Era ──
  {
    key: 'pb6.ai',
    state: FeatureState.OFF,
    description: 'PB6 AI Era — real model providers (OpenAI/Anthropic/Ollama)',
    subsystem: PB5Subsystem.AI,
    runtimeToggle: true,
    dependencies: ['pb5.ai'],
  },
]

/** 按 key 快速索引 */
export const PB5_DEFAULT_FLAGS_MAP = new Map<string, FeatureFlag>(
  PB5_DEFAULT_FLAGS.map((f) => [f.key, f]),
)
