// src/player/reliability/CrashReporter.ts — PB3-S3-4 Crash Reporting
// PII-safe crash capture。不修改 PB2 遥测。

export interface CrashPayload {
  timestamp: number
  type: 'unhandled_rejection' | 'runtime_error' | 'vue_error' | 'player_error' | 'store_error'
  message: string
  stack?: string
  route?: string
  episodeId?: string
  browser: string
  appVersion: string
}

export type CrashCallback = (payload: CrashPayload) => void

export class CrashReporter {
  private crashes: CrashPayload[] = []
  private onCrash: CrashCallback | null = null
  private _captured = false
  private _rejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null
  private _errorHandler: ((e: ErrorEvent) => void) | null = null

  get crashCount(): number { return this.crashes.length }
  get recentCrashes(): Readonly<CrashPayload[]> { return [...this.crashes].reverse() }

  constructor() {
    this._capture()
  }

  /** 手动报告 crash */
  report(type: CrashPayload['type'], message: string, stack?: string, context?: { route?: string; episodeId?: string }): void {
    const payload: CrashPayload = {
      timestamp: Date.now(),
      type,
      message: this._sanitize(message),
      stack: stack ? this._sanitize(stack) : undefined,
      route: context?.route,
      episodeId: context?.episodeId,
      browser: this._detectBrowser(),
      appVersion: '2.0.0',
    }

    this.crashes.push(payload)
    this.onCrash?.(payload)

    // 最多保留 100 条
    if (this.crashes.length > 100) this.crashes = this.crashes.slice(-100)
  }

  /** 注册 crash 回调 */
  onCrashReport(cb: CrashCallback): void { this.onCrash = cb }

  /** 获取统计 */
  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {}
    for (const c of this.crashes) {
      byType[c.type] = (byType[c.type] || 0) + 1
    }
    return { total: this.crashes.length, byType }
  }

  destroy(): void {
    if (this._rejectionHandler) window.removeEventListener('unhandledrejection', this._rejectionHandler)
    if (this._errorHandler) window.removeEventListener('error', this._errorHandler)
    this._captured = false
  }

  private _capture(): void {
    if (this._captured) return
    this._captured = true

    this._rejectionHandler = (e: PromiseRejectionEvent) => {
      this.report('unhandled_rejection', e.reason?.message || String(e.reason), e.reason?.stack)
    }
    this._errorHandler = (e: ErrorEvent) => {
      this.report('runtime_error', e.message, e.error?.stack)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this._rejectionHandler)
      window.addEventListener('error', this._errorHandler)
    }
  }

  /** 移除 PII */
  private _sanitize(text: string): string {
    return text
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***')
      .replace(/Bearer\s+\S+/gi, 'Bearer ***')
      .replace(/cookie[=:]\s*\S+/gi, 'cookie=***')
  }

  private _detectBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown'
    const ua = navigator.userAgent
    if (/Chrome/.test(ua)) return 'Chrome'
    if (/Firefox/.test(ua)) return 'Firefox'
    if (/Safari/.test(ua)) return 'Safari'
    if (/Edge/.test(ua)) return 'Edge'
    return ua.slice(0, 50)
  }
}
