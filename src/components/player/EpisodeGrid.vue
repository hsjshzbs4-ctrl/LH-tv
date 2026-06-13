<!-- src/components/player/EpisodeGrid.vue - 选集网格 -->
<template>
  <div class="episode-section">
    <template v-for="(source, sIdx) in sources" :key="sIdx">
      <h3 class="season-title">
        {{ source.name }}
        <span class="count">共 {{ source.episodes?.length || 0 }} 集</span>
      </h3>
      <div class="episode-grid">
        <button
          v-for="ep in source.episodes"
          :key="ep.number"
          class="episode-btn"
          :class="{ active: isActive(ep.number, sIdx) }"
          @click="$emit('select', ep, sIdx)"
        >
          {{ formatLabel(ep.label) }}
        </button>
      </div>
    </template>
    <div v-if="sources.length === 0" class="empty-episodes">
      暂无可选集数
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlaySource, Episode } from '@/types'

defineProps<{
  sources: PlaySource[]
  currentEpisodeNumber?: number
  currentSourceIdx?: number
}>()

defineEmits<{
  select: [episode: Episode, sourceIdx: number]
}>()

function isActive(epNum: number, sIdx: number): boolean {
  // 简化判断：当前播放集数和源
  return false // 由父组件通过 class 控制更灵活
}

function formatLabel(label: string): string {
  return label.replace('第', '').replace('集', '')
}
</script>

<style scoped>
.episode-section {
  padding: 0 0 40px;
}

.season-title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  margin: 20px 0 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.count {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--weight-normal);
}

.episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.episode-btn {
  padding: 10px 6px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.episode-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent-blue);
  transform: translateY(-1px);
}

.episode-btn.active {
  background: rgba(91, 156, 245, 0.15);
  border-color: var(--color-accent-blue);
  color: var(--color-accent-blue);
  box-shadow: 0 0 8px rgba(91, 156, 245, 0.2);
}

.empty-episodes {
  text-align: center;
  padding: 40px;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
</style>
