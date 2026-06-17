// S5-3 BehaviorAnalyzer: 信号 → 偏好转换
// 消费来自 History/Favorites/PlaybackEvents 的派生数据生成加权偏好向量
// RecommendationStore 是 Derived State，不成为业务主状态源

import { computeDecayWeight } from './DecayFunction'

/** 行为信号输入 */
export interface BehaviorSignal {
  mediaId: string
  genre?: string[]
  type?: string // 'movie' | 'tv' | 'anime'
  year?: number
  action: BehaviorAction
  timestamp: number
  duration?: number
  metadata?: Record<string, unknown>
}

export enum BehaviorAction {
  WATCH = 'watch',
  COMPLETE = 'complete',
  FAVORITE = 'favorite',
  REPEAT = 'repeat',
  SEARCH = 'search',
  DISMISS = 'dismiss',
}

/** 偏好向量输出 */
export interface PreferenceVector {
  /** 流派偏好: genre → weight */
  genreWeights: Map<string, number>
  /** 内容类型偏好: movie/tv/anime → weight */
  typeWeights: Map<string, number>
  /** 年代偏好: year bucket → weight */
  yearWeights: Map<number, number>
  /** 创作者偏好 (演员/导演): name → weight */
  personWeights: Map<string, number>
  /** 数据点数量 (用于冷启动判断) */
  totalSignals: number
  /** 最后更新时间 */
  updatedAt: number
}

export class BehaviorAnalyzer {
  /**
   * 从行为信号生成偏好向量
   * @param signals 用户行为信号列表
   * @param existingWeights 已有的偏好向量 (用于合并)
   */
  analyze(
    signals: BehaviorSignal[],
    existingWeights?: PreferenceVector,
  ): PreferenceVector {
    const genreW = new Map<string, number>(existingWeights?.genreWeights ?? [])
    const typeW = new Map<string, number>(existingWeights?.typeWeights ?? [])
    const yearW = new Map<number, number>(existingWeights?.yearWeights ?? [])
    const personW = new Map<string, number>(existingWeights?.personWeights ?? [])

    const now = Date.now()
    let signalCount = existingWeights?.totalSignals ?? 0

    for (const signal of signals) {
      const decay = computeDecayWeight(signal.timestamp, now)
      const baseWeight = this.getActionWeight(signal.action) * decay

      // 流派
      if (signal.genre) {
        for (const g of signal.genre) {
          genreW.set(g, (genreW.get(g) ?? 0) + baseWeight)
        }
      }

      // 内容类型
      if (signal.type) {
        typeW.set(signal.type, (typeW.get(signal.type) ?? 0) + baseWeight)
      }

      // 年代 (bucket by decade)
      if (signal.year) {
        const decade = Math.floor(signal.year / 10) * 10
        yearW.set(decade, (yearW.get(decade) ?? 0) + baseWeight)
      }

      signalCount++
    }

    return {
      genreWeights: genreW,
      typeWeights: typeW,
      yearWeights: yearW,
      personWeights: personW,
      totalSignals: signalCount,
      updatedAt: now,
    }
  }

  /** 根据行为类型计算基础权重 */
  private getActionWeight(action: BehaviorAction): number {
    switch (action) {
      case BehaviorAction.COMPLETE:
        return 1.0
      case BehaviorAction.FAVORITE:
        return 0.9
      case BehaviorAction.REPEAT:
        return 0.8
      case BehaviorAction.WATCH:
        return 0.5
      case BehaviorAction.SEARCH:
        return 0.3
      case BehaviorAction.DISMISS:
        return -0.3
      default:
        return 0.1
    }
  }

  /** 从偏好向量提取 top-N 流派 */
  static topGenres(vector: PreferenceVector, n: number = 5): string[] {
    return [...vector.genreWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([genre]) => genre)
  }

  /** 判断是否有足够数据 (冷启动: < 3 data points) */
  static isColdStart(vector: PreferenceVector): boolean {
    return vector.totalSignals < 3
  }
}

/** 全局单例 */
export const behaviorAnalyzer = new BehaviorAnalyzer()
