// S5-3 BehaviorAnalyzer: 时间衰减函数
// 指数衰减: recentWeight = e^(-λ * ageInDays)

/** 衰减配置 */
export interface DecayConfig {
  /** 半衰期 (天), 默认 30 */
  halfLifeDays: number
  /** 最小衰减系数 */
  minWeight: number
}

const DEFAULT_DECAY: DecayConfig = {
  halfLifeDays: 30,
  minWeight: 0.01,
}

/**
 * 指数衰减权重计算
 * @param timestamp 事件发生时间 (ms)
 * @param now 当前时间 (ms)
 * @param config 衰减配置
 * @returns 0~1 的权重值
 */
export function computeDecayWeight(
  timestamp: number,
  now: number = Date.now(),
  config: Partial<DecayConfig> = {},
): number {
  const { halfLifeDays, minWeight } = { ...DEFAULT_DECAY, ...config }

  const ageMs = now - timestamp
  const ageDays = ageMs / (24 * 60 * 60 * 1000)

  // λ = ln(2) / halfLife
  const lambda = Math.log(2) / halfLifeDays
  const weight = Math.exp(-lambda * ageDays)

  return Math.max(minWeight, Math.min(1, weight))
}

/**
 * 批量计算衰减权重
 * 返回 Map<id, weight>
 */
export function computeBatchDecayWeights(
  entries: Array<{ id: string; timestamp: number }>,
  now?: number,
  config?: Partial<DecayConfig>,
): Map<string, number> {
  const weights = new Map<string, number>()
  for (const entry of entries) {
    weights.set(entry.id, computeDecayWeight(entry.timestamp, now, config))
  }
  return weights
}
