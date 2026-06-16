// src/player/reliability/ErrorRecoveryManager.ts — PB3-S3-1 Error Recovery
// 不修改 PlayerFacade/SourceSwitchManager (FROZEN)。包装恢复逻辑。

export enum RecoveryLevel {
  LEVEL_1_RETRY = 1,        // 重试当前源
  LEVEL_2_RELOAD = 2,       // 重新加载当前剧集
  LEVEL_3_SWITCH_SOURCE = 3, // 切换 CDN/源
  LEVEL_4_FATAL = 4,        // 致命错误 → 用户提示
}

export interface RecoveryAttempt {
  level: RecoveryLevel
  timestamp: number
  source: string
  reason: string
  success: boolean
}

export interface ErrorRecoveryConfig {
  maxRetryPerSource: number
  maxSourceSwitches: number
  retryDelayMs: number
}

const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  maxRetryPerSource: 3,
  maxSourceSwitches: 3,
  retryDelayMs: 2000,
}

export class ErrorRecoveryManager {
  private config: ErrorRecoveryConfig
  private attempts: RecoveryAttempt[] = []
  private currentLevel: RecoveryLevel = RecoveryLevel.LEVEL_1_RETRY
  private _sourceRetries = 0
  private _totalSwitches = 0
  private _recoveryCount = 0

  get recoveryCount(): number { return this._recoveryCount }
  get currentRecoveryLevel(): RecoveryLevel { return this.currentLevel }
  get history(): Readonly<RecoveryAttempt[]> { return this.attempts }

  constructor(config?: Partial<ErrorRecoveryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /** 记录错误，返回应采取的操作级别 */
  onError(source: string, reason: string): RecoveryLevel {
    this._sourceRetries++

    if (this._sourceRetries <= this.config.maxRetryPerSource) {
      this.currentLevel = RecoveryLevel.LEVEL_1_RETRY
    } else if (this._totalSwitches < this.config.maxSourceSwitches) {
      this.currentLevel = RecoveryLevel.LEVEL_3_SWITCH_SOURCE
      this._sourceRetries = 0
      this._totalSwitches++
    } else {
      this.currentLevel = RecoveryLevel.LEVEL_4_FATAL
    }

    this.attempts.push({
      level: this.currentLevel,
      timestamp: Date.now(),
      source,
      reason,
      success: false,
    })

    return this.currentLevel
  }

  /** 标记当前恢复成功 */
  markRecovered(): void {
    this._recoveryCount++
    this._sourceRetries = 0
    this.currentLevel = RecoveryLevel.LEVEL_1_RETRY
    const last = this.attempts[this.attempts.length - 1]
    if (last) last.success = true
  }

  /** 重置（新剧集加载时） */
  reset(): void {
    this._sourceRetries = 0
    this._totalSwitches = 0
    this.currentLevel = RecoveryLevel.LEVEL_1_RETRY
  }

  /** 获取统计 */
  getStats(): { recoveries: number; attempts: number; fatalCount: number } {
    return {
      recoveries: this._recoveryCount,
      attempts: this.attempts.length,
      fatalCount: this.attempts.filter(a => a.level === RecoveryLevel.LEVEL_4_FATAL).length,
    }
  }
}
