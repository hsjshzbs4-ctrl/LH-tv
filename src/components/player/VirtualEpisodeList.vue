<!-- src/components/player/VirtualEpisodeList.vue — PB3-S2-1 -->
<template>
  <div
    ref="containerRef"
    class="virtual-episode-list"
    @scroll="onScroll"
  >
    <div class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }">
      <div
        class="virtual-visible-window"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <button
          v-for="ep in visibleItems"
          :key="ep.id"
          class="virtual-ep-btn"
          :class="{ current: ep.id === currentEpisodeId }"
          :style="{ height: config.itemHeight + 'px' }"
          @click="$emit('select', ep)"
        >
          {{ ep.title || '第' + ep.episodeNumber + '集' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string; title?: string; episodeNumber?: number }">
import type { VirtualListConfig } from '@/composables/useVirtualList'
import { useVirtualList } from '@/composables/useVirtualList'

const props = withDefaults(defineProps<{
  items: T[]
  currentEpisodeId?: string
  itemHeight?: number
  overscan?: number
}>(), {
  itemHeight: 48,
  overscan: 5,
})

defineEmits<{ select: [ep: T] }>()

const config: VirtualListConfig = { itemHeight: props.itemHeight, overscan: props.overscan }
const { containerRef, totalHeight, visibleItems, offsetY, onScroll } = useVirtualList(
  () => props.items,
  config,
)
</script>

<style scoped>
.virtual-episode-list {
  overflow-y: auto;
  height: 100%;
  position: relative;
}
.virtual-scroll-spacer { position: relative; width: 100%; }
.virtual-visible-window { position: absolute; top: 0; left: 0; right: 0; }
.virtual-ep-btn {
  display: block;
  width: 100%;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0;
  background: transparent;
  color: rgba(255,255,255,0.7);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.virtual-ep-btn:hover { background: rgba(255,255,255,0.08); }
.virtual-ep-btn.current { background: rgba(232,168,80,0.2); color: #e8a850; border-color: rgba(232,168,80,0.3); }
</style>
