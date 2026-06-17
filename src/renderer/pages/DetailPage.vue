<!-- src/renderer/pages/DetailPage.vue - PB1.5 详情页 -->
<template>
  <div class="detail-page">
    <!-- 加载中 -->
    <div v-if="store.detailLoading" class="detail-loading">
      <LoadingSpinner />
    </div>

    <!-- 错误状态 -->
    <ErrorState
      v-else-if="store.error && !store.detailItem"
      :message="store.error"
      action-label="返回"
      @action="router.back()"
    />

    <!-- 详情内容 -->
    <div v-else-if="store.detailItem" class="detail-content">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="router.back()">← 返回</button>

      <!-- 封面区 -->
      <div class="hero-section">
        <img
          :src="store.detailItem.cover"
          :alt="store.detailItem.title"
          class="hero-cover"
          @error="(e: Event) => { (e.target as HTMLImageElement).style.display = 'none' }"
        />
        <div class="hero-info">
          <h1 class="hero-title">{{ store.detailItem.title }}</h1>
          <div class="hero-meta">
            <span v-if="store.detailItem.year" class="meta-year">{{ store.detailItem.year }}</span>
            <span v-if="store.detailItem.score" class="meta-score">⭐ {{ store.detailItem.score }}</span>
          </div>
          <p class="hero-desc">{{ store.detailItem.description }}</p>

          <!-- 操作按钮 -->
          <div class="hero-actions">
            <button
              class="action-btn favorite-btn"
              :class="{ active: store.isFavorited(store.detailItem.id) }"
              @click="toggleFav"
            >
              {{ store.isFavorited(store.detailItem.id) ? '❤️ 已收藏' : '🤍 收藏' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 剧集列表 -->
      <div v-if="playableEpisodes.length > 0" class="episodes-section">
        <h2 class="section-title">📺 剧集列表</h2>
        <p v-if="skippedCount > 0" style="color:var(--color-text-tertiary);font-size:12px;margin-bottom:8px">
          已过滤 {{ skippedCount }} 个无播放源的剧集
        </p>
        <div class="episode-grid">
          <button
            v-for="ep in playableEpisodes"
            :key="ep.id"
            class="episode-btn"
            @click="goToPlay(ep.id)"
          >
            {{ ep.title || `第${ep.episodeNumber || '?'}集` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useContentStore } from '@/stores/contentStore'
import type { MediaItem } from '@/content'

const router = useRouter()
const route = useRoute()
const store = useContentStore()

const playableEpisodes = computed(() => {
  if (!store.detailItem?.episodes) return []
  return store.detailItem.episodes.filter(e => e.url && e.url.trim())
})

const skippedCount = computed(() => {
  if (!store.detailItem?.episodes) return 0
  return store.detailItem.episodes.length - playableEpisodes.value.length
})

async function toggleFav() {
  if (!store.detailItem) return
  const media: MediaItem = {
    id: store.detailItem.id,
    title: store.detailItem.title,
    cover: store.detailItem.cover,
    providerId: store.detailItem.providerId,
    providerName: '',
    type: (store.detailItem.category as MediaItem['type']) || 'movie',
    year: store.detailItem.year,
    score: store.detailItem.score,
    remark: store.detailItem.description?.slice(0, 100),
  }
  await store.toggleFavorite(media)
}

async function goToPlay(episodeId: string) {
  if (!store.detailItem) return

  // PB2-S2: Resume Check before launching player
  const { continueWatchingService } = await import('@/integration/continueWatching')
  const resumeCard = continueWatchingService.getResumeCard(
    store.detailItem.id,
    episodeId,
  )

  const query: Record<string, string> = {
    name: store.detailItem.title,
    providerId: store.detailItem.providerId,
    mediaId: store.detailItem.id,
    episodeId,
  }

  if (resumeCard) {
    query.resume = 'true'
    query.position = String(resumeCard.lastPosition)
  }

  router.push({ path: `/player/${store.detailItem.providerId}/${store.detailItem.id}/${episodeId}`, query })
}

onMounted(async () => {
  await store.initialize()

  const providerId = (route.query?.providerId as string) || (route.params?.providerId as string)
  const mediaId = (route.query?.mediaId as string) || (route.params?.mediaId as string)

  if (providerId && mediaId) {
    await store.loadDetail(providerId, mediaId)
  }
})
</script>

<style scoped>
.detail-page {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 100px 0;
}

.back-btn {
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 6px;
  background: var(--color-bg-elevated, #1a1a2e);
  color: var(--color-text-secondary, #888);
  cursor: pointer;
  margin-bottom: 16px;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--color-accent, #e8a850);
}

.hero-section {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.hero-cover {
  width: 240px;
  height: 336px;
  object-fit: cover;
  border-radius: 12px;
  background: var(--color-bg-elevated, #1a1a2e);
  flex-shrink: 0;
}

.hero-info {
  flex: 1;
  min-width: 0;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--color-text, #fff);
}

.hero-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--color-text-secondary, #888);
}

.meta-score {
  color: var(--color-accent, #e8a850);
}

.hero-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary, #aaa);
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 24px;
  font-size: 14px;
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  background: var(--color-bg-elevated, #1a1a2e);
  color: var(--color-text, #fff);
  cursor: pointer;
  transition: all 0.2s;
}

.favorite-btn.active {
  border-color: #e74c3c;
  color: #e74c3c;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--color-text, #fff);
}

.episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.episode-btn {
  padding: 10px 16px;
  font-size: 13px;
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  background: var(--color-bg-elevated, #1a1a2e);
  color: var(--color-text, #fff);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.episode-btn:hover {
  border-color: var(--color-accent, #e8a850);
  color: var(--color-accent, #e8a850);
}

@media (max-width: 640px) {
  .hero-section {
    flex-direction: column;
  }
  .hero-cover {
    width: 160px;
    height: 224px;
  }
}
</style>
