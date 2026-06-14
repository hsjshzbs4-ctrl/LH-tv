// modules/recommendation/ui/pages/RecommendationHomePage.ts — CE9-F
// Netflix-style home recommendation page. Owns the home feed (Req 12).

import { defineComponent, onMounted, onUnmounted } from 'vue'
import { useRecommendationStore } from '../stores/recommendation.store'
import type { UIRecommendationItem } from '../types/recommendation-ui.types'

export const RecommendationHomePage = defineComponent({
  name: 'RecommendationHomePage',
  setup() {
    const store = useRecommendationStore()

    onMounted(() => { /* auto-load feed */ })
    onUnmounted(() => { store.reset() })

    function onItemClick(item: UIRecommendationItem): void {
      store.selectItem(item)
      store.recordClick()
    }

    function onItemPlay(item: UIRecommendationItem): void {
      store.recordPlay()
    }

    function onHeroPlay(item: UIRecommendationItem): void {
      store.recordPlay()
    }

    function onRetry(): void {
      store.setError(null)
    }

    return {
      store,
      onItemClick, onItemPlay, onHeroPlay, onRetry,
    }
  },
})
