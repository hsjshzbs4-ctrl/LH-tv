// src/composables/useVirtualList.ts — PB3-S2-1 Virtual Scrolling Composable
// 只渲染可见区域 + overscan。不修改 EpisodeManager (FROZEN)

import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface VirtualListConfig {
  /** 每项高度 (px) */
  itemHeight: number
  /** 预渲染超出可视区的行数 */
  overscan: number
}

export function useVirtualList<T>(
  items: () => T[],
  config: VirtualListConfig = { itemHeight: 48, overscan: 5 },
) {
  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  const totalHeight = computed(() => items().length * config.itemHeight)
  const startIndex = computed(() =>
    Math.max(0, Math.floor(scrollTop.value / config.itemHeight) - config.overscan),
  )
  const endIndex = computed(() =>
    Math.min(
      items().length,
      Math.ceil((scrollTop.value + containerHeight.value) / config.itemHeight) + config.overscan,
    ),
  )
  const visibleItems = computed(() =>
    items().slice(startIndex.value, endIndex.value),
  )
  const offsetY = computed(() => startIndex.value * config.itemHeight)

  function onScroll(e: Event): void {
    scrollTop.value = (e.target as HTMLElement).scrollTop
  }

  function scrollToIndex(index: number): void {
    if (!containerRef.value) return
    containerRef.value.scrollTop = index * config.itemHeight
    scrollTop.value = containerRef.value.scrollTop
  }

  let resizeObserver: ResizeObserver | null = null
  onMounted(() => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight
      resizeObserver = new ResizeObserver(([entry]) => {
        containerHeight.value = entry.contentRect.height
      })
      resizeObserver.observe(containerRef.value)
    }
  })
  onUnmounted(() => {
    resizeObserver?.disconnect()
  })

  return {
    containerRef,
    totalHeight,
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    onScroll,
    scrollToIndex,
    config,
  }
}
