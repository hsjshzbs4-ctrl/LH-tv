<!-- src/views/HistoryView.vue - 观看历史 -->
<template>
  <div class="history-page">
    <h1 class="page-title">🕐 观看历史</h1>
    <button v-if="userStore.history.length > 0" class="clear-btn" @click="userStore.clearHistory()">清除全部历史</button>
    <div class="history-list" v-if="userStore.history.length > 0">
      <div
        v-for="h in userStore.history"
        :key="h.showId + '_' + h.episodeNumber"
        class="history-item"
        @click="$router.push({ path: '/play', query: { name: h.showName } })"
      >
        <img v-if="h.showImage" :src="h.showImage" class="history-img" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
        <div class="history-placeholder" v-if="!h.showImage">{{ h.showName.charAt(0) }}</div>
        <div class="history-info">
          <div class="history-name">{{ h.showName }}</div>
          <div class="history-ep">看到 第{{ h.episodeNumber }}集</div>
          <div class="history-time">{{ formatTime(h.watchedAt) }}</div>
        </div>
      </div>
    </div>
    <EmptyState v-else message="暂无观看记录" icon="🕐" action-label="去首页看看" @action="$router.push('/')" />
  </div>
</template>

<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 3600000) return '刚刚'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return d.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); margin-bottom: var(--space-xl); }
.clear-btn { padding: 6px 16px; background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: var(--radius-sm); cursor: pointer; margin-bottom: var(--space-lg); font-size: var(--text-xs); transition: all var(--duration-fast) var(--ease-out); }
.clear-btn:hover { background: var(--color-danger); color: #fff; }
.history-list { display: flex; flex-direction: column; gap: 4px; }
.history-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); cursor: pointer; transition: background var(--duration-fast) var(--ease-out); }
.history-item:hover { background: var(--color-bg-surface); }
.history-img { width: 60px; height: 84px; object-fit: cover; border-radius: var(--radius-xs); flex-shrink: 0; }
.history-placeholder { width: 60px; height: 84px; background: var(--color-bg-surface); border-radius: var(--radius-xs); display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--color-text-secondary); flex-shrink: 0; }
.history-info { flex: 1; min-width: 0; }
.history-name { font-size: var(--text-base); color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-ep { font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 2px; }
.history-time { font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px; }
</style>
