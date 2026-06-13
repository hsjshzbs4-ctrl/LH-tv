<!-- src/views/DownloadView.vue - 下载管理页面 -->
<template>
  <div class="download-page">
    <div class="page-header">
      <h1 class="page-title">下载管理</h1>
      <button class="library-link" @click="goToLibrary">📂 打开离线库</button>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button
        v-for="tab in getTabItems()"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="task-list" v-if="filteredTasks.length > 0">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-item"
      >
        <!-- 封面 -->
        <div class="task-cover">
          <img
            :src="task.cover"
            :alt="task.title"
            class="cover-img"
            @error="onCoverError"
          />
          <div class="cover-fallback" v-if="!task.cover">🎬</div>
        </div>

        <!-- 信息 -->
        <div class="task-info">
          <div class="task-title">{{ task.title }}</div>
          <div class="task-meta">
            <span class="task-episode">{{ task.episodeLabel }}</span>
            <span class="task-provider">{{ task.providerName }}</span>
          </div>

          <!-- 进度条 -->
          <div class="task-progress-row" v-if="task.status === 'downloading' || task.status === 'paused' || task.status === 'recovering'">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="{ paused: task.status === 'paused' }"
                :style="{ width: task.progress + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ task.progress }}%</span>
          </div>

          <!-- 错误信息 -->
          <div class="task-error" v-if="task.status === 'failed' && task.error">
            {{ task.error }}
          </div>

          <!-- 本地路径 -->
          <div class="task-path" v-if="task.status === 'completed' && task.localFilePath" :title="task.localFilePath">
            📁 {{ shortenPath(task.localFilePath) }}
          </div>
        </div>

        <!-- 状态标签 + 操作 -->
        <div class="task-actions">
          <span class="status-badge" :class="'status-' + task.status">
            {{ statusLabel(task.status) }}
          </span>

          <!-- 下载中 → 暂停 + 取消 -->
          <template v-if="task.status === 'downloading'">
            <button class="action-btn pause-btn" @click="handlePause(task.id)" title="暂停">⏸</button>
            <button class="action-btn cancel-btn" @click="handleCancel(task.id)" title="取消">✕</button>
          </template>

          <!-- 已暂停 → 恢复 + 取消 -->
          <template v-if="task.status === 'paused'">
            <button v-if="task.supportsResume !== false" class="action-btn recover-btn" @click="handleRecover(task.id)" title="恢复下载">🔄</button>
            <button class="action-btn cancel-btn" @click="handleCancel(task.id)" title="取消">✕</button>
          </template>

          <!-- 恢复中 → disabled -->
          <template v-if="task.status === 'recovering'">
            <button class="action-btn recover-btn" disabled title="恢复中...">⏳</button>
          </template>

          <!-- 等待中 → 取消 -->
          <template v-if="task.status === 'pending'">
            <button class="action-btn cancel-btn" @click="handleCancel(task.id)" title="取消">✕</button>
          </template>

          <!-- 已完成 → 删除 -->
          <template v-if="task.status === 'completed'">
            <button class="action-btn remove-btn" @click="handleRemove(task.id)" title="删除">🗑</button>
          </template>

          <!-- 失败 → 恢复 + 删除 -->
          <template v-if="task.status === 'failed'">
            <button v-if="task.supportsResume !== false" class="action-btn recover-btn" @click="handleRecover(task.id)" title="重新下载">🔄</button>
            <button class="action-btn remove-btn" @click="handleRemove(task.id)" title="删除">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-else
      :message="emptyMessage"
      :icon="emptyIcon"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { downloadFacade } from '@/core/download'
import type { DownloadTask, DownloadStatus } from '@/core/download'
import EmptyState from '@/components/common/EmptyState.vue'

// ======== Tab 定义 ========
interface TabItem {
  key: 'all' | 'downloading' | 'completed' | 'failed'
  label: string
}

const tabs: TabItem[] = [
  { key: 'all', label: '全部' },
  { key: 'downloading', label: '下载中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed', label: '失败' },
]

const router = useRouter()
const activeTab = ref<TabItem['key']>('all')

// ======== 响应式状态 ========
const allTasks = ref<DownloadTask[]>([])
const refreshKey = ref(0) // 触发重新计算

function refresh() {
  allTasks.value = downloadFacade.getTasks()
  refreshKey.value++
}

let unsub: (() => void) | null = null

onMounted(() => {
  refresh()
  unsub = downloadFacade.subscribe(refresh)
})

onUnmounted(() => {
  unsub?.()
})

