// modules/recommendation/infrastructure/repositories/RecommendationRepository.ts — CE9-D

import type { IStorageAdapter } from '../storage/IStorageAdapter'
import type { RecommendationFeed } from '../../domain/entities/RecommendationFeed'

export interface StoredFeed {
  readonly key: string
  readonly feed: RecommendationFeed
  readonly storedAt: number
}

export interface IRecommendationRepository {
  save(key: string, feed: RecommendationFeed): Promise<void>
  load(key: string): Promise<RecommendationFeed | null>
  delete(key: string): Promise<void>
  deleteByPrefix(prefix: string): Promise<void>
  list(prefix: string): Promise<string[]>
}

export class RecommendationRepository implements IRecommendationRepository {
  constructor(private storage: IStorageAdapter<Record<string, StoredFeed>>) {}

  private async _ensureLoaded(): Promise<Record<string, StoredFeed>> {
    return (await this.storage.load()) ?? {}
  }

  async save(key: string, feed: RecommendationFeed): Promise<void> {
    const data = await this._ensureLoaded()
    data[key] = { key, feed, storedAt: Date.now() }
    await this.storage.save(data)
  }

  async load(key: string): Promise<RecommendationFeed | null> {
    const data = await this._ensureLoaded()
    return data[key]?.feed ?? null
  }

  async delete(key: string): Promise<void> {
    const data = await this._ensureLoaded()
    delete data[key]
    await this.storage.save(data)
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const data = await this._ensureLoaded()
    for (const key of Object.keys(data)) {
      if (key.startsWith(prefix)) delete data[key]
    }
    await this.storage.save(data)
  }

  async list(prefix: string): Promise<string[]> {
    const data = await this._ensureLoaded()
    return Object.keys(data).filter(k => k.startsWith(prefix))
  }
}
