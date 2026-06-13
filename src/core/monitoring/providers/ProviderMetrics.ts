// src/core/monitoring/providers/ProviderMetrics.ts - Provider 维度指标
// P4.5 Monitoring Center

import { MetricsCollector } from '../metrics/MetricsCollector'

export class ProviderMetricsTracker {
  constructor(private collector: MetricsCollector) {}

  recordSearchSuccess(providerId: string, responseTime: number): void {
    this.collector.increment('provider.search.success', { provider: providerId })
    this.collector.record('provider.search.latency', responseTime, { provider: providerId })
  }

  recordSearchFail(providerId: string): void {
    this.collector.increment('provider.search.fail', { provider: providerId })
  }

  recordDetailCall(providerId: string, responseTime: number): void {
    this.collector.increment('provider.detail.calls', { provider: providerId })
    this.collector.record('provider.detail.latency', responseTime, { provider: providerId })
  }

  recordRestart(providerId: string): void {
    this.collector.increment('provider.restart', { provider: providerId })
  }

  recordCrash(providerId: string): void {
    this.collector.increment('provider.crash', { provider: providerId })
  }

  getProviderSuccessRate(providerId: string): number {
    const success = this.collector.getCount('provider.search.success')
    const fail = this.collector.getCount('provider.search.fail')
    const total = success + fail
    return total > 0 ? success / total : 1
  }
}
