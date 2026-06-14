// modules/recommendation/ui/cards/RecommendationCard.ts — CE9-F
// Recommendation card component logic.

import { defineComponent, computed, type PropType } from 'vue'
import type { UIRecommendationItem } from '../types/recommendation-ui.types'

export const RecommendationCard = defineComponent({
  name: 'RecommendationCard',
  props: {
    item: { type: Object as PropType<UIRecommendationItem>, required: true },
    index: { type: Number, default: 0 },
  },
  emits: ['click', 'hover', 'play'],
  setup(props, { emit }) {
    const reason = computed(() => props.item.reason)
    const progressPercent = computed(() => props.item.progress ? Math.round(props.item.progress * 100) : null)
    const yearDisplay = computed(() => props.item.year ? String(props.item.year) : '')

    function onClick() { emit('click', props.item) }
    function onPlay() { emit('play', props.item) }

    return { reason, progressPercent, yearDisplay, onClick, onPlay }
  },
})

export const RecommendationReasonBadge = defineComponent({
  name: 'RecommendationReasonBadge',
  props: { reason: { type: String, required: true } },
  setup(props) {
    const icon = computed(() => {
      if (props.reason.includes('watched')) return '▶'
      if (props.reason.includes('Trending')) return '🔥'
      if (props.reason.includes('Popular')) return '⭐'
      if (props.reason.includes('Similar')) return '🔗'
      return '💡'
    })
    return { icon }
  },
})

export const RecommendationCardPreview = defineComponent({
  name: 'RecommendationCardPreview',
  props: { item: { type: Object as PropType<UIRecommendationItem>, required: true } },
  emits: ['play', 'details'],
  setup(props, { emit }) {
    const genres = computed(() => props.item.genres?.slice(0, 3).join(' · ') ?? '')
    return { genres }
  },
})
