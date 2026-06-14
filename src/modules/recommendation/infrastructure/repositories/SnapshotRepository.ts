// modules/recommendation/infrastructure/repositories/SnapshotRepository.ts — CE9-D

import type { IStorageAdapter } from '../storage/IStorageAdapter'
import type { RecommendationSnapshot } from '../../runtime/snapshots/RecommendationSnapshotService'

export interface ISnapshotRepository {
  save(snapshot: RecommendationSnapshot): Promise<void>
  loadAll(): Promise<RecommendationSnapshot[]>
  loadLatest(): Promise<RecommendationSnapshot | null>
  loadRange(from: number, to: number): Promise<RecommendationSnapshot[]>
  clear(): Promise<void>
}

export class SnapshotRepository implements ISnapshotRepository {
  constructor(private storage: IStorageAdapter<RecommendationSnapshot[]>) {}

  private async _ensureLoaded(): Promise<RecommendationSnapshot[]> {
    return (await this.storage.load()) ?? []
  }

  async save(snapshot: RecommendationSnapshot): Promise<void> {
    const data = await this._ensureLoaded()
    data.push(snapshot)
    if (data.length > 50) data.shift()
    await this.storage.save(data)
  }

  async loadAll(): Promise<RecommendationSnapshot[]> {
    return this._ensureLoaded()
  }

  async loadLatest(): Promise<RecommendationSnapshot | null> {
    const data = await this._ensureLoaded()
    return data[data.length - 1] ?? null
  }

  async loadRange(from: number, to: number): Promise<RecommendationSnapshot[]> {
    return (await this._ensureLoaded()).filter(s => s.capturedAt >= from && s.capturedAt <= to)
  }

  async clear(): Promise<void> {
    await this.storage.save([])
  }
}
