<!-- src/views/HomeView.vue - 首页（v4: ContinueWatchingFacade） -->
<template>
  <div class="home">
    <!-- 继续观看 -->
    <ScrollRow v-if="continueList.length > 0" title="🕐 继续观看">
      <PosterCard
        v-for="item in continueList"
        :key="item.mediaId"
        :name="item.title"
        :image="item.cover"
        :remarks="progressLabel(item)"
        @click="goToResume(item.mediaId, item.episodeId)"
      />
    </ScrollRow>

    <!-- 电视剧 TOP10 -->
    <ScrollRow title="📺 电视剧 · TOP10" more-link="/tv">
      <SkeletonCard v-if="tvLoading" v-for="n in 6" :key="'sktv'+n" inline />
      <PosterCard
        v-for="v in tvList"
        :key="v.id"
        :name="v.title"
        :image="v.cover"
        :rating="v.score"
        :remarks="v.remark"
        @click="goToPlay(v.title)"
      />
    </ScrollRow>

    <!-- 电影 TOP10 -->
    <ScrollRow title="🎬 电影 · TOP10" more-link="/movies">
      <SkeletonCard v-if="movieLoading" v-for="n in 6" :key="'skmv'+n" inline />
      <PosterCard
        v-for="v in movieList"
        :key="v.id"
        :name="v.title"
        :image="v.cover"
        :rating="v.score"
        :remarks="v.remark"
        @click="goToPlay(v.title)"
      />
    </ScrollRow>

    <!-- 动漫 TOP10 -->
    <ScrollRow title="🎌 动漫 · TOP10" more-link="/anime">
      <SkeletonCard v-if="animeLoading" v-for="n in 6" :key="'skan'+n" inline />
      <PosterCard
        v-for="v in animeList"
        :key="v.id"
        :name="v.title"
        :image="v.cover"
        :rating="v.score"
        :remarks="v.remark"
        @click="goToPlay(v.title)"
      />
    </ScrollRow>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ScrollRow from '@/components/common/ScrollRow.vue'
import PosterCard from '@/components/cards/PosterCard.vue'
import SkeletonCard from '@/components/cards/SkeletonCard.vue'
import { providerFacade } from '@/core/providers'
import { continueWatchingFacade } from '@/core/continue-watching'
import type { ContinueWatchingItem } from '@/core/continue-watching'
import type { MediaItem } from '@/core/providers'

const router = useRouter()

const tvList = ref<MediaItem[]>([])
const movieList = ref<MediaItem[]>([])
const animeList = ref<MediaItem[]>([])
const tvLoading = ref(true)
const movieLoading = ref(true)
const animeLoading = ref(true)

const continueList = ref<ContinueWatchingItem[]>([])

let unsubContinue: (() => void) | null = null
let unsubPostersUpdated: (() => void) | null = null

function goToPlay(name: string) {
  router.push({ path: '/play', query: { name } })
}

function goToResume(mediaId: string, episodeId: string) {
  router.push({ path: '/play', query: { name: mediaId, mediaId, episodeId, resume: 'true' } })
}

function progressLabel(item: ContinueWatchingItem): string {
  const pct = Math.round(item.progress * 100)
  return `${item.episodeLabel} · ${pct}%`
}

function syncContinue() {
  continueList.value = continueWatchingFacade.getContinueWatching()
}

async function reloadAllSections() {
  try {
    const items = await providerFacade.catalog('applecms', 'tv', 'cn')
    if (items?.length) tvList.value = items.slice(0, 10)
  } catch { /* ignore */ }

  try {
    const [cnMovies, usMovies] = await Promise.all([
      providerFacade.catalog('applecms', 'movie', 'cn'),
      providerFacade.catalog('applecms', 'movie', 'us'),
    ])
    const all = [...(cnMovies || []), ...(usMovies || [])]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
    movieList.value = all.slice(0, 10)
  } catch { /* ignore */ }

  try {
    const items = await providerFacade.catalog('anime-crawler', 'anime', 'all')
    if (items?.length) animeList.value = items.slice(0, 10)
  } catch { /* ignore */ }
}

onMounted(async () => {
  // 初始化继续观看
  await continueWatchingFacade.initialize()
  syncContinue()
  unsubContinue = continueWatchingFacade.subscribe(syncContinue)

  // 加载目录
  await reloadAllSections()
  tvLoading.value = false
  movieLoading.value = false
  animeLoading.value = false

  unsubPostersUpdated = window.app.onPostersUpdated((data) => {
    if (data.fetched > 0 || data.total === 0) {
      reloadAllSections()
    }
  })
})

onUnmounted(() => {
  unsubContinue?.()
  unsubPostersUpdated?.()
})
</script>

<style scoped>
.home {
  max-width: 1400px;
}
</style>
