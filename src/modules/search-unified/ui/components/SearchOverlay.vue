<!-- modules/search-unified/ui/components/SearchOverlay.vue — CE8-E -->
<script setup lang="ts">
import { useSearchStore } from '../stores/SearchStore'
import SearchResultCard from './SearchResultCard.vue'
import SuggestionPanel from './SuggestionPanel.vue'
import SearchSkeleton from './SearchSkeleton.vue'
import SearchEmptyState from './SearchEmptyState.vue'

const store = useSearchStore()
</script>

<template>
  <Teleport to="body">
    <div v-if="store.overlayState !== 'closed'" class="search-overlay-backdrop" @click="store.closeOverlay()">
      <div class="search-overlay" @click.stop role="dialog" aria-label="Search results">
        <!-- Loading -->
        <SearchSkeleton v-if="store.overlayState === 'loading'" variant="overlay" />

        <!-- Error -->
        <div v-else-if="store.overlayState === 'error'" class="search-error">
          <SearchEmptyState variant="error" />
          <p>{{ store.error }}</p>
        </div>

        <!-- Empty -->
        <SearchEmptyState v-else-if="store.overlayState === 'empty'" variant="no-results" />

        <!-- Results -->
        <div v-else class="search-results-container">
          <SuggestionPanel v-if="store.suggestions.length > 0" />
          <div class="results-list">
            <SearchResultCard
              v-for="(result, idx) in store.filteredResults.slice(0, 8)"
              :key="result.contentId"
              :result="result"
              :selected="idx === store.selectedIndex"
              @click="store.recordClick(result.contentId)"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.search-overlay-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; padding-top: 80px;
}
.search-overlay {
  width: 640px; max-height: 70vh; overflow-y: auto;
  background: var(--color-surface); border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); padding: 16px;
}
.search-error { text-align: center; padding: 24px; color: var(--color-error); }
</style>
