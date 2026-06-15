// tests/unit/telemetry/startupMetrics.spec.ts — PB1-003 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { StartupMetricsTracker } from '@/telemetry/startupMetrics'

describe('StartupMetricsTracker', () => {
  let tracker: StartupMetricsTracker

  beforeEach(() => {
    tracker = new StartupMetricsTracker()
  })

  // ── Startup Lifecycle ──

  it('should begin a cold startup', () => {
    const id = tracker.beginStartup('cold-start')
    expect(id).toMatch(/^startup-/)
  })

  it('should begin a warm startup', () => {
    const id = tracker.beginStartup('warm-start')
    expect(id).toMatch(/^startup-/)
  })

  it('should track stage start and end', () => {
    tracker.beginStartup('cold-start')
    tracker.stageStart('store-initialization')
    tracker.stageEnd('store-initialization')

    const record = tracker.completeStartup(true)
    const stage = record!.stages.find(s => s.name === 'store-initialization')
    expect(stage).toBeDefined()
    expect(stage!.duration).toBeGreaterThanOrEqual(0)
  })

  it('should auto-close unclosed stages on complete', () => {
    tracker.beginStartup('cold-start')
    tracker.stageStart('plugin-discovery')
    // Never call stageEnd — should be auto-closed
    tracker.stageStart('renderer-ready')

    const record = tracker.completeStartup(true)
    const discovery = record!.stages.find(s => s.name === 'plugin-discovery')
    expect(discovery!.duration).toBeGreaterThanOrEqual(0)
  })

  it('should record custom stages', () => {
    tracker.beginStartup('cold-start')
    tracker.recordCustomStage('db-init', 150)
    tracker.recordCustomStage('config-load', 45)

    const record = tracker.completeStartup(true)
    // Known stages (5) + custom stages (2) = 7
    expect(record!.stages).toHaveLength(7)
  })

  // ── Success / Failure ──

  it('should mark startup as successful', () => {
    tracker.beginStartup('cold-start')
    const record = tracker.completeStartup(true)
    expect(record!.success).toBe(true)
  })

  it('should mark startup as failed with error', () => {
    tracker.beginStartup('cold-start')
    const record = tracker.completeStartup(false, 'Renderer failed to load')
    expect(record!.success).toBe(false)
    expect(record!.errorMessage).toBe('Renderer failed to load')
  })

  it('should complete null if no startup in progress', () => {
    const record = tracker.completeStartup(true)
    expect(record).toBeNull()
  })

  // ── Metrics ──

  it('should calculate startup success rate', () => {
    tracker.beginStartup('cold-start')
    tracker.completeStartup(true)

    tracker.beginStartup('cold-start')
    tracker.completeStartup(true)

    tracker.beginStartup('cold-start')
    tracker.completeStartup(false, 'error')

    expect(tracker.getStartupSuccessRate()).toBeCloseTo(2 / 3)
  })

  it('should return 1.0 when no startups', () => {
    expect(tracker.getStartupSuccessRate()).toBe(1)
  })

  it('should calculate average cold start time', () => {
    tracker.beginStartup('cold-start')
    tracker.recordCustomStage('test', 200)
    tracker.completeStartup(true)

    tracker.beginStartup('cold-start')
    tracker.recordCustomStage('test', 400)
    tracker.completeStartup(true)

    expect(tracker.getAverageStartupTime('cold-start')).toBe(300)
  })

  it('should calculate average warm start time', () => {
    tracker.beginStartup('warm-start')
    tracker.recordCustomStage('test', 50)
    tracker.completeStartup(true)

    tracker.beginStartup('warm-start')
    tracker.recordCustomStage('test', 100)
    tracker.completeStartup(true)

    expect(tracker.getAverageStartupTime('warm-start')).toBe(75)
  })

  it('should aggregate stage averages', () => {
    tracker.beginStartup('cold-start')
    tracker.stageStart('store-initialization')
    tracker.stageEnd('store-initialization')
    // Override the duration for deterministic testing
    const record = tracker.completeStartup(true)
    const stage = record!.stages.find(s => s.name === 'store-initialization')!
    stage.duration = 100

    const metrics = tracker.getMetrics()
    expect(metrics.stageAverages['store-initialization']).toBe(100)
  })

  // ── Export / Import ──

  it('should export records', () => {
    tracker.beginStartup('cold-start')
    tracker.completeStartup(true)

    const records = tracker.exportRecords()
    expect(records).toHaveLength(1)
    expect(records[0].type).toBe('cold-start')
  })

  it('should import records and prune old ones', () => {
    tracker.importRecords([
      {
        id: 'old',
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
        type: 'cold-start',
        stages: [],
        totalDuration: 100,
        success: true
      }
    ])
    expect(tracker.exportRecords()).toHaveLength(0)
  })

  // ── Clear ──

  it('should clear all data', () => {
    tracker.beginStartup('cold-start')
    tracker.completeStartup(true)
    tracker.beginStartup('warm-start') // In progress

    tracker.clear()
    expect(tracker.exportRecords()).toHaveLength(0)
  })

  // ── Recent Startups Limit ──

  it('should keep only last 20 startups in metrics', () => {
    for (let i = 0; i < 25; i++) {
      tracker.beginStartup('cold-start')
      tracker.completeStartup(true)
    }
    const metrics = tracker.getMetrics()
    expect(metrics.recentStartups).toHaveLength(20)
  })

  // ── Known Stages ──

  it('should pre-create all 5 known stages', () => {
    tracker.beginStartup('cold-start')
    const record = tracker.completeStartup(true)
    const stageNames = record!.stages.map(s => s.name)
    expect(stageNames).toContain('main-process')
    expect(stageNames).toContain('store-initialization')
    expect(stageNames).toContain('plugin-discovery')
    expect(stageNames).toContain('renderer-ready')
    expect(stageNames).toContain('window-created')
  })
})
