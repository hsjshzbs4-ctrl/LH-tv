// src/player/renderOptimizer.ts — PB3-S2-3 Render Optimization Utilities
// Debounce, Throttle, Memo — 不修改任何业务逻辑

/** 防抖 (debounce): 在连续调用中只执行最后一次 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  const call = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delayMs)
  }

  const cancel = () => {
    if (timer) { clearTimeout(timer); timer = null }
  }

  return { call, cancel }
}

/** 节流 (throttle): 在指定间隔内最多执行一次 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  intervalMs: number,
): { call: (...args: Parameters<T>) => void } {
  let lastCall = 0

  const call = (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= intervalMs) {
      lastCall = now
      fn(...args)
    }
  }

  return { call }
}

/** 简单 memo 缓存（基于参数序列化） */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 100,
): T {
  const cache = new Map<string, unknown>()

  return ((...args: unknown[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn(...args)
    if (cache.size >= maxSize) {
      const first = cache.keys().next().value as string
      cache.delete(first)
    }
    cache.set(key, result)
    return result
  }) as T
}

/** 渲染计数器 */
export class RenderCounter {
  private counts = new Map<string, number>()

  tick(component: string): number {
    const c = (this.counts.get(component) || 0) + 1
    this.counts.set(component, c)
    return c
  }

  getCount(component: string): number {
    return this.counts.get(component) || 0
  }

  getAll(): Record<string, number> {
    return Object.fromEntries(this.counts)
  }

  reset(): void { this.counts.clear() }
}
