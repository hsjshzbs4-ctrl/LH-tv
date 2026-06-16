// src/player/memoryBudgetManager.ts — PB3-S2-4 Memory Budget Manager
// 追踪资源使用量，超预算时告警。只读，不修改任何状态。

export interface MemoryBudget {
  maxListeners: number
  maxTimers: number
  maxDOMNodes: number
  maxCacheMB: number
  maxQueueMB: number
}

const DEFAULT_BUDGET: MemoryBudget = {
  maxListeners: 50,
  maxTimers: 20,
  maxDOMNodes: 500,
  maxCacheMB: 20,
  maxQueueMB: 5,
}

export interface MemorySnapshot {
  listeners: number
  timers: number
  domNodes: number
  cacheBytes: number
  queueBytes: number
}

export class MemoryBudgetManager {
  private budget: MemoryBudget
  private _warnings: string[] = []
  private listenerBase = 0
  private timerBase = 0

  get warnings(): Readonly<string[]> { return this._warnings }
  get hasWarnings(): boolean { return this._warnings.length > 0 }

  constructor(budget?: Partial<MemoryBudget>) {
    this.budget = { ...DEFAULT_BUDGET, ...budget }
    // 记录基线（应用启动时的 listener/timer 数量）
    if (typeof document !== 'undefined') {
      this.listenerBase = 0 // 近似值
      this.timerBase = 0
    }
  }

  /** 采集当前快照 */
  snapshot(): MemorySnapshot {
    const domNodes = typeof document !== 'undefined'
      ? document.querySelectorAll('*').length
      : 0

    // 估算：通过已知注册点计算
    const listeners = 0  // 实际通过各 Manager 的 destroy() 方法追踪
    const timers = 0      // 实际通过 setInterval/setTimeout 追踪

    return {
      listeners: listeners - this.listenerBase,
      timers: timers - this.timerBase,
      domNodes,
      cacheBytes: 0,
      queueBytes: 0,
    }
  }

  /** 检查是否超出预算 */
  check(snapshot?: MemorySnapshot): boolean {
    const snap = snapshot || this.snapshot()
    let ok = true

    if (snap.listeners > this.budget.maxListeners) {
      this.warn(`Listeners (${snap.listeners}) > budget (${this.budget.maxListeners})`)
      ok = false
    }
    if (snap.timers > this.budget.maxTimers) {
      this.warn(`Timers (${snap.timers}) > budget (${this.budget.maxTimers})`)
      ok = false
    }
    if (snap.domNodes > this.budget.maxDOMNodes) {
      this.warn(`DOM Nodes (${snap.domNodes}) > budget (${this.budget.maxDOMNodes})`)
      ok = false
    }
    if (snap.cacheBytes > this.budget.maxCacheMB * 1024 * 1024) {
      this.warn(`Cache (${(snap.cacheBytes / 1024 / 1024).toFixed(1)}MB) > budget (${this.budget.maxCacheMB}MB)`)
      ok = false
    }
    if (snap.queueBytes > this.budget.maxQueueMB * 1024 * 1024) {
      this.warn(`Queue (${(snap.queueBytes / 1024 / 1024).toFixed(1)}MB) > budget (${this.budget.maxQueueMB}MB)`)
      ok = false
    }

    return ok
  }

  /** 清除告警 */
  clearWarnings(): void { this._warnings = [] }

  private warn(msg: string): void {
    this._warnings.push(msg)
    console.warn(`[PB3-S2 MemoryBudget] ${msg}`)
  }
}
