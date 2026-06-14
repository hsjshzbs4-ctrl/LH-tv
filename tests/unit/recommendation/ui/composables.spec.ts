// tests/unit/recommendation/ui/composables.spec.ts — CE9-F

import { describe, it, expect, vi } from 'vitest'
import { useRecommendationNavigation } from '@/modules/recommendation/ui/composables/useRecommendationNavigation'
import { useRecommendationHero } from '@/modules/recommendation/ui/composables/useRecommendationHero'
import type { UIRecommendationItem } from '@/modules/recommendation/ui/types/recommendation-ui.types'

function makeItem(id: string): UIRecommendationItem {
  return { mediaId: id, title: id, cover: 'x', type: 'movie', year: 2024, score: 0.8, reason: 'Recommended', backdrop: 'bg.jpg' }
}

describe('useRecommendationNavigation', () => {
  it('should navigate left and right', () => {
    const nav = useRecommendationNavigation()
    nav.focusItem('rail-1', 3)
    expect(nav.focusedIndex.value).toBe(3)
    nav.navigateLeft()
    expect(nav.focusedIndex.value).toBe(2)
    nav.navigateRight(10)
    expect(nav.focusedIndex.value).toBe(3)
  })

  it('should not navigate past boundaries', () => {
    const nav = useRecommendationNavigation()
    nav.focusItem('rail-1', 0)
    nav.navigateLeft()
    expect(nav.focusedIndex.value).toBe(0)
    nav.focusItem('rail-1', 9)
    nav.navigateRight(10)
    expect(nav.focusedIndex.value).toBe(9)
  })

  it('should navigate between rails', () => {
    const nav = useRecommendationNavigation()
    const rails = ['rail-1', 'rail-2', 'rail-3']
    nav.focusItem('rail-2', 0)
    nav.navigateDown(rails)
    expect(nav.focusedRail.value).toBe('rail-3')
    nav.navigateUp(rails)
    expect(nav.focusedRail.value).toBe('rail-2')
  })

  it('should reset', () => {
    const nav = useRecommendationNavigation()
    nav.focusItem('r1', 5)
    nav.reset()
    expect(nav.focusedIndex.value).toBe(0)
    expect(nav.focusedRail.value).toBe('')
  })
})

describe('useRecommendationHero', () => {
  it('should set hero content', () => {
    const hero = useRecommendationHero()
    hero.setHero(makeItem('m1'))
    expect(hero.hasHero.value).toBe(true)
    expect(hero.heroItem.value?.mediaId).toBe('m1')
  })

  it('should handle null hero', () => {
    const hero = useRecommendationHero()
    expect(hero.hasHero.value).toBe(false)
  })

  it('should auto rotate items', async () => {
    vi.useFakeTimers()
    const hero = useRecommendationHero()
    const items = [makeItem('a'), makeItem('b'), makeItem('c')]
    hero.startAutoRotate(items, 100)
    expect(hero.heroItem.value?.mediaId).toBe('a')
    await vi.advanceTimersByTimeAsync(100)
    expect(hero.heroItem.value?.mediaId).toBe('b')
    await vi.advanceTimersByTimeAsync(100)
    expect(hero.heroItem.value?.mediaId).toBe('c')
    await vi.advanceTimersByTimeAsync(100)
    expect(hero.heroItem.value?.mediaId).toBe('a') // wraps around
    hero.stopAutoRotate()
    vi.useRealTimers()
  })

  it('should not auto rotate for single item', () => {
    const hero = useRecommendationHero()
    hero.startAutoRotate([makeItem('x')], 100)
    expect(hero.heroItem.value?.mediaId).toBe('x')
    hero.stopAutoRotate()
  })
})
