// modules/recommendation/ui/composables/useRecommendationTracking.ts — CE9-F

import type { RecommendationService } from '../services/recommendationService'

export function useRecommendationTracking(service: RecommendationService) {
  async function trackImpression(feedId: string, sectionId: string, items: string[]): Promise<void> {
    try { await service.trackConsume(feedId, items[0] ?? '', 'impression') } catch {}
  }

  async function trackClick(feedId: string, sectionId: string, mediaId: string, position: number): Promise<void> {
    try { await service.trackClick(feedId, sectionId, mediaId, position) } catch {}
  }

  async function trackPlay(feedId: string, mediaId: string): Promise<void> {
    try { await service.trackConsume(feedId, mediaId, 'play') } catch {}
  }

  async function trackFavorite(feedId: string, mediaId: string): Promise<void> {
    try { await service.trackConsume(feedId, mediaId, 'favorite') } catch {}
  }

  return { trackImpression, trackClick, trackPlay, trackFavorite }
}
