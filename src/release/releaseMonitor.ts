// src/release/releaseMonitor.ts — PB1-009 Release Monitor
// Tracks app version, release channel, build number, upgrade/downgrade paths.
// Pure TypeScript — no framework dependencies.

export interface ReleaseEvent {
  id: string
  timestamp: number
  type: 'install' | 'upgrade' | 'downgrade' | 'channel-switch'
  fromVersion: string | null
  toVersion: string
  channel: string
  buildNumber: string
}

export interface ReleaseMetrics {
  activeVersion: string
  activeChannel: string
  buildNumber: string
  installVersion: string
  upgradeCount: number
  downgradeCount: number
  channelDistribution: Record<string, number>
  versionHistory: string[]
  isUpgrade: boolean
  isDowngrade: boolean
  isFirstInstall: boolean
}

function generateId(): string {
  return `rel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0
    const db = pb[i] || 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

export class ReleaseMonitor {
  private events: ReleaseEvent[] = []
  private currentVersion: string
  private currentChannel: string
  private buildNumber: string
  private installVersion: string

  constructor(currentVersion: string = '2.0.0', channel: string = 'stable', buildNumber: string = '1') {
    this.currentVersion = currentVersion
    this.currentChannel = channel
    this.buildNumber = buildNumber
    this.installVersion = currentVersion
  }

  /** Initialize with persisted events (called on app startup) */
  initialize(previousVersion: string | null, channel: string, build: string): void {
    this.currentChannel = channel
    this.buildNumber = build

    if (!previousVersion) {
      // First install
      this.recordEvent('install', null, this.currentVersion)
      this.installVersion = this.currentVersion
    } else if (compareVersions(this.currentVersion, previousVersion) > 0) {
      // Upgrade
      this.recordEvent('upgrade', previousVersion, this.currentVersion)
      this.installVersion = previousVersion
    } else if (compareVersions(this.currentVersion, previousVersion) < 0) {
      // Downgrade
      this.recordEvent('downgrade', previousVersion, this.currentVersion)
      this.installVersion = previousVersion
    }
  }

  private recordEvent(type: ReleaseEvent['type'], fromVersion: string | null, toVersion: string): void {
    this.events.push({
      id: generateId(),
      timestamp: Date.now(),
      type,
      fromVersion,
      toVersion,
      channel: this.currentChannel,
      buildNumber: this.buildNumber
    })
  }

  /** Get current version info */
  getVersionInfo(): { version: string; channel: string; build: string } {
    return {
      version: this.currentVersion,
      channel: this.currentChannel,
      build: this.buildNumber
    }
  }

  /** Compute release metrics */
  getMetrics(): ReleaseMetrics {
    const upgrades = this.events.filter(e => e.type === 'upgrade').length
    const downgrades = this.events.filter(e => e.type === 'downgrade').length
    const firstInstall = this.events.some(e => e.type === 'install')

    const channelDist: Record<string, number> = {}
    for (const event of this.events) {
      channelDist[event.channel] = (channelDist[event.channel] || 0) + 1
    }

    const versionHistory = this.events
      .filter(e => e.type === 'upgrade' || e.type === 'downgrade')
      .map(e => `${e.fromVersion}→${e.toVersion}`)

    return {
      activeVersion: this.currentVersion,
      activeChannel: this.currentChannel,
      buildNumber: this.buildNumber,
      installVersion: this.installVersion,
      upgradeCount: upgrades,
      downgradeCount: downgrades,
      channelDistribution: channelDist,
      versionHistory,
      isUpgrade: upgrades > 0,
      isDowngrade: downgrades > 0,
      isFirstInstall: firstInstall && upgrades === 0 && downgrades === 0
    }
  }

  /** Get version distribution for dashboard */
  getVersionDistribution(): { current: string; installed: string; totalUpgrades: number } {
    const metrics = this.getMetrics()
    return {
      current: metrics.activeVersion,
      installed: metrics.installVersion,
      totalUpgrades: metrics.upgradeCount
    }
  }

  /** Export events for persistence */
  exportEvents(): ReleaseEvent[] {
    return [...this.events]
  }

  /** Import events from persistence */
  importEvents(events: ReleaseEvent[]): void {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    this.events = events.filter(e => e.timestamp >= cutoff)
    // Recover install version from events
    const install = this.events.find(e => e.type === 'install')
    if (install) {
      this.installVersion = install.toVersion
    }
  }

  /** Clear all data */
  clear(): void {
    this.events = []
    this.installVersion = this.currentVersion
  }
}
