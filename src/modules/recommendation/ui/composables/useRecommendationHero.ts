// modules/recommendation/ui/composables/useRecommendationHero.ts — CE9-F

import { ref, computed } from 'vue'
import type { UIRecommendationItem } from '../types/recommendation-ui.types'

export function useRecommendationHero() {
  const heroItem = ref<UIRecommendationItem | null>(null)
  const autoRotateInterval = ref<ReturnType<typeof setInterval> | null>(null)

  const hasHero = computed(() => heroItem.value !== null)

  function setHero(item: UIRecommendationItem | null): void {
    heroItem.value = item
  }

  function startAutoRotate(items: UIRecommendationItem[], intervalMs = 8000): void {
    stopAutoRotate()
    if (items.length === 0) return
    heroItem.value = items[0]
    if (items.length <= 1) return
    let idx = 0
    autoRotateInterval.value = setInterval(() => {
      idx = (idx + 1) % items.length
      heroItem.value = items[idx]
    }, intervalMs)
  }

  function stopAutoRotate(): void {
    if (autoRotateInterval.value) {
      clearInterval(autoRotateInterval.value)
      autoRotateInterval.value = null
    }
  }

  return { heroItem, hasHero, setHero, startAutoRotate, stopAutoRotate }
}
