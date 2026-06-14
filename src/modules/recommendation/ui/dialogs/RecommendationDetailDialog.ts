// modules/recommendation/ui/dialogs/RecommendationDetailDialog.ts — CE9-F

import { defineComponent, computed, type PropType } from 'vue'
import type { UIRecommendationItem } from '../types/recommendation-ui.types'

export const RecommendationDetailDialog = defineComponent({
  name: 'RecommendationDetailDialog',
  props: {
    item: { type: Object as PropType<UIRecommendationItem | null>, default: null },
    open: { type: Boolean, default: false },
  },
  emits: ['close', 'play'],
  setup(props, { emit }) {
    const isOpen = computed(() => props.open && props.item !== null)
    function onClose() { emit('close') }
    function onPlay() { if (props.item) emit('play', props.item) }
    return { isOpen, onClose, onPlay }
  },
})
