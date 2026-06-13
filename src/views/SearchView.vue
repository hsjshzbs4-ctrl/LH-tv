<!-- src/views/SearchView.vue - P3.4 统一搜索页 -->
<!-- 搜索框 → 建议下拉 → 历史记录 → 多源聚合结果 -->
<template>
  <div class="search-page">
    <!-- ======== 搜索框 ======== -->
    <div class="search-header">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="搜索你喜欢的内容..."
          autofocus
          @input="onInput"
          @keydown.enter="doSearch"
          @focus="onFocus"
          @blur="onBlur"
        />
        <button v-if="query" class="clear-input-btn" @mousedown.prevent="clearInput" title="清除">✕</button>
        <button class="search-submit" @click="doSearch">搜索</button>
      </div>

      <!-- 搜索建议下拉 -->
      <div class="suggestions-wrapper" v-if="showSuggestions && suggestions.length > 0">
        <div class="suggestions-dropdown">
          <div
            v-for="s in suggestions"
            :key="s.keyword"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(s.keyword)"
          >
            <span class="suggestion-icon">🕐</span>
            <span class="suggestion-text">{{ s.keyword }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ======== 搜索结果 ======== -->
    <template v-if="searched">
      <div class="search-summary" v-if="!loading && results.length > 0">
        找到 <strong>{{ results.length }}</strong> 个结果
        <span class="source-count" v-if="totalProviders > 0">
          · 来自 <strong>{{ totalProviders }}</strong> 个数据源
        </span>
      </div>
      <div class="show-grid" v-if="results.length > 0">
        <ShowCard
          v-for="item in results"
          :key="`${item.providerId}_${item.id}`"
          :name="item.title"
          :image="item.cover"
          :year="item.year"
          :remarks="item.description"
          :rating="item.score"
          @click="goToPlay(item.title)"
        />
      </div>
      <LoadingSpinner v-if="loading" message="正在搜索..." />
      <EmptyState v-if="!loading && results.length === 0" message="未找到相关内容" icon="🔍" />
    </template>

    <!-- ======== 搜索历史（未搜索时） ======== -->
    <template v-else>
      <div class="search-sections">
        <div class="search-section" v-if="history.length > 0">
          <div class="section-header">
            <h3>🕐 搜索历史</h3>
            <button class="clear-all-btn" @click="clearAllHistory">清除全部</button>
          </div>
          <div class="tag-cloud">
            <button
              v-for="h in history"
              :key="h.keyword"
              class="search-tag"
              @click="selectSuggestion(h.keyword)"
            >
              {{ h.keyword }}
              <span class="remove-tag" @click.stop="removeHistoryItem(h.keyword)" title="删除">✕</span>
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <EmptyState
          v-if="history.length === 0"
          message="搜索你喜欢的内容"
          icon="🔍"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ShowCard from '@/components/cards/ShowCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { searchFacade } from '@/core/search'
import type { SearchHistoryItem, UnifiedSearchResult } from '@/core/search'

const route = useRoute()
const router = useRouter()

// ======== 响应式状态 ========
const query = ref((route.query.q as string) || '')
const results = ref<UnifiedSearchResult[]>([])
const history = ref<SearchHistoryItem[]>([])
const suggestions = ref<SearchHistoryItem[]>([])
const loading = ref(false)
const searched = ref(false)
const showSuggestions = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// 统计不重复的 Provider 来源数量
const totalProviders = computed(() => {
  const ids = new Set<string>()
  for (const item of results.value) {
    if (item.providerIds) {
      for (const pid of item.providerIds) ids.add(pid)
    } else if (item.providerId) {
      ids.add(item.providerId)
    }
  }
  return ids.size
})

// ======== 生命周期 ========
let unsub: (() => void) | null = null

onMounted(async () => {
  await searchFacade.initialize()
  syncHistory()
  unsub = searchFacade.subscribe(syncHistory)

  // 支持 /search?q=xxx 自动搜索
  if (query.value) {
    await nextTick()
    doSearch()
  }
})

onUnmounted(() => {
  unsub?.()
})

// ======== 方法 ========

function syncHistory() {
  history.value = searchFacade.getHistory()
}

async function doSearch() {
  const kw = query.value.trim()
  if (!kw) return

  loading.value = true
  searched.value = true
  showSuggestions.value = false

  try {
    results.value = await searchFacade.search(kw)
  } catch {
    results.value = []
  }

  loading.value = false
  syncHistory() // 搜索会自动写历史，刷新显示
}

function onInput() {
  const kw = query.value.trim()
  if (kw) {
    suggestions.value = searchFacade.getSuggestions(kw, 8)
    showSuggestions.value = suggestions.value.length > 0
  } else {
    suggestions.value = []
    showSuggestions.value = false
  }
}

function onFocus() {
  if (query.value.trim()) {
    suggestions.value = searchFacade.getSuggestions(query.value.trim(), 8)
    showSuggestions.value = suggestions.value.length > 0
  }
}

function onBlur() {
  // 延迟隐藏，让 mousedown 能触发
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function selectSuggestion(keyword: string) {
  query.value = keyword
  showSuggestions.value = false
  doSearch()
}

function clearInput() {
  query.value = ''
  suggestions.value = []
  showSuggestions.value = false
  searched.value = false
  results.value = []
  inputRef.value?.focus()
}

async function removeHistoryItem(keyword: string) {
  await searchFacade.removeHistory(keyword)
  syncHistory()
}

async function clearAllHistory() {
  await searchFacade.clearHistory()
  syncHistory()
}

function goToPlay(name: string) {
  router.push({ path: '/play', query: { name } })
}
</script>

<style scoped>
/* ======== 搜索框 ======== */
.search-header {
  max-width: 640px;
  margin: 0 auto var(--space-xl);
  position: relative;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.search-input-wrapper input {
  flex: 1;
  padding: 14px 16px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: var(--text-md);
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.search-input-wrapper input:focus {
  border-color: var(--color-accent);
}

.clear-input-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-bg-hover);
  color: var(--color-text-tertiary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.clear-input-btn:hover {
  background: var(--color-danger-muted);
  color: var(--color-danger);
}

.search-submit {
  padding: 12px 24px;
  background: var(--color-accent);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.search-submit:hover {
  opacity: 0.85;
}

/* ======== 搜索建议下拉 ======== */
.suggestions-wrapper {
  position: relative;
}

.suggestions-dropdown {
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: var(--z-dropdown);
  overflow: hidden;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.suggestion-item:hover {
  background: var(--color-bg-hover);
}

.suggestion-item:first-child {
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.suggestion-item:last-child {
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.suggestion-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.suggestion-text {
  color: var(--color-text-primary);
  font-size: var(--text-sm);
}

/* ======== 搜索结果 ======== */
.search-summary {
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-lg);
}

.source-count {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}

.show-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 20px;
}

/* ======== 搜索历史 ======== */
.search-sections {
  max-width: 640px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: var(--space-xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.section-header h3 {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.clear-all-btn {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px 8px;
  transition: color var(--duration-fast) var(--ease-out);
}

.clear-all-btn:hover {
  color: var(--color-danger);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.search-tag:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.remove-tag {
  font-size: 10px;
  color: var(--color-text-tertiary);
  transition: color var(--duration-fast) var(--ease-out);
  line-height: 1;
}

.remove-tag:hover {
  color: var(--color-danger);
}
</style>
