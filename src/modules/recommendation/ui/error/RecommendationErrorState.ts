// modules/recommendation/ui/error/RecommendationErrorState.ts — CE9-F
// Error state with retry, refresh, and offline support.

import { defineComponent, ref, type PropType } from 'vue'
import { LOADING_CONFIG } from '../constants/recommendation-ui.constants'

export const RecommendationErrorState = defineComponent({
  name: 'RecommendationErrorState',
  props: {
    message: { type: String, default: 'Failed to load recommendations' },
    retryable: { type: Boolean, default: true },
  },
  emits: ['retry', 'refresh'],
  setup(props, { emit }) {
    const retryCount = ref(0)
    const canRetry = () => retryCount.value < LOADING_CONFIG.maxRetries

    function onRetry(): void {
      if (canRetry()) { retryCount.value++; emit('retry') }
    }
    function onRefresh(): void { emit('refresh') }

    return { retryCount, canRetry, onRetry, onRefresh }
  },
})
