// modules/search-unified/ui/index.ts — CE8-E UI barrel export

// Components
export { default as GlobalSearchBar } from './components/GlobalSearchBar.vue'
export { default as SearchOverlay } from './components/SearchOverlay.vue'
export { default as SearchResultCard } from './components/SearchResultCard.vue'
export { default as ProviderBadge } from './components/ProviderBadge.vue'
export { default as SearchSkeleton } from './components/SearchSkeleton.vue'
export { default as SearchEmptyState } from './components/SearchEmptyState.vue'
export { default as SuggestionPanel } from './components/SuggestionPanel.vue'
export { default as SearchHistoryPanel } from './components/SearchHistoryPanel.vue'
export { default as TrendingPanel } from './components/TrendingPanel.vue'
export { default as SearchHealthDashboard } from './components/SearchHealthDashboard.vue'

// Views
export { default as SearchResultsPage } from './views/SearchResultsPage.vue'
export { default as SearchProfileView } from './views/SearchProfileView.vue'

// Store
export { useSearchStore } from './stores/SearchStore'

// Composables
export {
  useSearch,
  useSuggestions,
  useSearchHistory,
  useTrending,
  useSearchProfile,
} from './composables/useSearch'
export { useKeyboardNavigation } from './composables/useKeyboardNavigation'
export type { KeyboardActions } from './composables/useKeyboardNavigation'
export { useDebounce } from './composables/useDebounce'

// Types
export type {
  UISearchResult,
  UISearchState,
  SearchOverlayState,
  SearchResultFilter,
  SearchSortOrder,
  SearchTrendPeriod,
} from './types/search-ui.types'
