// tests/unit/search-unified/search-store.spec.ts — CE8-E Store tests

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '@/modules/search-unified/ui/stores/SearchStore'

function mockClient() {
  return {
    search: vi.fn().mockResolvedValue({ version: 1, items: [], page: 1, pageSize: 20, total: 0, totalPages: 1, hasNextPage: false, searchTimeMs: 0 }),
    suggest: vi.fn().mockResolvedValue({ version: 1, suggestions: [] }),
    getHistory: vi.fn().mockResolvedValue({ version: 1, entries: [] }),
    getTrending: vi.fn().mockResolvedValue({ version: 1, entries: [] }),
    getProfile: vi.fn().mockResolvedValue({ version: 1, profile: { generatedAt: 0, favoriteProviders: [], frequentQueries: [], recentInteractions: [] } }),
    getHealth: vi.fn().mockResolvedValue({ version: 1, state: 'ready', providers: [], analytics: { bufferSize: 0, totalCalls: 0 } }),
    recordClick: vi.fn(),
    recordPlay: vi.fn(),
  } as any
}

describe('SearchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default state', () => {
    const store = useSearchStore()
    expect(store.query).toBe('')
    expect(store.overlayState).toBe('closed')
    expect(store.results).toHaveLength(0)
    expect(store.loading).toBe(false)
  })

  it('should configure IPC client', () => {
    const store = useSearchStore()
    store.configure(mockClient())
    // Should not throw
  })

  it('should execute search and update state', async () => {
    const store = useSearchStore()
    const client = mockClient()
    client.search.mockResolvedValue({
      version: 1,
      items: [{ contentId: 'tmdb:1', title: 'Test', mediaType: 'movie', score: 80, genres: [], sourceCount: 1, isPlayable: false, availability: { playable: false, preferredSourceType: null, bestQuality: 0, localAvailable: false } }],
      page: 1, pageSize: 20, total: 1, totalPages: 1, hasNextPage: false, searchTimeMs: 10,
    })
    store.configure(client)

    await store.executeSearch('test')
    expect(store.results).toHaveLength(1)
    expect(store.overlayState).toBe('results')
    expect(store.total).toBe(1)
  })

  it('should handle search error', async () => {
    const store = useSearchStore()
    const client = mockClient()
    client.search.mockResolvedValue({ code: 'ERR', message: 'Failed', recoverable: true })
    store.configure(client)

    await store.executeSearch('test')
    expect(store.overlayState).toBe('error')
    expect(store.error).toBe('Failed')
  })

  it('should fetch suggestions', async () => {
    const store = useSearchStore()
    const client = mockClient()
    client.suggest.mockResolvedValue({ version: 1, suggestions: ['A', 'B'] })
    store.configure(client)

    await store.fetchSuggestions('ab')
    expect(store.suggestions).toEqual(['A', 'B'])
  })

  it('should not fetch suggestions for short query', async () => {
    const store = useSearchStore()
    const client = mockClient()
    store.configure(client)

    await store.fetchSuggestions('a')
    expect(store.suggestions).toHaveLength(0)
  })

  it('should manage history', async () => {
    const store = useSearchStore()
    const client = mockClient()
    client.getHistory.mockResolvedValue({ version: 1, entries: [{ id: '1', query: 'past', frequency: 1, lastSearchedAt: 1 }] })
    store.configure(client)

    await store.loadHistory()
    expect(store.history).toEqual(['past'])

    store.addToHistory('new')
    expect(store.history).toContain('new')
  })

  it('should load trending', async () => {
    const store = useSearchStore()
    const client = mockClient()
    client.getTrending.mockResolvedValue({ version: 1, entries: [{ query: 'hot', count: 10, rollingScore: 95 }] })
    store.configure(client)

    await store.loadTrending()
    expect(store.trending).toEqual(['hot'])
  })

  it('should filter results by type', () => {
    const store = useSearchStore()
    store.results = [
      { contentId: '1', title: 'M', mediaType: 'movie', score: 80, genres: [], sourceCount: 1, isPlayable: false, providers: [], availability: { playable: false, preferredSourceType: null, bestQuality: 0, localAvailable: false } },
      { contentId: '2', title: 'T', mediaType: 'tv', score: 80, genres: [], sourceCount: 1, isPlayable: false, providers: [], availability: { playable: false, preferredSourceType: null, bestQuality: 0, localAvailable: false } },
    ]
    store.activeFilter = 'movie'
    expect(store.filteredResults).toHaveLength(1)
    expect(store.filteredResults[0].title).toBe('M')
  })

  it('should handle keyboard navigation', () => {
    const store = useSearchStore()
    store.suggestions = ['A', 'B']
    store.results = [{ contentId: '1', title: 'R', mediaType: 'movie', score: 80, genres: [], sourceCount: 1, isPlayable: false, providers: [], availability: { playable: false, preferredSourceType: null, bestQuality: 0, localAvailable: false } }]

    store.moveSelection(1)
    expect(store.selectedIndex).toBe(0)

    store.moveSelection(1)
    expect(store.selectedIndex).toBe(1)

    store.moveSelection(1)
    expect(store.selectedIndex).toBe(2) // max = 2

    store.moveSelection(-1)
    expect(store.selectedIndex).toBe(1)
  })

  it('should close overlay', () => {
    const store = useSearchStore()
    store.overlayState = 'results'
    store.closeOverlay()
    expect(store.overlayState).toBe('closed')
    expect(store.selectedIndex).toBe(-1)
  })
})
