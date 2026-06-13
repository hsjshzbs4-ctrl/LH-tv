<!-- P5.2: UpdateProgress.vue — 更新进度条 -->
<template>
  <div class="update-progress">
    <div class="update-progress__bar">
      <div class="update-progress__fill" :style="{ width: percent + '%' }" :class="{ 'update-progress__fill--error': failed }" />
    </div>
    <div class="update-progress__info">
      <span>{{ stageLabel }}</span>
      <span>{{ percent }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  stage?: string
  percent?: number
  failed?: boolean
}>()

const stageLabel = computed(() => {
  const labels: Record<string, string> = { downloading: 'Downloading', validating: 'Validating', backing_up: 'Backing up', installing: 'Installing', migrating: 'Migrating', completed: 'Complete', failed: 'Failed' }
  return labels[props.stage || ''] || props.stage || 'Pending'
})
</script>

<style scoped>
.update-progress { width: 100%; }
.update-progress__bar { height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.update-progress__fill { height: 100%; background: var(--accent, #5c6bc0); transition: width .3s; border-radius: 3px; }
.update-progress__fill--error { background: #f44336; }
.update-progress__info { display: flex; justify-content: space-between; font-size: 12px; color: #777; }
</style>
