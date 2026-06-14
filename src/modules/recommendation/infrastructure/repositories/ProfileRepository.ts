// modules/recommendation/infrastructure/repositories/ProfileRepository.ts — CE9-D

import type { IStorageAdapter } from '../storage/IStorageAdapter'
import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'

export interface IProfileRepository {
  save(userId: string, profile: RecommendationProfile): Promise<void>
  load(userId: string): Promise<RecommendationProfile | null>
  delete(userId: string): Promise<void>
}

export class ProfileRepository implements IProfileRepository {
  constructor(private storage: IStorageAdapter<Record<string, RecommendationProfile>>) {}

  private async _ensureLoaded(): Promise<Record<string, RecommendationProfile>> {
    return (await this.storage.load()) ?? {}
  }

  async save(userId: string, profile: RecommendationProfile): Promise<void> {
    const data = await this._ensureLoaded()
    data[userId] = profile
    await this.storage.save(data)
  }

  async load(userId: string): Promise<RecommendationProfile | null> {
    const data = await this._ensureLoaded()
    return data[userId] ?? null
  }

  async delete(userId: string): Promise<void> {
    const data = await this._ensureLoaded()
    delete data[userId]
    await this.storage.save(data)
  }
}
