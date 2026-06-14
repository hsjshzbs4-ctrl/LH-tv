// modules/recommendation/ui/skeletons/RecommendationSkeleton.ts — CE9-F
// Loading skeleton components. No blank screens allowed.

import { defineComponent, computed } from 'vue'
import { LOADING_CONFIG } from '../constants/recommendation-ui.constants'

export const RecommendationSkeleton = defineComponent({
  name: 'RecommendationSkeleton',
  setup() {
    const cards = computed(() => Array.from({ length: LOADING_CONFIG.skeletonCards }, (_, i) => i))
    return { cards }
  },
})

export const RailSkeleton = defineComponent({
  name: 'RailSkeleton',
  setup() {
    const cards = computed(() => Array.from({ length: LOADING_CONFIG.skeletonCards }, (_, i) => i))
    return { cards }
  },
})

export const HeroSkeleton = defineComponent({
  name: 'HeroSkeleton',
  setup() { return {} },
})
