// src/core/playback/manager/SourceSwitchManager.ts - 智能源切换管理器
// P4.2 Intelligent Source Switching
//
// 职责：源队列管理、自动切换、进度保存、24h 成功缓存、重试限制
// 禁止：UI、PlayerEngine、IPC
//
// 架构：
//   PlayView → PlaybackFacade → SourceSwitchManager
//     ├── 管理源队列 (PlaySource[])
//     ├── 15s 超时检测（由 PlayView 驱动）
//     ├── 进度保存/恢复
//     ├── 24h 成功源缓存
//     └── 健康状态回调

import type {
  PlaybackSource,
  SourceSwitchEvent,
  SourceSwitchEventData,
} from '../types/playback.types'
import { SourceSwitchEvent as Event } from '../types/playback.types'

type Subscriber = (data: SourceSwitchEventData) => void

/** SourceSwitchManager 配置 */
export interface SwitchConfig {
  /** 最大自动重试次数 */
  maxRetries: number
  /** 成功缓存 TTL（毫秒） */
  cacheTTL: number
  /** 进度保持误差（秒） */
  seekTolerance: number
}

const DEFAULT_CONFIG: SwitchConfig = {
  maxRetries: 3,
  cacheTTL: 24 * 60 * 60 * 1000,
  seekTolerance: 3,
}

export class SourceSwitchManager {
  private config: SwitchConfig
  private sources: PlaybackSource[] = []
  private currentIdx = 0
  private retryCount = 0
  private triedIndices = new Set<number>()
  private savedTime = 0
  private subscribers = new Set<Subscriber>()

  /** mediaId → { providerId, timestamp } */
  private successCache = new Map<
    string,
    { providerId: string; timestamp: number }
  >()

  /** 源切换结果回调（用于健康追踪） */
  onSwitchResult?: (providerId: string, success: boolean) => void

  constructor(config?: Partial<SwitchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ==================== 播放流程 ====================

  /**
   * 开始播放：初始化源队列，返回最佳源
   * @param mediaId    媒体标识（用于成功缓存查询）
   * @param sources    全部可用源
   * @param episodeNumber 目标集数
   */
  start(
    mediaId: string,
    sources: PlaybackSource[],
    episodeNumber: number,
  ): PlaybackSource | null {
    if (sources.length === 0) return null

    this.sources = sources
    this.retryCount = 0
    this.triedIndices.clear()
    this.savedTime = 0

    // 查 24h 成功缓存 → 优先上次成功的源
    const cached = this.successCache.get(mediaId)
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      const cachedIdx = sources.findIndex(
        (s) => s.providerId === cached.providerId,
      )
      if (cachedIdx >= 0 && sources[cachedIdx].playUrl) {
        this.currentIdx = cachedIdx
      }
    } else {
      this.currentIdx = 0
    }

    this.triedIndices.add(this.currentIdx)
    return this._getSource(this.currentIdx)
  }

  /**
   * 当前源失败 → 返回下一个源（null = 全部耗尽）
   */
  onFailed(reason?: string): PlaybackSource | null {
    this.retryCount++

    // 标记当前源失败
    const current = this.sources[this.currentIdx]
    if (current) {
      this._emit(Event.FAILED, {
        fromSource: current.providerName,
        reason,
        remainingRetries: this.config.maxRetries - this.retryCount,
      })
      this.onSwitchResult?.(current.providerId, false)
    }

    // 超过最大重试 → 耗尽
    if (this.retryCount >= this.config.maxRetries) {
      this._emit(Event.EXHAUSTED, {
        reason: `已达到最大重试次数 (${this.config.maxRetries})`,
      })
      return null
    }

    // 找下一个未尝试的源
    for (let offset = 1; offset < this.sources.length; offset++) {
      const nextIdx = (this.currentIdx + offset) % this.sources.length
      if (!this.triedIndices.has(nextIdx)) {
        const nextSource = this._getSource(nextIdx)
        if (nextSource) {
          this.triedIndices.add(nextIdx)
          this.currentIdx = nextIdx

          this._emit(Event.SWITCHING, {
            fromSource: current?.providerName,
            toSource: nextSource.providerName,
            reason,
            remainingRetries: this.config.maxRetries - this.retryCount,
          })
          return nextSource
        }
      }
    }

    // 所有源都尝试过
    this._emit(Event.EXHAUSTED, { reason: '所有播放源均已尝试' })
    return null
  }

  /**
   * 当前源播放成功 → 写缓存 + 标记健康
   */
  onSuccess(mediaId: string): void {
    const current = this.sources[this.currentIdx]
    if (!current) return

    // 写 24h 成功缓存
    this.successCache.set(mediaId, {
      providerId: current.providerId,
      timestamp: Date.now(),
    })

    // 标记健康
    this.onSwitchResult?.(current.providerId, true)
  }

  // ==================== 手动切换 ====================

  /**
   * 手动切换到指定 Provider
   * @param providerId 目标 Provider ID
   * @returns 目标源，null 表示未找到
   */
  switchToProvider(providerId: string): PlaybackSource | null {
    const idx = this.sources.findIndex((s) => s.providerId === providerId)
    if (idx < 0) return null

    const source = this._getSource(idx)
    if (!source) return null

    const from = this.sources[this.currentIdx]?.providerName

    // 重置重试（手动切换不计入自动重试）
    this.retryCount = 0
    this.triedIndices.add(idx)
    this.currentIdx = idx

    this._emit(Event.SWITCHED, {
      fromSource: from,
      toSource: source.providerName,
      reason: '手动切换',
    })

    return source
  }

  // ==================== 进度保持 ====================

  /** 保存当前播放进度 */
  saveProgress(time: number): void {
    this.savedTime = time
  }

  /** 获取保存的进度 */
  getSavedProgress(): number {
    return this.savedTime
  }

  /** 清除保存的进度 */
  clearProgress(): void {
    this.savedTime = 0
  }

  // ==================== 查询 ====================

  /** 获取当前源 */
  getCurrentSource(): PlaybackSource | null {
    return this._getSource(this.currentIdx)
  }

  /** 获取已尝试的源数量 */
  get triedCount(): number {
    return this.triedIndices.size
  }

  /** 获取剩余重试次数 */
  get remainingRetries(): number {
    return Math.max(0, this.config.maxRetries - this.retryCount)
  }

  /** 是否有更多源可尝试 */
  get hasMoreSources(): boolean {
    return this.triedIndices.size < this.sources.length &&
      this.retryCount < this.config.maxRetries
  }

  // ==================== 缓存管理 ====================

  /** 清除成功缓存 */
  clearSuccessCache(mediaId?: string): void {
    if (mediaId) {
      this.successCache.delete(mediaId)
    } else {
      this.successCache.clear()
    }
  }

  /** 获取缓存的成功源（用于调试） */
  getCachedProvider(mediaId: string): string | null {
    const cached = this.successCache.get(mediaId)
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.providerId
    }
    return null
  }

  // ==================== 订阅 ====================

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => { this.subscribers.delete(callback) }
  }

  // ==================== 内部 ====================

  private _getSource(idx: number): PlaybackSource | null {
    if (idx < 0 || idx >= this.sources.length) return null
    return this.sources[idx]
  }

  private _emit(
    event: SourceSwitchEvent,
    extra?: Omit<SourceSwitchEventData, 'event'>,
  ): void {
    const data: SourceSwitchEventData = { event, ...extra }
    this.subscribers.forEach((fn) => {
      try { fn(data) } catch { /* ignore */ }
    })
  }
}
