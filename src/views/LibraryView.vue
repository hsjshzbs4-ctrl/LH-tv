<!-- src/views/LibraryView.vue - 本地库（v3: +收藏 Tab） -->
<template>
  <div class="library-page">
    <div class="library-header">
      <h1 class="page-title">📥 本地库</h1>
      <div class="search-box" v-if="allMedia.length > 0 || allFavorites.length > 0">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索标题..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button
        v-for="tab in tabsWithCount"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <LoadingSpinner v-if="loading" message="加载中..." />

    <!-- 收藏 Tab -->
    <template v-else-if="activeTab === 'favorites' && filteredFavorites.length > 0">
      <div class="media-list">
        <div v-for="fav in filteredFavorites" :key="fav.id" class="media-card">
          <div class="media-cover" @click="goToPlay(fav.title)">
            <img v-if="fav.cover" :src="fav.cover" :alt="fav.title" class="cover-img"
              @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
            <span class="cover-fallback" v-if="!fav.cover">🎬</span>
            <div class="play-overlay">▶</div>
          </div>
          <div class="media-info">
            <div class="media-title">{{ fav.title }}</div>
            <div class="media-meta">
              <span v-if="fav.providerId" class="media-provider">{{ fav.providerId }}</span>
              <span class="media-time">{{ formatTime(fav.favoritedAt) }}</span>
            </div>
          </div>
          <div class="media-actions">
            <button class="media-btn play-btn" @click="goToPlay(fav.title)">▶ 播放</button>
          </div>
        </div>
      </div>
    </template>

    <!-- 全部 / 离线 -->
    <template v-else-if="activeTab !== 'favorites' && activeTab !== 'history' && filteredMedia.length > 0">
      <div class="media-list">
        <div v-for="media in filteredMedia" :key="media.id" class="media-card">
          <div class="media-cover" @click="playOffline(media)">
            <img v-if="media.cover" :src="media.cover" :alt="media.title" class="cover-img"
              @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
            <span class="cover-fallback" v-if="!media.cover">🎬</span>
            <div class="play-overlay">▶</div>
          </div>
          <div class="media-info">
            <div class="media-title">{{ media.title }}</div>
            <div class="media-meta">
              <span class="media-episode">{{ media.episodeLabel }}</span>
              <span v-if="media.fileSize" class="media-size">{{ formatSize(media.fileSize) }}</span>
            </div>
            <div class="media-time">{{ formatTime(media.downloadedAt) }}</div>
            <div class="media-status" v-if="!media.exists" style="color: var(--color-danger)">⚠ 文件已丢失</div>
          </div>
          <div class="media-actions">
            <button class="media-btn play-btn" @click="playOffline(media)" :disabled="!media.exists">▶ 播放</button>
            <button class="media-btn delete-btn" @click="confirmDelete(media)">🗑 删除</button>
          </div>
        </div>
      </div>
    </template>

    <!-- 历史 Tab -->
    <template v-else-if="activeTab === 'history' && filteredHistory.length > 0">
      <div class="history-header">
        <button class="clear-btn" @click="clearAllHistory">🗑 清空历史</button>
      </div>
      <div class="media-list">
        <div v-for="h in filteredHistory" :key="h.id" class="media-card">
          <div class="media-cover" @click="goToPlay(h.title)">
            <img v-if="h.cover" :src="h.cover" :alt="h.title" class="cover-img"
              @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
            <span class="cover-fallback" v-if="!h.cover">🎬</span>
            <div class="play-overlay">▶</div>
          </div>
          <div class="media-info">
            <div class="media-title">{{ h.title }}</div>
            <div class="media-meta">
              <span class="media-episode">{{ h.episodeLabel }}</span>
            </div>
            <div class="history-progress-row">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: Math.round(h.progress * 100) + '%' }"></div>
              </div>
              <span class="progress-text">{{ Math.round(h.progress * 100) }}%</span>
            </div>
            <div class="media-time">{{ formatTime(h.lastWatchedAt) }}</div>
          </div>
          <div class="media-actions">
            <button class="media-btn play-btn" @click="goToPlay(h.title)">▶ 播放</button>
            <button class="media-btn delete-btn" @click="deleteHistory(h.episodeId)">🗑</button>
          </div>
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <EmptyState v-else-if="!loading" :message="emptyMessage" :icon="emptyIcon" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { offlineLibraryFacade } from '@/core/offline'
import { favoritesFacade } from '@/core/favorites'
import type { OfflineMedia } from '@/core/offline'
import type { FavoriteMedia } from '@/core/favorites'
import { historyFacade } from '@/core/history'
import type { WatchHistoryItem } from '@/core/history'

