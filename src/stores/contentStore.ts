// src/stores/contentStore.ts — PB1.5 Content Layer 状态管理
// 聚合 6 个 content 服务的响应式状态，供 UI 页面使用

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MediaItem, MediaDetail, AggregatedSearchResult } from '@provider-contracts'
import type { FavoriteMedia, WatchHistoryItem } from '@/content'
import type {
  HomeSection,
  ContentCategory,
  SearchFilter,
  DetailResult,
} from '@/content'
import {
  mediaLibraryService,
  searchService,
  categoryService,
  favoriteService,
  historyService,
} from '@/content'

export const useContentStore = defineStore('content', () => {
  // ── 加载状态 ──
  const isLoaded = ref(false)
  const homeLoading = ref(false)
  const searchLoading = ref(false)
  const categoryLoading = ref(false)
  const detailLoading = ref(false)

  // ── 首页 ──
  const homeSections = ref<HomeSection[]>([])

  // ── 搜索 ──
  const searchResults = ref<MediaItem[]>([])
  const searchProviders = ref<string[]>([])
  const lastSearchKeyword = ref('')

  // ── 分类浏览 ──
  const categoryItems = ref<MediaItem[]>([])
  const activeCategory = ref<ContentCategory>('movie')
  const activeSubCategory = ref<string>('cn')

  // ── 详情 ──
  const detailItem = ref<DetailResult | null>(null)

  // ── 收藏 ──
  const favorites = ref<FavoriteMedia[]>([])

  // ── 历史 ──
  const history = ref<WatchHistoryItem[]>([])
  const continueWatching = ref<WatchHistoryItem[]>([])

  // ── 错误 ──
  const error = ref<string | null>(null)

  // ── 计算属性 ──

  /** 是否已收藏 */
  const isFavorited = computed(() => (mediaId: string): boolean => {
    return favorites.value.some(f => f.mediaId === mediaId)
  })

  /** 当前分类的子类 */
  const categorySubs = computed(() => {
    return categoryService.getSubCategories(activeCategory.value)
  })

  /** 是否有搜索结果 */
  const hasSearchResults = computed(() => searchResults.value.length > 0)

  /** 收藏数量 */
  const favoriteCount = computed(() => favorites.value.length)

  // ── Actions ──

  /** 加载首页内容 */
  async function loadHome(): Promise<void> {
    homeLoading.value = true
    error.value = null
    try {
      homeSections.value = await mediaLibraryService.getHome()
    } catch (e) {
      error.value = `首页加载失败: ${(e as Error).message}`
    } finally {
      homeLoading.value = false
    }
  }

  /** 搜索 */
  async function search(keyword: string, filter?: SearchFilter): Promise<void> {
    searchLoading.value = true
    error.value = null
    lastSearchKeyword.value = keyword
    try {
      const result: AggregatedSearchResult = await searchService.search(keyword, filter)
      searchResults.value = result.items
      searchProviders.value = result.providers
    } catch (e) {
      error.value = `搜索失败: ${(e as Error).message}`
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  /** 加载分类内容 */
  async function loadCategory(category: ContentCategory, sub?: string): Promise<void> {
    categoryLoading.value = true
    error.value = null
    activeCategory.value = category
    activeSubCategory.value = sub || categoryService.getSubCategories(category)[0] || 'all'
    try {
      categoryItems.value = await categoryService.getCategory(category, activeSubCategory.value)
    } catch (e) {
      error.value = `分类加载失败: ${(e as Error).message}`
      categoryItems.value = []
    } finally {
      categoryLoading.value = false
    }
  }

  /** 加载媒体详情 */
  async function loadDetail(providerId: string, mediaId: string): Promise<void> {
    detailLoading.value = true
    error.value = null
    try {
      detailItem.value = await mediaLibraryService.getDetail(providerId, mediaId)
    } catch (e) {
      error.value = `详情加载失败: ${(e as Error).message}`
      detailItem.value = null
    } finally {
      detailLoading.value = false
    }
  }

  /** 添加收藏 */
  async function addFavorite(media: MediaItem): Promise<void> {
    try {
      await favoriteService.addFavorite(media)
      syncFavorites()
    } catch (e) {
      error.value = `收藏失败: ${(e as Error).message}`
    }
  }

  /** 移除收藏 */
  async function removeFavorite(mediaId: string): Promise<void> {
    try {
      await favoriteService.removeFavorite(mediaId)
      syncFavorites()
    } catch (e) {
      error.value = `取消收藏失败: ${(e as Error).message}`
    }
  }

  /** 切换收藏 */
  async function toggleFavorite(media: MediaItem): Promise<void> {
    try {
      await favoriteService.toggleFavorite(media)
      syncFavorites()
    } catch (e) {
      error.value = `操作失败: ${(e as Error).message}`
    }
  }

  /** 记录播放历史 */
  async function recordHistory(
    media: MediaItem,
    episode: import('@provider-contracts').MediaEpisode,
    currentTime: number,
    duration: number,
  ): Promise<void> {
    try {
      await historyService.recordHistory(media, episode, currentTime, duration)
      syncHistory()
    } catch (e) {
      error.value = `历史记录失败: ${(e as Error).message}`
    }
  }

  /** 清空历史 */
  async function clearHistory(): Promise<void> {
    try {
      await historyService.clearHistory()
      syncHistory()
    } catch (e) {
      error.value = `清空历史失败: ${(e as Error).message}`
    }
  }

  /** 移除单条历史 */
  async function removeHistoryItem(episodeId: string): Promise<void> {
    try {
      await historyService.removeHistory(episodeId)
      syncHistory()
    } catch (e) {
      error.value = `移除失败: ${(e as Error).message}`
    }
  }

  /** 同步收藏列表 */
  function syncFavorites(): void {
    favorites.value = favoriteService.getFavorites()
  }

  /** 同步历史列表 */
  function syncHistory(): void {
    history.value = historyService.getHistory()
    continueWatching.value = historyService.getContinueWatching()
  }

  /** 清除错误 */
  function clearError(): void {
    error.value = null
  }

  /** 初始化 */
  async function initialize(): Promise<void> {
    if (isLoaded.value) return
    syncFavorites()
    syncHistory()

    // 订阅底层变更
    favoriteService.subscribe(syncFavorites)
    historyService.subscribe(syncHistory)

    isLoaded.value = true
  }

  return {
    // state
    isLoaded,
    homeLoading,
    searchLoading,
    categoryLoading,
    detailLoading,
    homeSections,
    searchResults,
    searchProviders,
    lastSearchKeyword,
    categoryItems,
    activeCategory,
    activeSubCategory,
    detailItem,
    favorites,
    history,
    continueWatching,
    error,
    // computed
    isFavorited,
    categorySubs,
    hasSearchResults,
    favoriteCount,
    // actions
    loadHome,
    search,
    loadCategory,
    loadDetail,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    recordHistory,
    clearHistory,
    removeHistoryItem,
    clearError,
    initialize,
    syncFavorites,
    syncHistory,
  }
})
