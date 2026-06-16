<!-- src/renderer/pages/FavoritesPage.vue - PB1.5 收藏页 -->
<template>
  <div class="favorites-page">
    <div class="page-header">
      <h1 class="page-title">❤️ 我的收藏</h1>
      <span v-if="store.favorites.length > 0" class="count-badge">{{ store.favoriteCount }} 部</span>
    </div>

    <!-- 搜索过滤 -->
    <div v-if="store.favorites.length > 0" class="filter-bar">
      <input
        v-model="filterQuery"
        type="text"
        class="filter-input"
        placeholder="搜索收藏..."
        @input="onFilterInput"
      />
    </div>

    <!-- 内容网格 -->
    <div v-if="displayFavorites.length > 0" class="content-grid">
      <div v-for="item in displayFavorites" :key="item.mediaId" class="fav-card-wrapper">
        <PosterCard
          :name="item.title"
          :image="item.cover"
          :remarks="formatDate(item.favoritedAt)"
          @click="goToDetail(item.providerId, item.mediaId)"
        />
        <button class="remove-btn" title="取消收藏" @click.stop="remove(item.mediaId)">✕</button>
      </div>
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-else-if="store.favorites.length === 0"
      message="还没有收藏任何内容"
      action-label="去逛逛"
      @action="router.push('/')"
    />

    <!-- 搜索无结果 -->
    <EmptyState
      v-else
      message="未找到匹配的收藏"
      action-label="清除搜索"
      @action="filterQuery = ''; onFilterInput()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PosterCard from '@/components/cards/PosterCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useContentStore } from '@/stores/contentStore'
import { favoriteService } from '@/content'
import type { FavoriteMedia } from '@/content'

const router = useRouter()
const store = useContentStore()
const filterQuery = ref('')
const displayFavorites = ref<FavoriteMedia[]>([])

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function onFilterInput() {
  const q = filterQuery.value.trim()
  displayFavorites.value = q ? favoriteService.search(q) : store.favorites
}

async function remove(mediaId: string) {
  await store.removeFavorite(mediaId)
  onFilterInput()
}

function goToDetail(providerId: string, mediaId: string) {
  if (providerId) {
    router.push({ path: '/detail', query: { providerId, mediaId } })
  }
}

onMounted(async () => {
  await store.initialize()
  displayFavorites.value = store.favorites
})
</script>

<style scoped>
.favorites-page {
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text, #fff);
}

.count-badge {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 10px;
  background: var(--color-accent, #e8a850);
  color: #000;
}

.filter-bar {
  margin-bottom: 20px;
}

.filter-input {
  width: 100%;
  max-width: 360px;
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  background: var(--color-bg-elevated, #1a1a2e);
  color: var(--color-text, #fff);
  outline: none;
}

.filter-input:focus {
  border-color: var(--color-accent, #e8a850);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.fav-card-wrapper {
  position: relative;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fav-card-wrapper:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background: #e74c3c;
}
</style>