const router = useRouter()

// ======== Tab ========
interface TabItem {
  key: 'all' | 'offline' | 'favorites' | 'history'
  label: string
}

const tabs: TabItem[] = [
  { key: 'all', label: '全部' },
  { key: 'offline', label: '离线' },
  { key: 'favorites', label: '收藏' },
  { key: 'history', label: '历史' },
]

const activeTab = ref<TabItem['key']>('all')

// ======== 状态 ========
const loading = ref(true)
const searchQuery = ref('')
const allMedia = ref<OfflineMedia[]>([])
const allFavorites = ref<FavoriteMedia[]>([])
const allHistory = ref<WatchHistoryItem[]>([])
const refreshKey = ref(0)

let unsubOffline: (() => void) | null = null
let unsubFavorites: (() => void) | null = null
let unsubHistory: (() => void) | null = null

onMounted(async () => {
  try {
    await offlineLibraryFacade.load()
    await favoritesFacade.initialize()
    await historyFacade.initialize()
  } catch { /* ignore */ }

  allMedia.value = offlineLibraryFacade.getAllMedia()
  allFavorites.value = favoritesFacade.getFavorites()
  allHistory.value = historyFacade.getHistory()
  loading.value = false

  unsubOffline = offlineLibraryFacade.subscribe(() => {
    allMedia.value = offlineLibraryFacade.getAllMedia()
    refreshKey.value++
  })
  unsubFavorites = favoritesFacade.subscribe(() => {
    allFavorites.value = favoritesFacade.getFavorites()
    refreshKey.value++
  })
  unsubHistory = historyFacade.subscribe(() => {
    allHistory.value = historyFacade.getHistory()
    refreshKey.value++
  })
})

onUnmounted(() => {
  unsubOffline?.()
  unsubFavorites?.()
  unsubHistory?.()
})

// ======== 计算属性 ========
const filteredMedia = computed(() => {
  void refreshKey.value
  const source = activeTab.value === 'all'
    ? allMedia.value
    : allMedia.value.filter((m) => m.exists)

  if (!searchQuery.value.trim()) return source
  const kw = searchQuery.value.toLowerCase()
  return source.filter(
    (m) => m.title.toLowerCase().includes(kw) || m.episodeLabel.toLowerCase().includes(kw),
  )
})

const filteredFavorites = computed(() => {
  void refreshKey.value
  if (!searchQuery.value.trim()) return allFavorites.value
  const kw = searchQuery.value.toLowerCase()
  return allFavorites.value.filter((f) => f.title.toLowerCase().includes(kw))
})

const filteredHistory = computed(() => {
  void refreshKey.value
  if (!searchQuery.value.trim()) return allHistory.value
  const kw = searchQuery.value.toLowerCase()
  return allHistory.value.filter((h) => h.title.toLowerCase().includes(kw))
})

const tabCounts = computed(() => ({
  all: allMedia.value.length,
  offline: allMedia.value.filter((m) => m.exists).length,
  favorites: allFavorites.value.length,
  history: allHistory.value.length,
}))

const tabsWithCount = computed(() =>
  tabs.map((t) => ({ ...t, count: tabCounts.value[t.key] })),
)

const emptyMessage = computed(() => {
  if (searchQuery.value.trim()) return '没有匹配的内容'
  if (activeTab.value === 'favorites') return '暂无收藏内容，去详情页收藏剧集吧'
  if (activeTab.value === 'history') return '暂无观看历史'
  return '暂无离线内容，去播放页下载剧集吧'
})

const emptyIcon = computed(() => {
  if (searchQuery.value.trim()) return '🔍'
  if (activeTab.value === 'favorites') return '❤️'
  if (activeTab.value === 'history') return '🕐'
  return '📥'
})

