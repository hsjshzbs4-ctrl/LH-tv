// tests/helpers/test-helpers.ts — 单元测试通用工具函数

import { vi } from 'vitest'

// ============================================================
// 定时器辅助
// ============================================================

/** 安装 fake timers 并返回便捷控制对象 */
export function useFakeTimers() {
  vi.useFakeTimers()
  return {
    /** 快进 ms 毫秒 */
    advance(ms: number): void {
      vi.advanceTimersByTime(ms)
    },
    /** 快进直到所有 pending timer 执行完毕 */
    advanceAll(): void {
      vi.advanceTimersByTime(999999)
    },
    /** 只执行当前队列中的 timer，不快进时间 */
    runAll(): void {
      vi.runAllTimers()
    },
    /** 恢复真实 timer */
    restore(): void {
      vi.useRealTimers()
    },
  }
}

// ============================================================
// 单例模块重置辅助
// ============================================================

/**
 * 强制重新导入模块（用于测试间隔离单例）
 *
 * 用法：
 *   const mod = await resetModule(() => import('@/core/xxx'))
 */
export async function resetModule<T>(importFn: () => Promise<T>): Promise<T> {
  vi.resetModules()
  return importFn()
}

// ============================================================
// 常用断言包装
// ============================================================

/**
 * 断言函数抛出特定消息的错误
 */
export async function expectThrow(fn: () => unknown | Promise<unknown>, message?: string): Promise<void> {
  const { expect } = await import('vitest')
  if (message) {
    await expect(fn).rejects.toThrow(message)
  } else {
    await expect(fn).rejects.toThrow()
  }
}

// ============================================================
// window.app 便捷访问
// ============================================================

/** 获取 window.app（带类型断言） */
export function getAppMock(): Record<string, ReturnType<typeof vi.fn>> {
  return (window as Record<string, unknown>).app as Record<string, ReturnType<typeof vi.fn>>
}

/** 重置所有 window.app mock 调用记录 */
export function resetAppMocks(): void {
  const app = (window as Record<string, unknown>).app as Record<string, unknown>
  if (!app) return
  for (const val of Object.values(app)) {
    if (typeof val === 'object' && val !== null && 'mockClear' in val) {
      ;(val as ReturnType<typeof vi.fn>).mockClear()
    }
  }
}

// ============================================================
// 等待微任务
// ============================================================

/** 刷新微任务队列（Promise 回调） */
export function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => resolve())
}

/** 等待指定毫秒（仅用于真实 timer 环境） */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================
// 收集器模式
// ============================================================

/**
 * 创建事件收集器，用于测试 subscribe/unsubscribe 模式
 *
 * 用法：
 *   const collector = createCollector<SomeEvent>()
 *   const unsub = facade.subscribe(collector.push)
 *   // ... trigger events ...
 *   expect(collector.items).toHaveLength(2)
 *   unsub()
 */
export function createCollector<T>() {
  const items: T[] = []
  return {
    items,
    push: (item: T) => { items.push(item) },
    clear: () => { items.length = 0 },
    last: () => items[items.length - 1],
  }
}
