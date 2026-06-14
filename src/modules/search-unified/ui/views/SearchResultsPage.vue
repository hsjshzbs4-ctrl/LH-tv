<!-- modules/search-unified/ui/views/SearchResultsPage.vue — CE8-E -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSearchStore } from '../stores/SearchStore'
import SearchResultCard from '../components/SearchResultCard.vue'
import SearchEmptyState from '../components/SearchEmptyState.vue'
import SearchSkeleton from '../components/SearchSkeleton.vue'
import ProviderBadge from '../components/ProviderBadge.vue'

const route = useRoute()
const store = useSearchStore()

onMounted(() => {
  const q = (route.query.q as string) ?? ''
  if (q) store.executeSearch(q)
})
</script>

<template>
  <div class="search-page">
    <div class="page-header">
      <h2>Results for "{{ store.query }}"</h2>
      <span class="total">{{ store.total }} results</span>
    </div>

    <!-- Filters -->
    <div class="filters">
      <button v-for="f in (['all','movie','tv','anime'] as const)" :key="f"
        :class="['filter-btn', { active: store.activeFilter === f }]"
        @click="store.activeFilter = f">{{ f === 'all' ? 'All' : f }}</button>
    </div>

    <!-- Loading -->
    <SearchSkeleton v-if="store.loading" variant="results" />

    <!-- Error -->
    <SearchEmptyState v-else-if="store.error" variant="error" />

    <!-- Empty -->
    <SearchEmptyState v-else-if="!store.filteredResults.length" variant="no-results" />

    <!-- Results Grid -->
    <div v-else class="results-grid">
      <SearchResultCard
        v-for="result in store.filteredResults"
        :key="result.contentId"
        :result="result"
        @click="store.recordClick(result.contentId)"
      />
    </div>

    <!-- Pagination -->
    <div v-if="store.total > 20" class="pagination">
      <button :disabled="store.page <= 1" @click="store.executeSearch(store.query, store.page - 1)">Prev</button>
      <span>Page {{ store.page }}</span>
      <button :disabled="store.page * 20 >= store.total" @click="store.executeSearch(store.query, store.page + 1)">Next</button>
    </div>
  </div>
</template>

<style scoped>
.search-page { max-width: 960px; margin: 0 auto; padding: 24px; }
.page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.page-header h2 { margin: 0; }
.total { color: var(--color-text-muted); font-size: 14px; }
.filters { display: flex; gap: 8px; margin-bottom: 16px; }
.filter-btn { padding: 6px 14px; border: 1px solid var(--color-border); border-radius: 20px; background: none; color: var(--color-text); cursor: pointer; font-size: 13px; text-transform: capitalize; }
.filter-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.results-grid { display: flex; flex-direction: column; gap: 4px; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; }
.pagination button { padding: 8px 16px; border: 1px solid var(--color-border); border-radius: 8px; background: none; cursor: pointer; }
.pagination button:disabled { opacity: 0.4; cursor: default; }
</style>
