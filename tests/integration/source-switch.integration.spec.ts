// tests/integration/source-switch.integration.spec.ts — SourceSwitchManager 集成
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SourceSwitchManager } from '@/core/playback/manager/SourceSwitchManager'
import { SourceSwitchEvent } from '@/core/playback/types/playback.types'
import type { PlaybackSource } from '@/core/playback/types/playback.types'

function src(providerId: string, name: string): PlaybackSource {
  return { providerId, providerName: name, playUrl: `https://x.com/${providerId}.mp4`, type: 'mp4', headers: {} }
}

describe('Source Switch Integration Flow', () => {
  let manager: SourceSwitchManager

  beforeEach(() => { manager = new SourceSwitchManager() })

  // Case 01: Provider A 成功 → 不切换
  it('Case 01: should keep successful source', () => {
    const sources = [src('p1', 'Provider A'), src('p2', 'Provider B')]
    const first = manager.start('m1', sources, 1)
    expect(first?.providerId).toBe('p1')

    manager.onSuccess('m1')
    // 验证缓存
    expect(manager.getCachedProvider('m1')).toBe('p1')
  })

  // Case 02: Provider A fail → auto switch to B
  it('Case 02: should auto-switch on failure', () => {
    const events: Array<{ event: string; toSource?: string }> = []
    manager.subscribe((d) => events.push({ event: d.event, toSource: d.toSource }))

    const sources = [src('p1', 'Provider A'), src('p2', 'Provider B')]
    manager.start('m1', sources, 1)
    const next = manager.onFailed('timeout')

    expect(next?.providerId).toBe('p2')
    expect(events.some(e => e.event === SourceSwitchEvent.SWITCHING)).toBe(true)
  })

  // Case 03: All fail → exhausted
  it('Case 03: should exhaust when all sources fail', () => {
    const events: string[] = []
    manager.subscribe((d) => events.push(d.event))

    const sources = [src('p1', 'A'), src('p2', 'B')]
    manager.start('m1', sources, 1)
    manager.onFailed('err1') // retry 1 → B
    manager.onFailed('err2') // retry 2 → all tried, but retryCount=2 < maxRetries=3
    const exhausted = manager.onFailed('err3') // retry 3 → EXHAUSTED (maxRetries=3 reached)

    expect(exhausted).toBeNull()
    expect(events).toContain(SourceSwitchEvent.EXHAUSTED)
    expect(manager.remainingRetries).toBe(0)
  })

  // Case 04: Switch during pause
  it('Case 04: should handle pause during switch', () => {
    const sources = [src('p1', 'A'), src('p2', 'B')]
    manager.start('m1', sources, 1)
    manager.saveProgress(120) // pause at 120s

    // 切换
    const next = manager.onFailed('error')
    expect(next?.providerId).toBe('p2')
    // 进度保持
    expect(manager.getSavedProgress()).toBe(120)
  })

  // Case 05: Manual switch
  it('Case 05: should allow manual source switch', () => {
    const sources = [src('p1', 'A'), src('p2', 'B'), src('p3', 'C')]
    manager.start('m1', sources, 1)

    const switched = manager.switchToProvider('p3')
    expect(switched?.providerId).toBe('p3')
    expect(manager.getCurrentSource()?.providerId).toBe('p3')
  })

  // Progress preservation across switches
  it('should preserve progress across multiple switches', () => {
    const sources = [src('p1', 'A'), src('p2', 'B'), src('p3', 'C')]
    manager.start('m1', sources, 1)
    manager.saveProgress(300)

    manager.onFailed('e1') // → B
    manager.saveProgress(350)

    expect(manager.getSavedProgress()).toBe(350)
  })
})
