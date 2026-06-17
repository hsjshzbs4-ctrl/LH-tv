<!-- src/renderer/pages/CategoryPage.vue - PB1.5 统一分类页 -->
<template>
  <div class="category-page">
    <!-- 子分类标签 -->
    <div class="sub-tabs" v-if="store.categorySubs.length > 1">
      <button
        v-for="sub in store.categorySubs"
        :key="sub"
        class="sub-tab-btn"
        :class="{ active: sub === store.activeSubCategory }"
        @click="switchSub(sub)"
      >
        {{ SUB_LABELS[sub] || sub.toUpperCase() }}
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="store.categoryLoading" class="loading-grid">
      <SkeletonCard v-for="n in 12" :key="n" />
    </div>

    <!-- 内容网格 -->
    <div v-else-if="store.categoryItems.length > 0" class="content-grid">
      <PosterCard
        v-for="item in store.categoryItems"
        :key="item.id + item.providerId"
        :name="item.title"
        :image="item.cover"
        :rating="item.score"
        :remarks="item.remark || item.providerName"
        @click="goToDetail(item.providerId, item.id)"
      />
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-else
      :message="'暂无' + getLabel(store.activeCategory) + '内容'"
      action-label="返回首页"
      @action="router.push('/')"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PosterCard from '@/components/cards/PosterCard.vue'
import SkeletonCard from '@/components/cards/SkeletonCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useContentStore } from '@/stores/contentStore'
import { categoryService, SUB_LABELS } from '@/content'
import type { ContentCategory } from '@/content'

const router = useRouter()
const route = useRoute()
const store = useContentStore()

function getLabel(cat: ContentCategory): string {
  return categoryService.getCategoryLabel(cat)
}

async function switchSub(sub: string) {
  store.activeSubCategory = sub
  await store.loadCategory(store.activeCategory, sub)
}

function goToDetail(providerId: string, mediaId: string) {
  router.push({ path: '/detail', query: { providerId, mediaId } })
}

onMounted(async () => {
  await store.initialize()

  // 从路由参数/元数据读取分类
  const routeCategory = (route.meta?.category as ContentCategory)
    || (route.params?.type as ContentCategory)
    || (route.query?.type as ContentCategory)

  if (routeCategory) {
    await store.loadCategory(routeCategory)
  } else {
    // 默认从路由 path 推断
    const path = route.path.replace('/', '')
    const catMap: Record<string, ContentCategory> = {
      tv: 'tv', movies: 'movie', anime: 'anime',
      variety: 'variety', documentary: 'documentary',
    }
    const cat = catMap[path] || 'movie'
    await store.loadCategory(cat)
  }
})
</script>

<style scoped>
.category-page {
  padding: 8px 0 32px;
}

.sub-tabs {
  display: flex;
  gap: 6px;
  padding: 0 16px 16px;
}

.sub-tab-btn {
  flex-shrink: 0;
  padding: 5px 14px;
  font-size: 12px;
  border: 1px solid var(--color-border, #333);
  border-radius: 14px;
  background: transparent;
  color: var(--color-text-secondary, #888);
  cursor: pointer;
  transition: all 0.2s;
}

.sub-tab-btn.active {
  background: var(--color-bg-elevated, #1a1a2e);
  color: var(--color-accent, #e8a850);
  border-color: var(--color-accent, #e8a850);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 0 16px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 0 16px;
}
</style>
