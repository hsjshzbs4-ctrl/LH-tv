// modules/recommendation/ui/composables/useRecommendations.ts — CE9-F
// Composable for fetching and managing recommendation feeds.

import { ref, computed } from 'vue'
import type { UIFeed, LoadingState } from '../types/recommendation-ui.types'
import type { RecommendationService } from '../services/recommendationService'

export function useRecommendations(service: RecommendationService) {
  const feeds = ref<Record<string, UIFeed>>({})
  const loadingState = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  const isLoading = computed(() => loadingState.value === 'loading')
  const hasError = computed(() => loadingState.value === 'error')
  const allSections = computed(() => Object.values(feeds.value).flatMap(f => f.sections))

  async function loadHomeFeed(userId: string, experimentId: string, variantId: string): Promise<void> {
    loadingState.value = 'loading'
    error.value = null
    try {
      const [personalized, trending, continueWatching] = await Promise.all([
        service.loadPersonalizedFeed(userId, experimentId, variantId),
        service.loadTrendingFeed(userId, experimentId, variantId),
        service.loadContinueWatching(userId, experimentId, variantId),
      ])
      feeds.value = {}
      if (personalized) feeds.value['personalized'] = personalized
      if (trending) feeds.value['trending'] = trending
      if (continueWatching) feeds.value['continue-watching'] = continueWatching
      loadingState.value = 'loaded'
    } catch (err) {
      error.value = String(err)
      loadingState.value = 'error'
    }
  }

  async function refreshFeed(userId: string, experimentId: string, variantId: string): Promise<void> {
    loadingState.value = 'refreshing'
    await loadHomeFeed(userId, experimentId, variantId)
  }

  return { feeds, loadingState, error, isLoading, hasError, allSections, loadHomeFeed, refreshFeed }
}
