// modules/recommendation/ui/composables/useRecommendationNavigation.ts — CE9-F
// Keyboard navigation for recommendation rails.

import { ref } from 'vue'

export function useRecommendationNavigation() {
  const focusedIndex = ref(0)
  const focusedRail = ref('')

  function navigateLeft(): void { if (focusedIndex.value > 0) focusedIndex.value-- }
  function navigateRight(max: number): void { if (focusedIndex.value < max - 1) focusedIndex.value++ }
  function navigateUp(rails: string[]): void {
    const idx = rails.indexOf(focusedRail.value)
    if (idx > 0) focusedRail.value = rails[idx - 1]
  }
  function navigateDown(rails: string[]): void {
    const idx = rails.indexOf(focusedRail.value)
    if (idx < rails.length - 1) focusedRail.value = rails[idx + 1]
  }
  function focusItem(railId: string, index: number): void {
    focusedRail.value = railId
    focusedIndex.value = index
  }
  function reset(): void { focusedIndex.value = 0; focusedRail.value = '' }

  return { focusedIndex, focusedRail, navigateLeft, navigateRight, navigateUp, navigateDown, focusItem, reset }
}
