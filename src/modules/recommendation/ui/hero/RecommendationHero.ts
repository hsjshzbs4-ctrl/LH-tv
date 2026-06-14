// modules/recommendation/ui/hero/RecommendationHero.ts — CE9-F
// Netflix-style hero banner.

import { defineComponent, computed, type PropType } from 'vue'
import type { UIRecommendationItem } from '../types/recommendation-ui.types'

export const RecommendationHero = defineComponent({
  name: 'RecommendationHero',
  props: {
    item: { type: Object as PropType<UIRecommendationItem | null>, default: null },
  },
  emits: ['play', 'details'],
  setup(props, { emit }) {
    const hasContent = computed(() => props.item !== null)
    const title = computed(() => props.item?.title ?? '')
    const backdrop = computed(() => props.item?.backdrop ?? props.item?.cover ?? '')
    const overview = computed(() => props.item?.title ?? '')
    const genres = computed(() => props.item?.genres?.slice(0, 3).join(' · ') ?? '')

    function onPlay() { if (props.item) emit('play', props.item) }
    function onDetails() { if (props.item) emit('details', props.item) }

    return { hasContent, title, backdrop, overview, genres, onPlay, onDetails }
  },
})
