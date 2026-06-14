// modules/recommendation/infrastructure/health/InfrastructureHealthService.ts — CE9-D

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface ComponentHealth {
  readonly name: string
  readonly status: HealthStatus
  readonly details: string
}

export interface InfrastructureHealthReport {
  readonly timestamp: number
  readonly overallStatus: HealthStatus
  readonly components: ComponentHealth[]
}

export class InfrastructureHealthService {
  private checks: Array<() => Promise<ComponentHealth>> = []

  registerCheck(check: () => Promise<ComponentHealth>): void {
    this.checks.push(check)
  }

  async getHealth(): Promise<InfrastructureHealthReport> {
    const results = await Promise.allSettled(this.checks.map(c => c()))
    const components: ComponentHealth[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      return { name: `check-${i}`, status: 'unhealthy', details: String(r.reason) }
    })

    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length
    const degradedCount = components.filter(c => c.status === 'degraded').length

    let overallStatus: HealthStatus = 'healthy'
    if (unhealthyCount > components.length / 2) overallStatus = 'unhealthy'
    else if (degradedCount > 0 || unhealthyCount > 0) overallStatus = 'degraded'

    return { timestamp: Date.now(), overallStatus, components }
  }

  async isHealthy(): Promise<boolean> {
    const health = await this.getHealth()
    return health.overallStatus === 'healthy'
  }
}
