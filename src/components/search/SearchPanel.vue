<!-- src/components/search/SearchPanel.vue - 全局搜索面板（Ctrl+K）-->
<template>
  <div class="search-overlay" @click.self="$emit('close')">
    <div class="search-panel">
      <div class="search-input-wrapper">
        <span class="search-panel-icon">🔍</span>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="search-panel-input"
          placeholder="搜索影视..."
          @input="onInput"
          @keydown="onKeydown"
          autofocus
        />
        <kbd class="search-kbd">Esc</kbd>
      </div>

      <div class="search-results" v-if="results.length > 0">
        <div
          v-for="(item, i) in results"
          :key="i"
          class="search-result-item"
          :class="{ active: activeIdx === i }"
          @click="goToItem(item)"
          @mouseenter="activeIdx = i"
        >
          <span class="result-icon">{{ typeIcon(item._type) }}</span>
          <span class="result-name" v-html="highlight(item.name)"></span>
          <span class="result-meta">
            {{ item._sub ? subLabel(item._sub) : '' }}
            {{ item.year ? '· ' + item.year : '' }}
            {{ item.rating ? '⭐' + item.rating : '' }}
          </span>
        </div>
      </div>

      <div class="search-empty" v-else-if="query.length >= 2 && !loading">
        <span>未找到相关内容</span>
      </div>

      <div class="search-loading" v-if="loading">
        <div class="mini-spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import type { CatalogItem } from '@/types'

defineEmits<{ close: [] }>()

const router = useRouter()
const catalogStore = useCatalogStore()

const query = ref('')
const results = ref<(CatalogItem & { _type?: string; _sub?: string })[]>([])
const activeIdx = ref(-1)
const loading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  await nextTick()
  inputRef.value?.focus()
  // 预加载目录缓存
  catalogStore.loadFullCatalog()
})

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = query.value.trim()
  if (q.length < 2) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  debounceTimer = setTimeout(async () => {
    results.value = await catalogStore.searchLocal(q)
    activeIdx.value = results.value.length > 0 ? 0 : -1
    loading.value = false
  }, 150)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (activeIdx.value < results.value.length - 1) activeIdx.value++
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (activeIdx.value > 0) activeIdx.value--
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIdx.value >= 0) {
      goToItem(results.value[activeIdx.value])
    } else if (query.value.trim()) {
      router.push({ path: '/search', query: { q: query.value.trim() } })
    }
  } else if (e.key === 'Escape') {
    // handled by parent
  }
}

function goToItem(item: CatalogItem & { _type?: string }) {
  router.push({
    path: '/play',
    query: { name: item.name }
  })
}

function typeIcon(type?: string): string {
  const map: Record<string, string> = { tv: '📺', movie: '🎬', anime: '🎌' }
  return map[type || ''] || '🎬'
}

function subLabel(sub?: string): string {
  const map: Record<string, string> = { cn: '国产', kr: '韩国', jp: '日本', us: '欧美', movie: '剧场' }
  return map[sub || ''] || ''
}

function highlight(text: string): string {
  const q = query.value.trim()
  if (!q) return text
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx < 0) return text
  return text.substring(0, idx) +
    '<mark>' + text.substring(idx, idx + q.length) + '</mark>' +
    text.substring(idx + q.length)
}
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  padding-top: 15vh;
  z-index: var(--z-modal);
}

.search-panel {
  width: 560px;
  max-height: 480px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-modal);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.search-panel-icon { font-size: 18px; }

.search-panel-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--text-md);
}

.search-panel-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-kbd {
  padding: 2px 8px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.search-result-item:hover,
.search-result-item.active {
  background: var(--color-bg-hover);
}

.result-icon { font-size: 16px; flex-shrink: 0; }

.result-name {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-name :deep(mark) {
  background: var(--color-accent-muted);
  color: var(--color-accent);
  padding: 0 2px;
  border-radius: 2px;
}

.result-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-empty {
  padding: 40px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.search-loading {
  padding: 20px;
  text-align: center;
}

.mini-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
</style>
