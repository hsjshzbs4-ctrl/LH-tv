// S5-3 BehaviorAnalyzer Module — 统一导出
// 扩展 CE9 Recommendation Engine (src/modules/recommendation/)，不修改已有文件

export {
  BehaviorAnalyzer,
  behaviorAnalyzer,
  BehaviorAction,
  type BehaviorSignal,
  type PreferenceVector,
} from './BehaviorAnalyzer'

export {
  WatchPatternAnalyzer,
  TimeBucket,
  type WatchPattern,
} from './WatchPatternAnalyzer'

export { RepeatWatchDetector, type RepeatWatchResult } from './RepeatWatchDetector'

export { computeDecayWeight, computeBatchDecayWeights, type DecayConfig } from './DecayFunction'
