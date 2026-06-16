<!-- src/renderer/pages/HomePage.vue - PB1.5 首页 -->
<template>
  <div class="home">
    <!-- 继续观看 -->
    <ScrollRow v-if="store.continueWatching.length > 0" title="🕐 继续观看">
      <PosterCard
        v-for="item in store.continueWatching"
        :key="item.episodeId"
        :name="item.title"
        :image="item.cover"
        :remarks="progressLabel(item)"
        @click="goToResume(item.mediaId, item.episodeId)"
      />
    </ScrollRow>

    <!-- 加载状态 -->
    <template v-if="store.homeLoading">
      <ScrollRow v-for="n in 3" :key="'skel'+n" title="加载中...">
        <SkeletonCard v-for="i in 6" :key="'sk'+i" inline />
      </ScrollRow>
    </template>

    <!-- 分类区块 -->
    <template v-else-if="store.homeSections.length > 0">
      <ScrollRow
        v-for="section in store.homeSections"
        :key="section.category"
        :title="getSectionIcon(section.category) + ' ' + section.label + ' · TOP10'"
        :more-link="'/' + section.category"
      >
        <PosterCard
          v-for="v in section.items.slice(0, 10)"
          :key="v.id"
          :name="v.title"
          :image="v.cover"
          :rating="v.score"
          :remarks="v.remark"
          @click="goToDetail(v.providerId, v.id)"
        />
      </ScrollRow>
    </template>

    <!-- 错误状态 -->
    <ErrorState v-else-if="store.error" :message="store.error" action-label="重试" @action="refresh" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ScrollRow from '@/components/common/ScrollRow.vue'
import PosterCard from '@/components/cards/PosterCard.vue'
import SkeletonCard from '@/components/cards/SkeletonCard.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { useContentStore } from '@/stores/contentStore'
import type { WatchHistoryItem, ContentCategory } from '@/content'

const router = useRouter()
const store = useContentStore()

const SECTION_ICONS: Record<ContentCategory, string> = {
  movie: '🎬',
  tv: '📺',
  anime: '🎌',
  variety: '🎭',
  documentary: '📖',
}

function getSectionIcon(category: ContentCategory): string {
  return SECTION_ICONS[category] || '📁'
}

function progressLabel(item: WatchHistoryItem): string {
  const pct = Math.round((item.progress || 0) * 100)
  return item.episodeLabel ? `${item.episodeLabel} · ${pct}%` : `${pct}%`
}

function goToResume(mediaId: string, episodeId: string) {
  router.push({ path: '/play', query: { mediaId, episodeId } })
}

function goToDetail(providerId: string, mediaId: string) {
  router.push({ path: '/detail', query: { providerId, mediaId } })
}

async function refresh() {
  store.clearError()
  await store.loadHome()
}

let unsub: (() => void) | null = null

onMounted(async () => {
  await store.initialize()
  await store.loadHome()

  try {
    unsub = window.app?.onPostersUpdated?.((_data: unknown) => {
      store.loadHome()
    })
  } catch { /* preload may not expose this event */ }
})

onUnmounted(() => {
  unsub?.()
})
</script>

<style scoped>
.home {
  padding: 8px 0 32px;
}
</style>
