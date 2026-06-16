<!-- src/renderer/pages/SearchPage.vue - PB1.5 搜索页 -->
<template>
  <div class="search-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="query"
        type="text"
        class="search-input"
        placeholder="搜索电影、电视剧、动漫..."
        @keyup.enter="doSearch"
      />
      <button class="search-btn" :disabled="store.searchLoading || !query.trim()" @click="doSearch">
        {{ store.searchLoading ? '搜索中...' : '搜索' }}
      </button>
    </div>

    <!-- 搜索结果 -->
    <div v-if="store.searchLoading" class="search-status">
      <LoadingSpinner />
      <span>正在搜索 "{{ store.lastSearchKeyword }}"...</span>
    </div>

    <div v-else-if="store.hasSearchResults" class="search-results">
      <p class="result-count">
        找到 {{ store.searchResults.length }} 个结果
        <span v-if="store.searchProviders.length">（来源: {{ store.searchProviders.join(', ') }}）</span>
      </p>
      <div class="result-grid">
        <PosterCard
          v-for="item in store.searchResults"
          :key="item.id + item.providerId"
          :name="item.title"
          :image="item.cover"
          :rating="item.score"
          :remarks="item.remark || item.providerName"
          @click="goToDetail(item.providerId, item.id)"
        />
      </div>
    </div>

    <EmptyState
      v-else-if="store.lastSearchKeyword"
      :message="'未找到 “' + store.lastSearchKeyword + '” 的相关结果'"
      action-label="返回首页"
      @action="router.push('/')"
    />

    <!-- 初始引导 -->
    <div v-else class="search-hint">
      <p>输入关键词搜索你想看的影视内容</p>
      <p class="hint-sub">支持电影、电视剧、动漫、综艺、纪录片</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PosterCard from '@/components/cards/PosterCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useContentStore } from '@/stores/contentStore'

const router = useRouter()
const store = useContentStore()
const query = ref('')

async function doSearch() {
  const keyword = query.value.trim()
  if (!keyword) return
  await store.search(keyword)
}

function goToDetail(providerId: string, mediaId: string) {
  router.push({ path: '/detail', query: { providerId, mediaId } })
}
</script>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  background: var(--color-bg-elevated, #1a1a2e);
  color: var(--color-text, #fff);
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-accent, #e8a850);
}

.search-btn {
  padding: 12px 28px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: var(--color-accent, #e8a850);
  color: #000;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.search-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--color-text-secondary, #888);
}

.result-count {
  color: var(--color-text-secondary, #888);
  margin-bottom: 16px;
  font-size: 14px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.search-hint {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-secondary, #888);
}

.hint-sub {
  font-size: 13px;
  margin-top: 8px;
  opacity: 0.6;
}
</style>
