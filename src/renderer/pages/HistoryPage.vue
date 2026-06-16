<!-- src/renderer/pages/HistoryPage.vue - PB1.5 观看历史页 -->
<template>
  <div class="history-page">
    <div class="page-header">
      <h1 class="page-title">🕐 观看历史</h1>
      <div class="header-actions">
        <span v-if="store.history.length > 0" class="count-badge">{{ store.history.length }} 条</span>
        <button
          v-if="store.history.length > 0"
          class="clear-btn"
          @click="handleClear"
        >
          清空全部
        </button>
      </div>
    </div>

    <!-- 历史列表 -->
    <div v-if="store.history.length > 0" class="history-list">
      <div
        v-for="item in store.history"
        :key="item.episodeId + item.lastWatchedAt"
        class="history-item"
        @click="goToResume(item.mediaId, item.episodeId)"
      >
        <img
          :src="item.cover"
          :alt="item.title"
          class="item-cover"
          @error="(e: Event) => { (e.target as HTMLImageElement).src = '' }"
        />
        <div class="item-info">
          <h3 class="item-title">{{ item.title }}</h3>
          <span class="item-episode">{{ item.episodeLabel }}</span>
          <span class="item-time">{{ formatTime(item.lastWatchedAt) }}</span>
        </div>
        <!-- 进度条 -->
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: Math.round((item.progress || 0) * 100) + '%' }" />
        </div>
        <span class="progress-text">{{ Math.round((item.progress || 0) * 100) }}%</span>
        <button class="delete-btn" title="移除" @click.stop="handleRemove(item.episodeId)">✕</button>
      </div>
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-else
      message="还没有观看记录"
      action-label="去逛逛"
      @action="router.push('/')"
    />

    <!-- 确认弹窗 -->
    <div v-if="showConfirm" class="confirm-overlay" @click.self="showConfirm = false">
      <div class="confirm-dialog">
        <p>确定要清空全部观看历史吗？此操作不可撤销。</p>
        <div class="confirm-actions">
          <button class="confirm-cancel" @click="showConfirm = false">取消</button>
          <button class="confirm-ok" @click="doClear">确认清空</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import { useContentStore } from '@/stores/contentStore'

const router = useRouter()
const store = useContentStore()
const showConfirm = ref(false)

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function goToResume(mediaId: string, episodeId: string) {
  router.push({ path: '/play', query: { mediaId, episodeId } })
}

function handleRemove(episodeId: string) {
  store.removeHistoryItem(episodeId)
}

function handleClear() {
  showConfirm.value = true
}

async function doClear() {
  await store.clearHistory()
  showConfirm.value = false
}

onMounted(async () => {
  await store.initialize()
})
</script>

<style scoped>
.history-page {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text, #fff);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-badge {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 10px;
  background: var(--color-bg-elevated, #1a1a2e);
  color: var(--color-text-secondary, #888);
}

.clear-btn {
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  background: transparent;
  color: #e74c3c;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(231, 76, 60, 0.15);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.history-item:hover {
  background: var(--color-bg-elevated, #1a1a2e);
}

.item-cover {
  width: 56px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--color-bg-elevated, #1a1a2e);
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--color-text, #fff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-episode {
  font-size: 12px;
  color: var(--color-accent, #e8a850);
}

.item-time {
  display: block;
  font-size: 11px;
  color: var(--color-text-secondary, #666);
  margin-top: 2px;
}

.progress-bar-container {
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  background: var(--color-accent, #e8a850);
  transition: width 0.3s;
}

.progress-text {
  font-size: 11px;
  color: var(--color-text-secondary, #666);
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-secondary, #666);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 13px;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

/* 确认弹窗 */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: var(--color-bg-elevated, #1a1a2e);
  padding: 28px 32px;
  border-radius: 14px;
  max-width: 380px;
  text-align: center;
}

.confirm-dialog p {
  margin: 0 0 20px;
  font-size: 15px;
  color: var(--color-text, #fff);
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-cancel,
.confirm-ok {
  padding: 8px 24px;
  font-size: 14px;
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-cancel {
  background: transparent;
  color: var(--color-text-secondary, #888);
}

.confirm-ok {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}
</style>
