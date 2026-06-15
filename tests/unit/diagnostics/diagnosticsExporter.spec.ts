// tests/unit/diagnostics/diagnosticsExporter.spec.ts — PB1-005 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { DiagnosticsExporter, BasicSystemInfoProvider, type ISystemInfoProvider } from '@/diagnostics/diagnosticsExporter'

class MockSystemProvider implements ISystemInfoProvider {
  getPlatform(): string { return 'test-platform' }
  getOSVersion(): string { return 'TestOS 1.0' }
  getArch(): string { return 'x64' }
  getCPUInfo(): string { return '4 cores' }
  getTotalMemory(): number { return 8 * 1024 * 1024 * 1024 }
  getFreeMemory(): number { return 4 * 1024 * 1024 * 1024 }
  getUserDataPath(): string { return '/test/data' }
}

describe('DiagnosticsExporter', () => {
  let exporter: DiagnosticsExporter

  beforeEach(() => {
    exporter = new DiagnosticsExporter(new MockSystemProvider(), {
      appVersion: '2.0.0-test',
      buildDate: '2026-06-15',
      gitCommit: 'abc123'
    })
  })

  it('should collect system info', () => {
    const info = exporter.collectSystemInfo()
    expect(info.platform).toBe('test-platform')
    expect(info.osVersion).toBe('TestOS 1.0')
    expect(info.arch).toBe('x64')
    expect(info.cpuInfo).toBe('4 cores')
    expect(info.totalMemory).toBeGreaterThan(0)
    expect(info.freeMemory).toBeGreaterThan(0)
    expect(info.userDataPath).toBe('/test/data')
    expect(info.timestamp).toBeGreaterThan(0)
  })

  it('should provide app metadata', () => {
    const meta = exporter.getAppMetadata()
    expect(meta.appName).toBe('LH-TV')
    expect(meta.appVersion).toBe('2.0.0-test')
    expect(meta.buildDate).toBe('2026-06-15')
    expect(meta.gitCommit).toBe('abc123')
  })

  it('should update app metadata', () => {
    exporter.updateAppMetadata({ appVersion: '2.1.0', gitCommit: 'def456' })
    const meta = exporter.getAppMetadata()
    expect(meta.appVersion).toBe('2.1.0')
    expect(meta.gitCommit).toBe('def456')
  })

  it('should generate diagnostic snapshot without telemetry', () => {
    const snapshot = exporter.generateDiagnosticSnapshot()
    expect(snapshot.id).toMatch(/^diag-/)
    expect(snapshot.timestamp).toBeGreaterThan(0)
    expect(snapshot.systemInfo).toBeDefined()
    expect(snapshot.appMetadata).toBeDefined()
    expect(snapshot.telemetry).toBeUndefined()
    expect(snapshot.recentCrashes).toBeUndefined()
  })

  it('should integrate telemetry data in snapshot', () => {
    exporter.setTelemetryProvider(() => ({
      dashboard: { totalSessions: 5, totalCrashes: 1 } as any,
      crashEvents: [{ id: 'c1', timestamp: Date.now(), type: 'renderer-crash', reason: 'test' }],
      startupRecords: [{ id: 's1', timestamp: Date.now(), type: 'cold-start', stages: [], totalDuration: 300, success: true }],
      sessionRecords: [{ sessionId: 's1', startTime: Date.now(), endTime: Date.now(), duration: 10000, crashDetected: false }]
    }))

    const snapshot = exporter.generateDiagnosticSnapshot()
    expect(snapshot.telemetry).toBeDefined()
    expect(snapshot.telemetry!.totalSessions).toBe(5)
    expect(snapshot.recentCrashes).toHaveLength(1)
    expect(snapshot.startupMetrics).toHaveLength(1)
    expect(snapshot.sessionMetrics).toHaveLength(1)
  })

  it('should handle telemetry provider errors gracefully', () => {
    exporter.setTelemetryProvider(() => {
      throw new Error('Telemetry unavailable')
    })
    const snapshot = exporter.generateDiagnosticSnapshot()
    expect(snapshot.id).toBeDefined()
    expect(snapshot.telemetry).toBeUndefined() // Graceful degradation
  })

  it('should export diagnostics as JSON string', () => {
    exporter.setTelemetryProvider(() => ({
      dashboard: { totalSessions: 0, totalCrashes: 0 } as any,
      crashEvents: [],
      startupRecords: [],
      sessionRecords: []
    }))
    const json = exporter.exportDiagnosticsJson()
    const parsed = JSON.parse(json)
    expect(parsed.id).toMatch(/^diag-/)
    expect(parsed.systemInfo).toBeDefined()
    expect(parsed.telemetry).toBeDefined()
  })

  it('should export compact JSON when pretty=false', () => {
    const json = exporter.exportDiagnosticsJson(false)
    expect(json).not.toContain('\n  ') // No pretty indentation
    const parsed = JSON.parse(json)
    expect(parsed.id).toBeDefined()
  })
})

describe('BasicSystemInfoProvider', () => {
  it('should return platform and arch', () => {
    const provider = new BasicSystemInfoProvider()
    expect(provider.getPlatform()).toBeDefined()
    expect(provider.getArch()).toBeDefined()
  })
})
