// modules/search-unified/bootstrap/SearchFeatureFlags.ts — CE8-C4
// Feature flags for gradual rollout. Future support for runtime toggling.

export interface SearchFeatureFlags {
  readonly analytics: boolean
  readonly suggestions: boolean
  readonly profiles: boolean
  readonly trending: boolean
  readonly providerMetrics: boolean
}

export class SearchFeatureFlagsManager {
  private flags: SearchFeatureFlags

  constructor(flags: SearchFeatureFlags) {
    this.flags = { ...flags }
  }

  isEnabled(feature: keyof SearchFeatureFlags): boolean {
    return this.flags[feature] ?? false
  }

  /** Runtime toggle (future — currently configuration-only). */
  setFlag(feature: keyof SearchFeatureFlags, enabled: boolean): void {
    this.flags = { ...this.flags, [feature]: enabled }
  }

  getAll(): SearchFeatureFlags {
    return { ...this.flags }
  }
}
