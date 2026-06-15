// tests/unit/diagnostics/bugReportBuilder.spec.ts — PB1-006 unit tests
import { describe, it, expect, beforeEach } from 'vitest'
import { DiagnosticsExporter } from '@/diagnostics/diagnosticsExporter'
import { BugReportBuilder } from '@/diagnostics/bugReportBuilder'

describe('BugReportBuilder', () => {
  let builder: BugReportBuilder

  beforeEach(() => {
    const exporter = new DiagnosticsExporter()
    builder = new BugReportBuilder(exporter)
  })

  it('should build a bug report', () => {
    const report = builder.buildReport({
      title: 'App crashes on startup',
      description: 'The application crashes immediately after launching on Windows 11.',
      category: 'crash',
      severity: 'critical',
      steps: ['Launch app', 'Observe white screen', 'App closes'],
      expectedBehavior: 'App should load the home page',
      actualBehavior: 'App crashes with white screen'
    })

    expect(report.id).toMatch(/^bug-/)
    expect(report.title).toBe('App crashes on startup')
    expect(report.category).toBe('crash')
    expect(report.severity).toBe('critical')
    expect(report.steps).toHaveLength(3)
    expect(report.diagnosticSnapshot).toBeDefined()
    expect(report.diagnosticSnapshot.systemInfo).toBeDefined()
  })

  it('should default to bug/medium when not specified', () => {
    const report = builder.buildReport({
      title: 'Minor issue',
      description: 'Some minor visual glitch in the settings page.'
    })
    expect(report.category).toBe('bug')
    expect(report.severity).toBe('medium')
  })

  it('should build a crash report from crash event', () => {
    const crashEvent = {
      id: 'crash-1',
      timestamp: Date.now(),
      type: 'renderer-crash' as const,
      reason: 'crashed',
      exitCode: 1
    }

    const report = builder.buildCrashReport(crashEvent)
    expect(report.category).toBe('crash')
    expect(report.severity).toBe('high')
    expect(report.title).toContain('crashed')
  })

  it('should classify recovery-failure as critical severity', () => {
    const crashEvent = {
      id: 'crash-2',
      timestamp: Date.now(),
      type: 'recovery-failure' as const,
      reason: 'Recovery exhausted'
    }

    const report = builder.buildCrashReport(crashEvent)
    expect(report.severity).toBe('critical')
  })

  it('should serialize a bug report', () => {
    const report = builder.buildReport({
      title: 'Test',
      description: 'Test description for serialization.'
    })
    const pkg = builder.serializeReport(report)
    expect(pkg.report).toBe(report)
    expect(pkg.serialized).toBeDefined()
    expect(JSON.parse(pkg.serialized).id).toBe(report.id)
    expect(pkg.createdAt).toBeGreaterThan(0)
  })

  it('should track report count', () => {
    expect(builder.getReportCount()).toBe(0)
    builder.buildReport({ title: 'Bug 1', description: 'Description 1' })
    builder.buildReport({ title: 'Bug 2', description: 'Description 2' })
    expect(builder.getReportCount()).toBe(2)
  })

  it('should clear reports', () => {
    builder.buildReport({ title: 'Bug', description: 'Desc' })
    builder.clearReports()
    expect(builder.getReportCount()).toBe(0)
  })

  it('should generate summary by category and severity', () => {
    builder.buildReport({ title: 'Crash 1', description: 'd', category: 'crash', severity: 'critical' })
    builder.buildReport({ title: 'Crash 2', description: 'd', category: 'crash', severity: 'high' })
    builder.buildReport({ title: 'Bug 1', description: 'd', category: 'bug', severity: 'medium' })
    builder.buildReport({ title: 'Perf 1', description: 'd', category: 'performance', severity: 'low' })

    const summary = builder.generateSummary()
    expect(summary.total).toBe(4)
    expect(summary.byCategory['crash']).toBe(2)
    expect(summary.byCategory['bug']).toBe(1)
    expect(summary.byCategory['performance']).toBe(1)
    expect(summary.bySeverity['critical']).toBe(1)
    expect(summary.bySeverity['high']).toBe(1)
    expect(summary.bySeverity['medium']).toBe(1)
    expect(summary.bySeverity['low']).toBe(1)
  })

  it('should include attachments in report', () => {
    const report = builder.buildReport({
      title: 'Bug with screenshot',
      description: 'Bug description',
      attachments: ['/path/to/screenshot.png', '/path/to/log.txt']
    })
    expect(report.attachments).toHaveLength(2)
    expect(report.attachments[0]).toBe('/path/to/screenshot.png')
  })

  it('should provide access to exporter', () => {
    expect(builder.getExporter()).toBeDefined()
  })
})
