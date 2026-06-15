// src/release/installationAnalytics.ts — PB1-010 Installation Analytics
// Tracks first install, reinstall, upgrade, portable launch, OS/arch distribution.
// Pure TypeScript — no framework dependencies.

export interface InstallEvent {
  id: string
  timestamp: number
  type: 'first-install' | 'reinstall' | 'upgrade-install' | 'portable-launch'
  platform: string
  arch: string
  version: string
  isPortable: boolean
}

export interface InstallMetrics {
  totalInstalls: number
  firstInstalls: number
  reinstalls: number
  upgradeInstalls: number
  portableLaunches: number
  platformDistribution: Record<string, number>
  archDistribution: Record<string, number>
  installTypeDistribution: Record<string, number>
}

function generateId(): string {
  return `ins-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export class InstallationAnalytics {
  private events: InstallEvent[] = []
  private platform: string
  private arch: string
  private isPortable: boolean

  constructor(platform?: string, arch?: string, isPortable?: boolean) {
    this.platform = platform || process.platform
    this.arch = arch || process.arch
    this.isPortable = isPortable ?? true
  }

  /** Record installation/launch event */
  recordInstall(type: InstallEvent['type']): InstallEvent {
    const event: InstallEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      platform: this.platform,
      arch: this.arch,
      version: '2.0.0', // Will be set by ReleaseMonitor
      isPortable: this.isPortable
    }
    this.events.push(event)
    return event
  }

  /** Record a launch (called every app start) */
  recordLaunch(): InstallEvent {
    return this.recordInstall('portable-launch')
  }

  /** Record first install */
  recordFirstInstall(): InstallEvent {
    return this.recordInstall('first-install')
  }

  /** Record reinstall (same version) */
  recordReinstall(): InstallEvent {
    return this.recordInstall('reinstall')
  }

  /** Record upgrade install (new version installed) */
  recordUpgradeInstall(): InstallEvent {
    return this.recordInstall('upgrade-install')
  }

  /** Compute install metrics */
  getMetrics(): InstallMetrics {
    const platformDist: Record<string, number> = {}
    const archDist: Record<string, number> = {}
    const typeDist: Record<string, number> = {}

    for (const event of this.events) {
      platformDist[event.platform] = (platformDist[event.platform] || 0) + 1
      archDist[event.arch] = (archDist[event.arch] || 0) + 1
      typeDist[event.type] = (typeDist[event.type] || 0) + 1
    }

    return {
      totalInstalls: this.events.length,
      firstInstalls: this.events.filter(e => e.type === 'first-install').length,
      reinstalls: this.events.filter(e => e.type === 'reinstall').length,
      upgradeInstalls: this.events.filter(e => e.type === 'upgrade-install').length,
      portableLaunches: this.events.filter(e => e.type === 'portable-launch').length,
      platformDistribution: platformDist,
      archDistribution: archDist,
      installTypeDistribution: typeDist
    }
  }

  /** Get install statistics for dashboard */
  getInstallStatistics(): {
    total: number
    firstTime: number
    upgrades: number
    portable: boolean
    platform: string
    arch: string
  } {
    const metrics = this.getMetrics()
    return {
      total: metrics.totalInstalls,
      firstTime: metrics.firstInstalls,
      upgrades: metrics.upgradeInstalls,
      portable: this.isPortable,
      platform: this.platform,
      arch: this.arch
    }
  }

  /** Get platform distribution */
  getPlatformDistribution(): Record<string, number> {
    const dist: Record<string, number> = {}
    for (const event of this.events) {
      dist[event.platform] = (dist[event.platform] || 0) + 1
    }
    return dist
  }

  /** Export events for persistence */
  exportEvents(): InstallEvent[] {
    return [...this.events]
  }

  /** Import events from persistence */
  importEvents(events: InstallEvent[]): void {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    this.events = events.filter(e => e.timestamp >= cutoff)
  }

  /** Clear all data */
  clear(): void {
    this.events = []
  }
}