// ======== 计算属性 ========
const filteredTasks = computed(() => {
  // 触发 refreshKey 依赖
  void refreshKey.value
  switch (activeTab.value) {
    case 'downloading':
      return allTasks.value.filter((t) => t.status === 'downloading' || t.status === 'pending' || t.status === 'paused' || t.status === 'recovering')
    case 'completed':
      return allTasks.value.filter((t) => t.status === 'completed')
    case 'failed':
      return allTasks.value.filter((t) => t.status === 'failed')
    default:
      return [...allTasks.value].sort((a, b) => b.createdAt - a.createdAt)
  }
})

const emptyMessage = computed(() => {
  switch (activeTab.value) {
    case 'downloading': return '暂无下载中的任务'
    case 'completed': return '暂无已完成的下载'
    case 'failed': return '暂无失败的下载'
    default: return '暂无下载任务，去播放页选择一个剧集开始下载吧'
  }
})

const emptyIcon = computed(() => {
  switch (activeTab.value) {
    case 'downloading': return '⬇️'
    case 'completed': return '✅'
    case 'failed': return '❌'
    default: return '📥'
  }
})

// Tab 计数
const tabCounts = computed(() => {
  return {
    all: allTasks.value.length,
    downloading: allTasks.value.filter((t) => t.status === 'downloading' || t.status === 'pending' || t.status === 'paused' || t.status === 'recovering').length,
    completed: allTasks.value.filter((t) => t.status === 'completed').length,
    failed: allTasks.value.filter((t) => t.status === 'failed').length,
  }
})

// 给 template 中 tab.count 使用的动态计数
function getTabItems(): (TabItem & { count: number })[] {
  return tabs.map((t) => ({ ...t, count: tabCounts.value[t.key] }))
}

// ======== 方法 ========
function statusLabel(status: DownloadStatus): string {
  const map: Record<DownloadStatus, string> = {
    pending: '等待中',
    downloading: '下载中',
    paused: '已暂停',
    recovering: '恢复中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function handlePause(id: string) {
  downloadFacade.pauseTask(id)
}

function handleResume(id: string) {
  downloadFacade.resumeTask(id)
}

async function handleRecover(id: string) {
  await downloadFacade.recoverTask(id)
}

function handleCancel(id: string) {
  downloadFacade.cancelTask(id)
}

function handleRemove(id: string) {
  downloadFacade.removeTask(id)
}

function shortenPath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/')
  return parts.slice(-2).join('/')
}

function onCoverError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

function goToLibrary() {
  router.push('/library')
}
</script>

<style scoped>
.download-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-lg);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.page-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
}

.library-link {
  padding: 6px 14px;
  background: var(--color-accent-muted);
  color: var(--color-accent);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.library-link:hover {
  background: var(--color-accent);
  color: #0a0a0f;
}

/* ======== Tab ======== */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: var(--space-lg);
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-accent);
  color: #0a0a0f;
}

.tab-count {
  font-size: var(--text-xs);
  opacity: 0.7;
}

/* ======== 任务列表 ======== */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.task-item:hover {
  border-color: var(--color-border-hover);
}

/* 封面 */
.task-cover {
  width: 56px;
  height: 72px;
  border-radius: var(--radius-xs);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  font-size: 24px;
}

/* 信息区 */
.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.task-meta {
  display: flex;
  gap: 8px;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
}

.task-provider {
  color: var(--color-accent-blue);
}

/* 进度条 */
.task-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--color-bg-elevated);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent-blue);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-fill.paused {
  background: var(--color-warning);
}

.progress-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  min-width: 32px;
  text-align: right;
}

/* 错误 */
.task-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 路径 */
.task-path {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作区 */
.task-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: var(--weight-medium);
}

.status-pending {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.status-downloading {
  background: rgba(91, 156, 245, 0.15);
  color: var(--color-accent-blue);
}

.status-paused {
  background: rgba(245, 166, 35, 0.15);
  color: var(--color-warning);
}

.status-recovering {
  background: rgba(91, 156, 245, 0.15);
  color: var(--color-accent-blue);
}

.status-completed {
  background: rgba(76, 175, 80, 0.15);
  color: var(--color-accent-green);
}

.status-failed {
  background: rgba(232, 85, 85, 0.15);
  color: var(--color-danger);
}

/* 操作按钮 */
.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  background: transparent;
  border: 1px solid var(--color-border);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.action-btn:hover {
  border-color: var(--color-border-hover);
  background: var(--color-bg-hover);
}

.pause-btn:hover { color: var(--color-warning); border-color: var(--color-warning); }
.resume-btn:hover { color: var(--color-accent-green); border-color: var(--color-accent-green); }
.recover-btn:hover { color: var(--color-accent-blue); border-color: var(--color-accent-blue); }
.recover-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.cancel-btn:hover { color: var(--color-danger); border-color: var(--color-danger); }
.remove-btn:hover { color: var(--color-text-tertiary); border-color: var(--color-text-tertiary); }
</style>
