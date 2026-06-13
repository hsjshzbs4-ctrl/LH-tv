<!-- src/views/TVView.vue - 电视剧板块 -->
<template>
  <div class="category-page">
    <h1 class="page-title">📺 电视剧</h1>
    <div class="genre-tags">
      <button v-for="t in tags" :key="t.key" class="genre-tag" :class="{ active: activeTag === t.key }" @click="activeTag = t.key">
        {{ t.label }}
      </button>
    </div>
    <div class="show-grid" v-if="!loading && items.length > 0">
      <ShowCard v-for="v in items" :key="v.id" :name="v.title" :image="v.cover" :rating="v.score" :year="v.year" :remarks="v.remark" @click="goToPlay(v.title)" />
    </div>
    <SkeletonCard v-if="loading" v-for="n in 12" :key="'s'+n" />
    <EmptyState v-if="!loading && items.length === 0" message="暂无数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ShowCard from '@/components/cards/ShowCard.vue'
import SkeletonCard from '@/components/cards/SkeletonCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { providerFacade } from '@/core/providers'
import type { MediaItem } from '@/core/providers'

const router = useRouter()
const tags = [
  { key: 'cn', label: '国产剧' },
  { key: 'kr', label: '韩剧' },
  { key: 'us', label: '美剧' }
]
const activeTag = ref('cn')
const items = ref<MediaItem[]>([])
const loading = ref(false)

function goToPlay(name: string) { router.push({ path: '/play', query: { name } }) }

async function loadData() {
  loading.value = true
  try {
    items.value = await providerFacade.catalog('applecms', 'tv', activeTag.value)
  } catch { items.value = [] }
  loading.value = false
}

onMounted(loadData)
watch(activeTag, loadData)
</script>

<style scoped>
.page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); margin-bottom: var(--space-md); }
.genre-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: var(--space-lg); }
.genre-tag { padding: 6px 18px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); }
.genre-tag:hover { color: #fff; border-color: var(--color-border-hover); }
.genre-tag.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
.show-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 20px; }
</style>
