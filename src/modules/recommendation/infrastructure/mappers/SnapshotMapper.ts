// modules/recommendation/infrastructure/mappers/SnapshotMapper.ts — CE9-D

import type { RecommendationSnapshot } from '../../runtime/snapshots/RecommendationSnapshotService'

export interface StoredSnapshot {
  readonly id: string
  readonly data: string   // JSON-serialized snapshot
  readonly storedAt: number
}

export class SnapshotMapper {
  static toStorage(snapshot: RecommendationSnapshot): StoredSnapshot {
    return {
      id: snapshot.id,
      data: JSON.stringify(snapshot),
      storedAt: Date.now(),
    }
  }

  static fromStorage(stored: StoredSnapshot): RecommendationSnapshot | null {
    try { return JSON.parse(stored.data) as RecommendationSnapshot }
    catch { return null }
  }
}
