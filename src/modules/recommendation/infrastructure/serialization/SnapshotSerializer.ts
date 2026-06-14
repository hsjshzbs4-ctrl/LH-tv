// modules/recommendation/infrastructure/serialization/SnapshotSerializer.ts — CE9-D

import type { RecommendationSnapshot } from '../../runtime/snapshots/RecommendationSnapshotService'

export class SnapshotSerializer {
  serialize(snapshot: RecommendationSnapshot): string {
    return JSON.stringify(snapshot)
  }

  deserialize(json: string): RecommendationSnapshot | null {
    try { return JSON.parse(json) as RecommendationSnapshot }
    catch { return null }
  }
}
