// src/platform/flags/events/FeatureFlagEvents.ts — PB5 FeatureFlag 事件定义

import type { FeatureState } from '../types/flag.types'

/** Flag 变更事件载荷 */
export interface FlagChangePayload {
  flagKey: string
  oldState: FeatureState
  newState: FeatureState
  source: 'override' | 'experiment' | 'config'
  timestamp: number
}

/** 实验分配事件 */
export interface ExperimentAssignedPayload {
  experimentId: string
  flagKey: string
  variantIndex: number
  variantName: string
  assignedAt: number
}

/** Feature Flag 事件类型 */
export const FeatureFlagEvent = {
  FLAG_CHANGED: 'pb5:flag-changed',
  EXPERIMENT_ASSIGNED: 'pb5:experiment-assigned',
  OVERRIDE_SET: 'pb5:override-set',
  OVERRIDE_CLEARED: 'pb5:override-cleared',
  FLAGS_RESET: 'pb5:flags-reset',
} as const

export type FeatureFlagEventType =
  (typeof FeatureFlagEvent)[keyof typeof FeatureFlagEvent]
