// src/player/reliability/NetworkResilienceManager.ts — PB3-S3-2 Network Resilience
// 不修改 PB2 核心。监听网络状态，提供重试策略。

export enum NetworkQuality {
  ONLINE = 'online',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
}

export interface RetryStrategy {
  currentDelay: number
  attempt: number
  maxRetries: number
  baseDelay: number
}

export class NetworkResilienceManager {
  private _quality: NetworkQuality = NetworkQuality.ONLINE
  private retryStrategies = new Map<string, RetryStrategy>()
  private _onQualityChange: ((q: NetworkQuality) => void) | null = null
  private _onlineHandler: (() => void) | null = null
  private _offlineHandler: (() => void) | null = null

  get quality(): NetworkQuality { return this._quality }
  get isOnline(): boolean { return this._quality !== NetworkQuality.OFFLINE }

  constructor() {
    this._bindNetworkEvents()
  }

  /** 获取下一次重试延迟（指数退避: 1s, 2s, 4s, 8s, 16s） */
  getNextRetryDelay(key: string): number {
    let s = this.retryStrategies.get(key)
    if (!s) {
      s = { currentDelay: 1000, attempt: 0, maxRetries: 5, baseDelay: 1000 }
      this.retryStrategies.set(key, s)
    }
    s.attempt++
    const delay = s.currentDelay
    s.currentDelay = Math.min(s.currentDelay * 2, 16000)
    return delay
  }

  /** 重置特定 key 的重试计数 */
  resetRetry(key: string): void {
    const s = this.retryStrategies.get(key)
    if (s) {
      s.currentDelay = s.baseDelay
      s.attempt = 0
    }
  }

  /** 是否超过最大重试次数 */
  canRetry(key: string): boolean {
    const s = this.retryStrategies.get(key)
    if (!s) return true
    return s.attempt < s.maxRetries
  }

  /** 注册网络质量变化回调 */
  onQualityChange(cb: (q: NetworkQuality) => void): void {
    this._onQualityChange = cb
  }

  /** 获取统计 */
  getStats(): { quality: NetworkQuality; activeStrategies: number } {
    return {
      quality: this._quality,
      activeStrategies: this.retryStrategies.size,
    }
  }

  destroy(): void {
    if (this._onlineHandler) window.removeEventListener('online', this._onlineHandler)
    if (this._offlineHandler) window.removeEventListener('offline', this._offlineHandler)
    this.retryStrategies.clear()
  }

  private _bindNetworkEvents(): void {
    this._onlineHandler = () => {
      this._quality = NetworkQuality.ONLINE
      this._onQualityChange?.(NetworkQuality.ONLINE)
    }
    this._offlineHandler = () => {
      this._quality = NetworkQuality.OFFLINE
      this._onQualityChange?.(NetworkQuality.OFFLINE)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._onlineHandler)
      window.addEventListener('offline', this._offlineHandler)
      if (!navigator.onLine) this._quality = NetworkQuality.OFFLINE
    }
  }
}
