<!-- modules/search-unified/ui/components/TrendingPanel.vue — CE8-E -->
<script setup lang="ts">
import { useTrending } from '../composables/useSearch'
defineEmits(['select'])
const { trending, loadTrending } = useTrending()
loadTrending()
</script>
<template>
  <div v-if="trending.length" class="trending-panel">
    <div class="section-label">Trending</div>
    <div v-for="q in trending" :key="q" class="trend-item" @click="$emit('select', q)">
      📈 {{ q }}
    </div>
  </div>
</template>
<style scoped>
.trending-panel { padding: 4px 0; }
.section-label { font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); padding: 4px 8px; }
.trend-item { padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.trend-item:hover { background: var(--color-surface-hover); }
</style>
