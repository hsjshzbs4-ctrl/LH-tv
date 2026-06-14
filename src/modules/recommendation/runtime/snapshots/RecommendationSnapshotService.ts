// modules/recommendation/runtime/snapshots/RecommendationSnapshotService.ts — CE9-C
// Captures runtime state for debug, replay, audit, and regression testing.

import type { RecommendationFeed } from '../../domain/entities/RecommendationFeed'
import type { RecommendationContext } from '../../domain/entities/RecommendationContext'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'

export interface RecommendationSnapshot {
  readonly id: string
  readonly capturedAt: number
  readonly version: string

  /** Inputs at snapshot time */
  readonly inputs: {
    readonly context: RecommendationContext
    readonly profile: RecommendationProfile | null
  }

  /** Output at snapshot time */
  readonly outputs: {
    readonly feed: RecommendationFeed | null
    readonly itemCount: number
    readonly sectionCount: number
  }

  /** Pipeline metrics */
  readonly metrics: {
    readonly generationTimeMs: number
    readonly activeEngines: string[]
    readonly cacheHit: boolean
    readonly engineLatencies: Record<string, number>
  }
}

export class RecommendationSnapshotService {
  private snapshots: RecommendationSnapshot[] = []
  private maxSnapshots: number

  constructor(maxSnapshots: number = 50) {
    this.maxSnapshots = maxSnapshots
  }

  /**
   * Capture a recommendation execution snapshot.
   */
  capture(
    context: RecommendationContext,
    profile: RecommendationProfile | null,
    feed: RecommendationFeed | null,
    generationTimeMs: number,
    activeEngines: string[],
    cacheHit: boolean,
    engineLatencies: Record<string, number>,
  ): RecommendationSnapshot {
    const snapshot: RecommendationSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      capturedAt: Date.now(),
      version: '1.0.0',
      inputs: { context, profile },
      outputs: {
        feed,
        itemCount: feed?.totalItems ?? 0,
        sectionCount: feed?.sections.length ?? 0,
      },
      metrics: {
        generationTimeMs,
        activeEngines,
        cacheHit,
        engineLatencies,
      },
    }

    this.snapshots.push(snapshot)

    // Evict oldest if at capacity
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot
  }

  /** Get all snapshots */
  getAll(): readonly RecommendationSnapshot[] {
    return [...this.snapshots]
  }

  /** Get most recent snapshot */
  getLatest(): RecommendationSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] ?? null
  }

  /** Get snapshots within a time window */
  getByTimeRange(from: number, to: number): RecommendationSnapshot[] {
    return this.snapshots.filter(s => s.capturedAt >= from && s.capturedAt <= to)
  }

  /** Clear all snapshots */
  clear(): void {
    this.snapshots = []
  }

  /** Get snapshot count */
  get count(): number {
    return this.snapshots.length
  }

  /** Compare two snapshots for regression testing */
  static diff(a: RecommendationSnapshot, b: RecommendationSnapshot): {
    itemCountDelta: number
    generationTimeDeltaMs: number
    enginesChanged: boolean
  } {
    const aEngines = new Set(a.metrics.activeEngines)
    const bEngines = new Set(b.metrics.activeEngines)
    const enginesChanged = aEngines.size !== bEngines.size ||
      ![...aEngines].every(e => bEngines.has(e))

    return {
      itemCountDelta: b.outputs.itemCount - a.outputs.itemCount,
      generationTimeDeltaMs: b.metrics.generationTimeMs - a.metrics.generationTimeMs,
      enginesChanged,
    }
  }
}
