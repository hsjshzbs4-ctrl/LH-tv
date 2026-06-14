<!-- modules/search-unified/ui/components/SuggestionPanel.vue — CE8-E -->
<script setup lang="ts">
import { useSearchStore } from '../stores/SearchStore'
const store = useSearchStore()
</script>
<template>
  <div v-if="store.suggestions.length" class="suggestions-panel" role="listbox" aria-label="Search suggestions">
    <div class="section-label">Suggestions</div>
    <div
      v-for="(s, idx) in store.suggestions"
      :key="s"
      class="suggestion-item"
      :class="{ selected: idx === store.selectedIndex }"
      role="option"
      :aria-selected="idx === store.selectedIndex"
      @click="store.executeSearch(s)"
    >
      <span class="suggest-icon">🔍</span>
      {{ s }}
    </div>
  </div>
</template>
<style scoped>
.suggestions-panel { padding: 4px 0; border-bottom: 1px solid var(--color-border); margin-bottom: 8px; }
.section-label { font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); padding: 4px 8px; }
.suggestion-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.suggestion-item:hover, .suggestion-item.selected { background: var(--color-surface-hover); }
.suggest-icon { font-size: 12px; opacity: 0.5; }
</style>
