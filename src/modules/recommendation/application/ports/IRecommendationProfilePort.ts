// modules/recommendation/application/ports/IRecommendationProfilePort.ts — CE9-B
// Profile management port. Reads/writes user recommendation profiles.

import type { RecommendationProfile } from '../../domain/entities/RecommendationProfile'

export interface IRecommendationProfilePort {
  /** Load the current user profile (returns null if not yet built) */
  loadProfile(userId: string): Promise<RecommendationProfile | null>

  /** Persist a user profile */
  saveProfile(profile: RecommendationProfile): Promise<void>

  /** Force a profile refresh */
  refreshProfile(userId: string): Promise<RecommendationProfile>
}
