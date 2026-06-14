// modules/search-unified/ui/stores/SearchStore.ts — CE8-E
// Pinia store: query, results, suggestions, history, trending, loading, errors.
// Communicates only through SearchIPCClient — never direct facade access.

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchIPCClient } from '../../ipc/client/SearchIPCClient'
import type { UISearchResult, UISearchState, SearchOverlayState, SearchResultFilter, SearchSortOrder } from '../types/search-ui.types'

function mapResult(raw: any): UISearchResult {
  return {
    contentId: raw.contentId,
    title: raw.title,
    originalTitle: raw.originalTitle,
    mediaType: raw.mediaType,
    overview: raw.overview,
    poster: raw.poster,
    year: raw.year,
    score: raw.score,
    genres: raw.genres ?? [],
    sourceCount: raw.sourceCount ?? 1,
    isPlayable: raw.isPlayable ?? false,
    providers: raw.sources?.map((s: any) => s.sourceType) ?? [],
    availability: raw.availability ?? { playable: false, preferredSourceType: null, bestQuality: 0, localAvailable: false },
  }
}

export const useSearchStore = defineStore('unified-search', () => {
  const query = ref('')
  const overlayState = ref<SearchOverlayState>('closed')
  const results = ref<UISearchResult[]>([])
  const suggestions = ref<string[]>([])
  const history = ref<string[]>([])
  const trending = ref<string[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeFilter = ref<SearchResultFilter>('all')
  const sortOrder = ref<SearchSortOrder>('relevance')
  const selectedIndex = ref(-1)

  let client: SearchIPCClient | null = null

  function configure(ipcClient: SearchIPCClient) { client = ipcClient }

  // ─── Search ───

  async function executeSearch(q: string, p = 1) {
    if (!client) return
    query.value = q; page.value = p; loading.value = true; error.value = null
    overlayState.value = 'loading'

    try {
      const resp = await client.search(q, { page: p, pageSize: 20 })
      if ('code' in resp) { error.value = resp.message; overlayState.value = 'error'; return }

      results.value = resp.items.map(mapResult)
      total.value = resp.total
      overlayState.value = resp.total === 0 ? 'empty' : 'results'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Search failed'
      overlayState.value = 'error'
    } finally { loading.value = false }
  }

  // ─── Suggestions ───

  async function fetchSuggestions(q: string) {
    if (!client || q.length < 2) { suggestions.value = []; return }
    try {
      const resp = await client.suggest(q)
      if ('code' in resp) return
      suggestions.value = resp.suggestions
    } catch { /* silent */ }
  }

  // ─── History ───

  async function loadHistory() {
    if (!client) return
    try {
      const resp = await client.getHistory(20)
      if ('code' in resp) return
      history.value = resp.entries.map(e => e.query)
    } catch { /* silent */ }
  }

  function addToHistory(q: string) {
    if (!history.value.includes(q)) {
      history.value = [q, ...history.value].slice(0, 50)
    }
  }

  async function clearHistory() {
    history.value = []
  }

  // ─── Trending ───

  async function loadTrending() {
    if (!client) return
    try {
      const resp = await client.getTrending(20)
      if ('code' in resp) return
      trending.value = resp.entries.map(e => e.query)
    } catch { /* silent */ }
  }

  // ─── Click/Play ───

  function recordClick(contentId: string) {
    client?.recordClick(contentId, query.value, 0)
  }

  function recordPlay(contentId: string, sourceId: string) {
    client?.recordPlay(contentId, sourceId)
  }

  // ─── Navigation ───

  function closeOverlay() { overlayState.value = 'closed'; selectedIndex.value = -1 }
  function openOverlay() { overlayState.value = 'empty' }
  function moveSelection(delta: number) {
    const max = suggestions.value.length + results.value.length - 1
    if (max < 0) { selectedIndex.value = -1; return }
    selectedIndex.value = Math.max(-1, Math.min(max, selectedIndex.value + delta))
  }

  // ─── Filters ───

  const filteredResults = computed(() => {
    let r = results.value
    if (activeFilter.value !== 'all') r = r.filter(i => i.mediaType === activeFilter.value)
    if (sortOrder.value === 'alphabetical') r = [...r].sort((a, b) => a.title.localeCompare(b.title))
    return r
  })

  return {
    query, overlayState, results, suggestions, history, trending,
    total, page, loading, error, activeFilter, sortOrder, selectedIndex,
    filteredResults,
    configure, executeSearch, fetchSuggestions,
    loadHistory, addToHistory, clearHistory,
    loadTrending, recordClick, recordPlay,
    closeOverlay, openOverlay, moveSelection,
  }
})
