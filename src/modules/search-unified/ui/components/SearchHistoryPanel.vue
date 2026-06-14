<!-- modules/search-unified/ui/components/SearchHistoryPanel.vue — CE8-E -->
<script setup lang="ts">
import { useSearchHistory } from '../composables/useSearch'
const { history, loadHistory, clearHistory } = useSearchHistory()
loadHistory()
</script>
<template>
  <div v-if="history.length" class="history-panel">
    <div class="panel-header"><span>Recent Searches</span><button @click="clearHistory()" class="clear-btn">Clear</button></div>
    <div v-for="q in history" :key="q" class="history-item" @click="$emit('select', q)">
      🕐 {{ q }}
    </div>
  </div>
</template>
<style scoped>
.history-panel { padding: 8px 0; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; }
.panel-header span { font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); }
.clear-btn { font-size: 11px; background: none; border: none; color: var(--color-primary); cursor: pointer; }
.history-item { padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.history-item:hover { background: var(--color-surface-hover); }
</style>
