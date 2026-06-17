// S5-3 RepeatWatchDetector: 重复观看检测
// 检测同一剧集/电影被多次观看，加权偏好属性

import { BehaviorAction, type BehaviorSignal } from './BehaviorAnalyzer'

export interface RepeatWatchResult {
  /** 被重复观看的 mediaId → 重复次数 */
  repeatedMedia: Map<string, number>
  /** 在重复观看内容中高频出现的流派 */
  repeatedGenres: Map<string, number>
  /** 重复观看计数 */
  totalRepeatCount: number
}

export class RepeatWatchDetector {
  analyze(signals: BehaviorSignal[]): RepeatWatchResult {
    const mediaCount = new Map<string, number>()
    const repeatedMedia = new Map<string, number>()
    const repeatedGenres = new Map<string, number>()

    // 统计每个 media 被观看的次数
    for (const signal of signals) {
      if (signal.action === BehaviorAction.WATCH
          || signal.action === BehaviorAction.COMPLETE) {
        mediaCount.set(signal.mediaId, (mediaCount.get(signal.mediaId) ?? 0) + 1)
      }
    }

    // 找出重复观看的 media
    let totalRepeatCount = 0
    for (const [mediaId, count] of mediaCount) {
      if (count >= 2) {
        repeatedMedia.set(mediaId, count)
        totalRepeatCount += count - 1 // 减去首次

        // 提取该 media 的流派并加权
        const signal = signals.find((s) => s.mediaId === mediaId)
        if (signal?.genre) {
          for (const genre of signal.genre) {
            repeatedGenres.set(genre, (repeatedGenres.get(genre) ?? 0) + count - 1)
          }
        }
      }
    }

    return {
      repeatedMedia,
      repeatedGenres,
      totalRepeatCount,
    }
  }
}
