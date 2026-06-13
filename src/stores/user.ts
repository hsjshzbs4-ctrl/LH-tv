// src/stores/user.ts - 用户数据（收藏/历史/播放进度）
// v5: 收藏→FavoritesFacade，历史→HistoryFacade
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FavoriteItem, HistoryItem, PlaybackPosition } from '@/types'
import { storageService } from '@/shared/storage/storage.service'
import { favoritesFacade } from '@/core/favorites'
import { historyFacade } from '@/core/history'

const MAX_HISTORY = 200

/** FavoriteItem ↔ FavoriteMedia 桥接 */
function itemToMedia(item: Omit<FavoriteItem, 'addedAt'>) {
  return {
    id: `fav_${item.id}`,
    mediaId: String(item.id),
    providerId: '',
    title: item.name,
    cover: item.image || '',
    description: item.rating != null ? String(item.rating) : '',
    category: '',
  }
}

function mediaToItem(m: {
  id: string; mediaId: string; title: string; cover: string
  description?: string; favoritedAt: number
}): FavoriteItem {
  return {
    id: m.mediaId,
    name: m.title,
    image: m.cover,
    genres: [],
    rating: Number(m.description) || undefined,
    addedAt: m.favoritedAt,
  }
}

export const useUserStore = defineStore('user', () => {
  // ======== 加载状态 ========
  const isLoaded = ref(false)

  // ======== 收藏（通过 FavoritesFacade）========
  const favorites = ref<FavoriteItem[]>([])

  function syncFavorites() {
    favorites.value = favoritesFacade.getFavorites().map(mediaToItem)
  }

  const isFavorited = computed(() => (id: string | number) => {
    return favorites.value.some(f => String(f.id) === String(id))
  })

  async function addFavorite(item: Omit<FavoriteItem, 'addedAt'>) {
    await favoritesFacade.addFavorite(itemToMedia(item))
    syncFavorites()
  }

  async function removeFavorite(id: string | number) {
    await favoritesFacade.removeFavorite(String(id))
    syncFavorites()
  }

  async function toggleFavorite(item: Omit<FavoriteItem, 'addedAt'>) {
    if (isFavorited.value(item.id)) {
      await removeFavorite(item.id)
    } else {
      await addFavorite(item)
    }
  }

  // ======== 观看历史（通过 HistoryFacade）========
  const history = ref<HistoryItem[]>([])

  function syncHistory() {
    history.value = historyFacade.getHistory().map(h => ({
      showId: h.mediaId,
      showName: h.title,
      showImage: h.cover,
      episodeId: h.episodeId,
      episodeName: h.episodeLabel,
      episodeNumber: 0,
      season: 1,
      watchedAt: h.lastWatchedAt,
    }))
  }

  function addHistory(show: { id: string | number; name: string; image: string }, episode: {
    id: string | number
    season: number
    number: number
    name: string
  }) {
    historyFacade.recordHistory({
      id: `hist_${episode.id}`,
      mediaId: String(show.id),
      episodeId: String(episode.id),
      providerId: '',
      title: show.name,
      cover: show.image || '',
      episodeLabel: episode.name || `第${episode.number}集`,
      duration: 0,
      currentTime: 0,
      progress: 0,
      lastWatchedAt: Date.now(),
    }).then(() => syncHistory())
  }

  function clearHistory() {
    historyFacade.clearHistory().then(() => syncHistory())
  }

  // ======== 播放进度 ========
  const playbackPositions = ref<Record<string, PlaybackPosition>>({})

  function savePosition(showName: string, episodeNumber: number, position: number) {
    if (position <= 0) return
    const key = `${showName}_${episodeNumber}`
    playbackPositions.value[key] = {
      showName,
      episodeNumber,
      position,
      updatedAt: Date.now()
    }
    storageService.setPlaybackPositions(playbackPositions.value)
  }

  function getPosition(showName: string, episodeNumber: number): number {
    const key = `${showName}_${episodeNumber}`
    const pos = playbackPositions.value[key]
    if (pos && pos.position > 5) {
      return pos.position
    }
    return 0
  }

  // ======== 从 StorageService + FavoritesFacade 初始化 ========
  async function loadFromStorage() {
    if (isLoaded.value) return
    try {
      await favoritesFacade.initialize()
      await historyFacade.initialize()
      const schema = await storageService.load()
      favorites.value = favoritesFacade.getFavorites().map(mediaToItem)
      history.value = historyFacade.getHistory().map(h => ({
        showId: h.mediaId, showName: h.title, showImage: h.cover,
        episodeId: h.episodeId, episodeName: h.episodeLabel,
        episodeNumber: 0, season: 1, watchedAt: h.lastWatchedAt,
      }))
      playbackPositions.value = schema.playbackPositions || {}
      isLoaded.value = true
    } catch {
      isLoaded.value = true
    }
  }

  // ======== 导出/导入 ========
  async function exportData(): Promise<string | null> {
    return storageService.export()
  }

  async function importData(json: string): Promise<{ success: boolean; message: string }> {
    const result = await storageService.import(json)
    if (result.success) {
      await loadFromStorage()
    }
    return result
  }

  async function getStorageStats() {
    return storageService.getStats()
  }

  // ======== 继续观看列表 ========
  const continueWatching = computed(() => {
    return history.value
      .filter((h, i, arr) => {
        return arr.findIndex(x => String(x.showId) === String(h.showId)) === i
      })
      .slice(0, 10)
  })

  return {
    isLoaded,
    favorites,
    isFavorited,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    history,
    addHistory,
    clearHistory,
    playbackPositions,
    savePosition,
    getPosition,
    continueWatching,
    loadFromStorage,
    exportData,
    importData,
    getStorageStats,
  }
})
