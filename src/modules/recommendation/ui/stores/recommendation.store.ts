// modules/recommendation/ui/stores/recommendation.store.ts — CE9-F
// Pinia store for recommendation UI state management.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UIRecommendationItem } from '../types/recommendation-ui.types'

export const useRecommendationStore = defineStore('recommendation', () => {
  // ─── State ───
  const feeds = ref<Record<string, unknown>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const heroContent = ref<UIRecommendationItem | null>(null)
  const selectedItem = ref<UIRecommendationItem | null>(null)
  const impressions = ref(0)
  const clicks = ref(0)
  const plays = ref(0)

  // ─── Getters ───
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const hasHero = computed(() => heroContent.value !== null)
  const feedCount = computed(() => Object.keys(feeds.value).length)

  // ─── Actions ───
  function setFeed(key: string, feed: unknown): void {
    feeds.value[key] = feed
  }

  function setLoading(value: boolean): void { loading.value = value }
  function setError(message: string | null): void { error.value = message }
  function setHero(item: UIRecommendationItem | null): void { heroContent.value = item }
  function selectItem(item: UIRecommendationItem | null): void { selectedItem.value = item }
  function recordImpression(): void { impressions.value++ }
  function recordClick(): void { clicks.value++ }
  function recordPlay(): void { plays.value++ }

  function reset(): void {
    feeds.value = {}
    loading.value = false
    error.value = null
    heroContent.value = null
    selectedItem.value = null
    impressions.value = 0
    clicks.value = 0
    plays.value = 0
  }

  return {
    feeds, loading, error, heroContent, selectedItem, impressions, clicks, plays,
    isLoading, hasError, hasHero, feedCount,
    setFeed, setLoading, setError, setHero, selectItem, recordImpression, recordClick, recordPlay, reset,
  }
})
