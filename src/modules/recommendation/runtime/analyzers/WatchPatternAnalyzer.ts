// S5-3 WatchPatternAnalyzer: 观看模式分析
// 提取时段偏好、追剧检测、弃剧检测

import { BehaviorAction, type BehaviorSignal } from './BehaviorAnalyzer'

/** 时段桶 */
export enum TimeBucket {
  MORNING = 'morning',     // 06:00-11:59
  AFTERNOON = 'afternoon', // 12:00-17:59
  EVENING = 'evening',     // 18:00-23:59
  NIGHT = 'night',         // 00:00-05:59
}

/** 观看模式 */
export interface WatchPattern {
  /** 时段偏好: timeBucket → 信号数 */
  timePreferences: Map<TimeBucket, number>
  /** 平均观看时长 (ms) */
  avgWatchDurationMs: number
  /** 是否追剧者 (连续观看同一剧集 > 3 集) */
  isBingeWatcher: boolean
  /** 弃剧阈值: 观看 < threshold 分钟后判定为弃剧 */
  dropThresholdMs: number
  /** 弃剧率 */
  dropRate: number
  /** 总信号数 */
  totalSignals: number
}

export class WatchPatternAnalyzer {
  /** 弃剧阈值 (3 分钟) */
  private static DROP_THRESHOLD_MS = 3 * 60 * 1000

  /** 追剧阈值 (连看集数) */
  private static BINGE_EPISODE_THRESHOLD = 3

  analyze(signals: BehaviorSignal[]): WatchPattern {
    const timePrefs = new Map<TimeBucket, number>()
    let totalWatchMs = 0
    let watchCount = 0
    let dropCount = 0
    let bingeEpisodes = 0

    // 检测追剧: 同一剧集连续观看
    const seriesWatches = new Map<string, number[]>()

    for (const signal of signals) {
      if (signal.action !== BehaviorAction.WATCH
          && signal.action !== BehaviorAction.COMPLETE) continue

      // 时段分析
      const hour = new Date(signal.timestamp).getHours()
      const bucket = this.hourToBucket(hour)
      timePrefs.set(bucket, (timePrefs.get(bucket) ?? 0) + 1)

      // 观看时长
      if (signal.duration) {
        totalWatchMs += signal.duration
        watchCount++

        if (signal.duration < WatchPatternAnalyzer.DROP_THRESHOLD_MS) {
          dropCount++
        }
      }

      // 追剧检测
      const seriesId = signal.metadata?.seriesId as string | undefined
      if (seriesId) {
        const episodes = seriesWatches.get(seriesId) ?? []
        episodes.push(signal.timestamp)
        seriesWatches.set(seriesId, episodes)
      }
    }

    // 追剧判断
    let isBinge = false
    for (const episodes of seriesWatches.values()) {
      if (episodes.length >= WatchPatternAnalyzer.BINGE_EPISODE_THRESHOLD) {
        // 检查是否连续 (间隔 < 30 分钟)
        const sorted = episodes.sort((a, b) => a - b)
        let consecutive = 1
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] < 30 * 60 * 1000) {
            consecutive++
          } else {
            consecutive = 1
          }
          if (consecutive >= WatchPatternAnalyzer.BINGE_EPISODE_THRESHOLD) {
            isBinge = true
            break
          }
        }
      }
    }

    return {
      timePreferences: timePrefs,
      avgWatchDurationMs: watchCount > 0 ? totalWatchMs / watchCount : 0,
      isBingeWatcher: isBinge,
      dropThresholdMs: WatchPatternAnalyzer.DROP_THRESHOLD_MS,
      dropRate: watchCount > 0 ? dropCount / watchCount : 0,
      totalSignals: signals.length,
    }
  }

  private hourToBucket(hour: number): TimeBucket {
    if (hour >= 6 && hour < 12) return TimeBucket.MORNING
    if (hour >= 12 && hour < 18) return TimeBucket.AFTERNOON
    if (hour >= 18 && hour < 24) return TimeBucket.EVENING
    return TimeBucket.NIGHT
  }
}
