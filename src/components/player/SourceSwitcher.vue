<!-- src/components/player/SourceSwitcher.vue - 播放源切换 -->
<template>
  <div class="source-bar" v-if="sources.length > 1">
    <span class="source-label">播放源：</span>
    <button
      v-for="(source, i) in sources"
      :key="i"
      class="source-btn"
      :class="{ active: modelValue === i }"
      @click="$emit('update:modelValue', i)"
    >
      {{ source.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PlaySource } from '@/types'

defineProps<{
  sources: PlaySource[]
  modelValue: number
}>()

defineEmits<{
  'update:modelValue': [index: number]
}>()
</script>

<style scoped>
.source-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-border);
}

.source-label {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.source-btn {
  padding: 4px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.source-btn:hover {
  border-color: var(--color-accent-blue);
  color: var(--color-accent-blue);
}

.source-btn.active {
  background: var(--color-accent-blue);
  color: #fff;
  border-color: var(--color-accent-blue);
}
</style>
