// modules/search-unified/ui/composables/useSearch.ts — CE8-E
import { useSearchStore } from '../stores/SearchStore'
import { useDebounce } from './useDebounce'
import { watch } from 'vue'

export function useSearch() {
  const store = useSearchStore()
  const debouncedQuery = useDebounce(() => store.query, 150)

  // Trigger search on debounced query change
  watch(debouncedQuery, (q) => {
    if (q.length >= 2) {
      store.executeSearch(q)
      store.fetchSuggestions(q)
    }
  })

  return {
    query: store.query,
    results: store.filteredResults,
    total: store.total,
    loading: store.loading,
    error: store.error,
    overlayState: store.overlayState,
    activeFilter: store.activeFilter,
    sortOrder: store.sortOrder,
    executeSearch: store.executeSearch,
    closeOverlay: store.closeOverlay,
    recordClick: store.recordClick,
    recordPlay: store.recordPlay,
  }
}

export function useSuggestions() {
  const store = useSearchStore()
  return {
    suggestions: store.suggestions,
    fetchSuggestions: store.fetchSuggestions,
  }
}

export function useSearchHistory() {
  const store = useSearchStore()
  return {
    history: store.history,
    loadHistory: store.loadHistory,
    addToHistory: store.addToHistory,
    clearHistory: store.clearHistory,
  }
}

export function useTrending() {
  const store = useSearchStore()
  return {
    trending: store.trending,
    loadTrending: store.loadTrending,
  }
}

export function useSearchProfile() {
  const store = useSearchStore()
  return {
    query: store.query,
    history: store.history,
    trending: store.trending,
  }
}
