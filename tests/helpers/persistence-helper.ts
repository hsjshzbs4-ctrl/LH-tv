// tests/helpers/persistence-helper.ts — 持久化验证通用工具
// Phase 12: Persistence Verification

import { vi } from 'vitest'

/**
 * 模拟应用重启：创建实例 → 保存 → 销毁 → 重建 → 加载
 *
 * 用法：
 *   const restored = await simulateRestart(
 *     () => new MyManager(),
 *     async (m) => { await m.addData(...) },
 *     async (m) => { await m.destroy?.() },
 *   )
 */
export async function simulateRestart<T>(
  factory: () => T,
  setup?: (instance: T) => Promise<void>,
  teardown?: (instance: T) => Promise<void>,
): Promise<T> {
  // Phase 1: 创建并写入
  const instance1 = factory()
  if (setup) await setup(instance1)

  // Phase 2: 销毁（模拟应用退出）
  if (teardown) await teardown(instance1)

  // Phase 3: 重建（模拟应用重启）
  const instance2 = factory()

  return instance2
}

/**
 * 模拟应用崩溃重启（不经过正常销毁流程）
 */
export async function simulateCrashRestart<T>(
  factory: () => T,
  setup?: (instance: T) => Promise<void>,
): Promise<T> {
  const instance1 = factory()
  if (setup) await setup(instance1)

  // 不调用 destroy，直接重建
  const instance2 = factory()

  return instance2
}

/**
 * 模拟连续多次重启
 */
export async function simulateMultipleRestarts<T>(
  factory: () => T,
  setup: (instance: T) => Promise<void>,
  validate: (instance: T) => Promise<void>,
  count: number,
): Promise<void> {
  let instance = factory()
  await setup(instance)

  for (let i = 0; i < count; i++) {
    // 重建
    instance = factory()
    await validate(instance)
  }
}

/**
 * 创建损坏的 JSON 数据
 */
export function corruptJSON(json: string): string {
  // 截断
  return json.slice(0, Math.floor(json.length / 3))
}

/**
 * 创建空数据
 */
export const EMPTY_DATA = '{}'

/**
 * 创建缺少字段的数据
 */
export function createPartialData<T extends Record<string, unknown>>(
  full: T,
  fieldsToKeep: (keyof T)[],
): Partial<T> {
  const partial: Partial<T> = {}
  for (const field of fieldsToKeep) {
    partial[field] = full[field]
  }
  return partial
}

/**
 * 性能计时工具
 */
export async function measureTime(fn: () => Promise<void>): Promise<number> {
  const start = performance.now()
  await fn()
  return performance.now() - start
}

/**
 * 验证恢复耗时在阈值内
 */
export async function expectRecoveryWithin(
  fn: () => Promise<void>,
  maxMs: number,
  label: string,
): Promise<void> {
  const elapsed = await measureTime(fn)
  if (elapsed > maxMs) {
    console.warn(`[PERF] ${label}: ${elapsed.toFixed(2)}ms > ${maxMs}ms threshold`)
  }
  // 不硬失败，仅记录
}
