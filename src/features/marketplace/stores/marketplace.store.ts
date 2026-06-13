// src/features/marketplace/stores/marketplace.store.ts — P5.2 Marketplace Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { marketplaceService } from '../services/MarketplaceService'
import type { MarketplacePlugin } from '@/plugin-marketplace'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const featured = ref<MarketplacePlugin[]>([])
  const popular = ref<MarketplacePlugin[]>([])
  const searchResults = ref<MarketplacePlugin[]>([])
  const searchQuery = ref('')
  const selectedCategory = ref<string>('all')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const plugins = computed(() => searchQuery.value ? searchResults.value : popular.value)

  async function loadFeatured() {
    try {
      featured.value = await marketplaceService.getFeatured()
    } catch (e) { error.value = (e as Error).message }
  }

  async function loadPopular() {
    try {
      loading.value = true
      popular.value = await marketplaceService.getPopular()
    } catch (e) { error.value = (e as Error).message }
    finally { loading.value = false }
  }

  async function search(keyword: string) {
    try {
      searchQuery.value = keyword
      loading.value = true
      const result = await marketplaceService.search(keyword)
      searchResults.value = result.plugins
    } catch (e) { error.value = (e as Error).message }
    finally { loading.value = false }
  }

  async function filterByCategory(category: string) {
    try {
      selectedCategory.value = category
      if (category === 'all') {
        await loadPopular()
      } else {
        searchResults.value = await marketplaceService.getByCategory(category as any)
      }
    } catch (e) { error.value = (e as Error).message }
  }

  function clearSearch() {
    searchQuery.value = ''
    searchResults.value = []
  }

  return { featured, popular, searchResults, searchQuery, selectedCategory, loading, error, plugins, loadFeatured, loadPopular, search, filterByCategory, clearSearch }
})
