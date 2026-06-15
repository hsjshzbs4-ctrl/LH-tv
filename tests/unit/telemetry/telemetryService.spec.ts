// tests/unit/telemetry/telemetryService.spec.ts — PB1-004 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { TelemetryService, MemoryTelemetryStorage, getTelemetryService, setTelemetryService } from '@/telemetry/telemetryService'

describe('TelemetryService', () => {
  let service: TelemetryService

  beforeEach(() => {
    service = new TelemetryService(new MemoryTelemetryStorage())
  })

  // ── Initialization ──

  it('should initialize with cold start by default', async () => {
    await service.initialize(false)
    const dashboard = service.getDashboard()
    expect(dashboard.totalSessions).toBe(0) // Session started but not yet ended
  })

  it('should initialize with warm start flag', async () => {
    await service.initialize(true)
    // Startup records not yet complete (no shutdown called)
    const metrics = service.startup.exportRecords()
    expect(metrics).toHaveLength(0) // Not completed yet
  })

  it('should not double-initialize', async () => {
    await service.initialize()
    const sessionId = service.session.getCurrentSessionId()
    await service.initialize() // Second call should be ignored
    expect(service.session.getCurrentSessionId()).toBe(sessionId)
  })

  // ── Shutdown ──

  it('should shutdown and complete startup', async () => {
    await service.initialize(false)
    await service.shutdown(false)

    const records = service.startup.exportRecords()
    expect(records).toHaveLength(1)
    expect(records[0].success).toBe(true)
  })

  it('should mark crash-detected on shutdown', async () => {
    await service.initialize(false)
    await service.shutdown(true)

    const records = service.session.exportRecords()
    expect(records).toHaveLength(1)
    expect(records[0].crashDetected).toBe(true)
  })

  // ── Dashboard ──

  it('should return dashboard with default metrics when empty', () => {
    const dashboard = service.getDashboard()
    expect(dashboard.crashFreeSessionRate).toBe(1)
    expect(dashboard.startupSuccessRate).toBe(1)
    expect(dashboard.totalSessions).toBe(0)
    expect(dashboard.totalCrashes).toBe(0)
    expect(dashboard.recoverySuccessRate).toBe(1)
  })

  it('should reflect crash data in dashboard', () => {
    service.crash.recordCrash('test-crash', 1, 'session-1')
    const dashboard = service.getDashboard()
    expect(dashboard.totalCrashes).toBe(1)
  })

  it('should reflect session data in dashboard', () => {
    service.session.startSession()
    service.session.endSession(false)
    const dashboard = service.getDashboard()
    expect(dashboard.totalSessions).toBe(1)
  })

  it('should reflect startup data in dashboard', () => {
    service.startup.beginStartup('cold-start')
    service.startup.recordCustomStage('test', 100)
    service.startup.completeStartup(true)
    const dashboard = service.getDashboard()
    expect(dashboard.averageColdStartTime).toBe(100)
  })

  // ── Persistence (Memory Storage) ──

  it('should save and load crash events across instances', async () => {
    const storage = new MemoryTelemetryStorage()
    const s1 = new TelemetryService(storage)

    s1.crash.recordCrash('persisted-crash', 1)
    await s1.flush()

    const s2 = new TelemetryService(storage)
    await s2.initialize()
    expect(s2.crash.exportEvents()).toHaveLength(1)
    expect(s2.crash.exportEvents()[0].reason).toBe('persisted-crash')
  })

  it('should save and load session records across instances', async () => {
    const storage = new MemoryTelemetryStorage()
    const s1 = new TelemetryService(storage)

    s1.session.startSession()
    s1.session.endSession(false)
    await s1.flush()

    const s2 = new TelemetryService(storage)
    await s2.initialize()
    expect(s2.session.exportRecords()).toHaveLength(1)
  })

  it('should save and load startup records across instances', async () => {
    const storage = new MemoryTelemetryStorage()
    const s1 = new TelemetryService(storage)

    s1.startup.beginStartup('cold-start')
    s1.startup.completeStartup(true)
    await s1.flush()

    const s2 = new TelemetryService(storage)
    await s2.initialize()
    expect(s2.startup.exportRecords()).toHaveLength(1)
  })

  // ── Export All ──

  it('should export all telemetry data', () => {
    service.crash.recordCrash('test', 1)
    service.session.startSession()
    service.session.endSession(false)
    service.startup.beginStartup('cold-start')
    service.startup.completeStartup(true)

    const all = service.exportAll()
    expect(all.crashEvents).toHaveLength(1)
    expect(all.sessionRecords).toHaveLength(1)
    expect(all.startupRecords).toHaveLength(1)
    expect(all.dashboard).toBeDefined()
    expect(all.dashboard.totalCrashes).toBe(1)
  })

  // ── Clear All ──

  it('should clear all data including storage', async () => {
    service.crash.recordCrash('test', 1)
    service.session.startSession()
    service.session.endSession(false)
    await service.flush()

    await service.clearAll()
    expect(service.crash.exportEvents()).toHaveLength(0)
    expect(service.session.exportRecords()).toHaveLength(0)
    expect(service.startup.exportRecords()).toHaveLength(0)
  })

  // ── Storage Swap ──

  it('should support swapping storage backend', () => {
    const storage1 = new MemoryTelemetryStorage()
    const storage2 = new MemoryTelemetryStorage()

    service.setStorage(storage1)
    expect(service.getStorage()).toBe(storage1)

    service.setStorage(storage2)
    expect(service.getStorage()).toBe(storage2)
  })

  // ── Singleton ──

  it('should provide global singleton', () => {
    const s1 = getTelemetryService()
    const s2 = getTelemetryService()
    expect(s1).toBe(s2)
  })

  it('should support replacing singleton', () => {
    const original = getTelemetryService()
    const replacement = new TelemetryService()
    setTelemetryService(replacement)
    expect(getTelemetryService()).toBe(replacement)

    // Restore
    setTelemetryService(original)
  })
})

describe('MemoryTelemetryStorage', () => {
  it('should save and load data', async () => {
    const storage = new MemoryTelemetryStorage()
    await storage.save('key', { value: 42 })
    const loaded = await storage.load<{ value: number }>('key')
    expect(loaded).toEqual({ value: 42 })
  })

  it('should return null for missing keys', async () => {
    const storage = new MemoryTelemetryStorage()
    const result = await storage.load('nonexistent')
    expect(result).toBeNull()
  })

  it('should remove keys', async () => {
    const storage = new MemoryTelemetryStorage()
    await storage.save('key', 'value')
    await storage.remove('key')
    expect(await storage.load('key')).toBeNull()
  })
})
