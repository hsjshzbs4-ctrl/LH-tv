// src/platform/flags/index.ts — PB5 Feature Flag System 统一导出
// S5-7: Feature Flag System — Phase 1 Foundation

// Types
export {
  FeatureState,
  PB5Subsystem,
  type FeatureFlag,
  type FlagOverride,
  type ExperimentDefinition,
  type ExperimentVariant,
  type ExperimentAssignment,
  type FlagChangedEvent,
  type FeatureFlagConfig,
} from './types/flag.types'

// Manager
export { FeatureFlagManager, featureFlagManager } from './manager/FeatureFlagManager'
export { ExperimentManager } from './manager/ExperimentManager'

// Storage
export { FlagStorage, flagStorage } from './storage/FlagStorage'

// Events
export { FeatureFlagEvent } from './events/FeatureFlagEvents'
export type {
  FlagChangePayload,
  ExperimentAssignedPayload,
  FeatureFlagEventType,
} from './events/FeatureFlagEvents'

// Defaults
export { PB5_DEFAULT_FLAGS, PB5_DEFAULT_FLAGS_MAP } from './defaults'
