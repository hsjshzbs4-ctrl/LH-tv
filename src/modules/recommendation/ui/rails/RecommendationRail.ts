// modules/recommendation/ui/rails/RecommendationRail.ts — CE9-F
// Horizontal scrolling recommendation rail.

import { defineComponent, ref, computed, type PropType } from 'vue'
import type { UIRecommendationItem, UIFeedSection } from '../types/recommendation-ui.types'

export const RecommendationRail = defineComponent({
  name: 'RecommendationRail',
  props: {
    section: { type: Object as PropType<UIFeedSection>, required: true },
    railId: { type: String, required: true },
  },
  emits: ['itemClick', 'itemPlay'],
  setup(props, { emit }) {
    const scrollPosition = ref(0)
    const showLeftArrow = computed(() => scrollPosition.value > 0)
    const showRightArrow = computed(() => props.section.items.length > 6)

    function scrollLeft(): void { scrollPosition.value = Math.max(0, scrollPosition.value - 400) }
    function scrollRight(): void { scrollPosition.value += 400 }
    function onItemClick(item: UIRecommendationItem, index: number): void { emit('itemClick', item, index) }
    function onItemPlay(item: UIRecommendationItem): void { emit('itemPlay', item) }

    return { scrollPosition, showLeftArrow, showRightArrow, scrollLeft, scrollRight, onItemClick, onItemPlay }
  },
})

export const ContinueWatchingRail = defineComponent({
  name: 'ContinueWatchingRail',
  props: { section: { type: Object as PropType<UIFeedSection>, required: true } },
  emits: ['itemClick', 'itemPlay'],
  setup() { return {} },
})

export const TrendingRail = defineComponent({
  name: 'TrendingRail',
  props: { section: { type: Object as PropType<UIFeedSection>, required: true } },
  emits: ['itemClick', 'itemPlay'],
  setup() {
    function rankNumber(index: number): number { return index + 1 }
    return { rankNumber }
  },
})

export const SimilarToLastWatchedRail = defineComponent({
  name: 'SimilarToLastWatchedRail',
  props: { section: { type: Object as PropType<UIFeedSection>, required: true } },
  emits: ['itemClick', 'itemPlay'],
  setup() { return {} },
})
