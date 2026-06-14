// tests/unit/recommendation/ui/store.spec.ts — CE9-F

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecommendationStore } from '@/modules/recommendation/ui/stores/recommendation.store'
import type { UIRecommendationItem } from '@/modules/recommendation/ui/types/recommendation-ui.types'

function makeItem(mediaId = 'm1'): UIRecommendationItem {
  return { mediaId, title: 'Movie', cover: 'x', type: 'movie', year: 2024, score: 0.8, reason: 'Recommended for you' }
}

describe('useRecommendationStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('should initialize with default state', () => {
    const store = useRecommendationStore()
    expect(store.loading).toBe(false)
    expect(store.hasError).toBe(false)
    expect(store.hasHero).toBe(false)
    expect(store.feedCount).toBe(0)
  })

  it('should set feed', () => {
    const store = useRecommendationStore()
    store.setFeed('personalized', { sections: [] })
    expect(store.feedCount).toBe(1)
  })

  it('should set loading state', () => {
    const store = useRecommendationStore()
    store.setLoading(true)
    expect(store.isLoading).toBe(true)
    store.setLoading(false)
    expect(store.isLoading).toBe(false)
  })

  it('should set error', () => {
    const store = useRecommendationStore()
    store.setError('Network error')
    expect(store.hasError).toBe(true)
    expect(store.error).toBe('Network error')
  })

  it('should set hero content', () => {
    const store = useRecommendationStore()
    const item = makeItem()
    store.setHero(item)
    expect(store.hasHero).toBe(true)
    expect(store.heroContent?.mediaId).toBe('m1')
  })

  it('should select item', () => {
    const store = useRecommendationStore()
    const item = makeItem()
    store.selectItem(item)
    expect(store.selectedItem?.mediaId).toBe('m1')
  })

  it('should record impressions, clicks, plays', () => {
    const store = useRecommendationStore()
    store.recordImpression()
    store.recordClick()
    store.recordPlay()
    expect(store.impressions).toBe(1)
    expect(store.clicks).toBe(1)
    expect(store.plays).toBe(1)
  })

  it('should reset all state', () => {
    const store = useRecommendationStore()
    store.setFeed('p', {})
    store.setLoading(true)
    store.setHero(makeItem())
    store.recordClick()
    store.reset()
    expect(store.feedCount).toBe(0)
    expect(store.isLoading).toBe(false)
    expect(store.hasHero).toBe(false)
    expect(store.clicks).toBe(0)
  })
})