// ======== 方法 ========
function playOffline(media: OfflineMedia) {
  if (!media.exists) return
  const encodedPath = encodeURI(media.localFilePath)
  router.push({ path: '/play', query: { name: media.title, local: `file:///${encodedPath}`, ep: media.episodeLabel } })
}

function goToPlay(title: string) {
  router.push({ path: '/play', query: { name: title } })
}

async function confirmDelete(media: OfflineMedia) {
  const confirmed = confirm(`确定删除「${media.title} ${media.episodeLabel}」?\n\n将同时删除本地文件。`)
  if (!confirmed) return
  await offlineLibraryFacade.removeMedia(media.id)
}

async function deleteHistory(episodeId: string) {
  await historyFacade.removeHistory(episodeId)
}

async function clearAllHistory() {
  const confirmed = confirm('确定清空全部观看历史？')
  if (!confirmed) return
  await historyFacade.clearHistory()
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatTime(ts: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.library-page { max-width: 1000px; margin: 0 auto; padding: var(--space-lg); }
.library-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md); flex-wrap: wrap; gap: var(--space-sm); }
.page-title { font-size: var(--text-xl); font-weight: var(--weight-bold); }
.search-input { padding: 6px 12px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-primary); font-size: var(--text-sm); width: 200px; transition: border-color var(--duration-fast) var(--ease-out); }
.search-input:focus { outline: none; border-color: var(--color-accent-blue); }
.search-input::placeholder { color: var(--color-text-tertiary); }
.tabs { display: flex; gap: 4px; margin-bottom: var(--space-lg); background: var(--color-bg-surface); border-radius: var(--radius-md); padding: 4px; width: fit-content; }
.tab-btn { padding: 6px 20px; border-radius: var(--radius-sm); background: transparent; color: var(--color-text-secondary); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); display: flex; align-items: center; gap: 6px; }
.tab-btn:hover { color: var(--color-text-primary); }
.tab-btn.active { background: var(--color-accent); color: #0a0a0f; }
.tab-count { font-size: var(--text-xs); opacity: 0.7; }
.media-list { display: flex; flex-direction: column; gap: 8px; }
.media-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); transition: border-color var(--duration-fast) var(--ease-out); }
.media-card:hover { border-color: var(--color-border-hover); }
.media-cover { width: 56px; height: 72px; border-radius: var(--radius-xs); overflow: hidden; flex-shrink: 0; background: var(--color-bg-elevated); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; }
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.cover-fallback { font-size: 24px; }
.play-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 20px; opacity: 0; transition: opacity var(--duration-fast) var(--ease-out); }
.media-cover:hover .play-overlay { opacity: 1; }
.media-info { flex: 1; min-width: 0; }
.media-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.media-meta { display: flex; gap: 8px; font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px; }
.media-episode { color: var(--color-accent-blue); }
.media-provider { color: var(--color-accent-blue); }
.media-time { font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px; }
.media-actions { display: flex; gap: 6px; flex-shrink: 0; }
.media-btn { padding: 6px 12px; border-radius: var(--radius-xs); font-size: var(--text-xs); font-weight: var(--weight-medium); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); white-space: nowrap; }
.play-btn { background: var(--color-accent-blue); color: #fff; border: none; }
.play-btn:hover:not(:disabled) { opacity: 0.85; }
.play-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.delete-btn { background: transparent; color: var(--color-text-tertiary); border: 1px solid var(--color-border); }
.delete-btn:hover { color: var(--color-danger); border-color: var(--color-danger); }
.history-header { display: flex; justify-content: flex-end; margin-bottom: var(--space-sm); }
.clear-btn { padding: 4px 12px; background: transparent; color: var(--color-text-tertiary); border: 1px solid var(--color-border); border-radius: var(--radius-xs); font-size: var(--text-xs); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); }
.clear-btn:hover { color: var(--color-danger); border-color: var(--color-danger); }
.history-progress-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.progress-bar { flex: 1; height: 3px; background: var(--color-bg-elevated); border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-accent-blue); border-radius: 2px; transition: width 0.3s ease; }
.progress-text { font-size: var(--text-xs); color: var(--color-text-tertiary); font-family: var(--font-mono); min-width: 32px; text-align: right; }
</style>
