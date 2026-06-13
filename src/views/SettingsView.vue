<!-- src/views/SettingsView.vue - 设置页 -->
<template>
  <div class="settings-page">
    <h1 class="page-title">⚙️ 设置</h1>

    <div class="settings-group">
      <h3 class="group-title">数据管理</h3>
      <div class="setting-item">
        <div>
          <span>导出数据</span>
          <span class="setting-desc">备份收藏、历史和播放进度</span>
        </div>
        <button class="setting-btn" @click="handleExport">导出 JSON</button>
      </div>
      <div class="setting-item">
        <div>
          <span>导入数据</span>
          <span class="setting-desc">从备份文件恢复数据（合并模式）</span>
        </div>
        <button class="setting-btn" @click="handleImport">导入 JSON</button>
      </div>
      <div class="setting-item">
        <span>存储统计</span>
        <span class="setting-value">
          {{ stats.favorites }} 收藏 · {{ stats.history }} 历史
        </span>
      </div>
    </div>

    <div class="settings-group">
      <h3 class="group-title">维护</h3>
      <div class="setting-item">
        <div>
          <span>增量刷新海报</span>
          <span class="setting-desc">只更新没有本地缓存的海报（保留已有海报）</span>
        </div>
        <button class="setting-btn" @click="refreshPosters" :disabled="refreshing">
          {{ refreshing ? '刷新中...' : '增量刷新' }}
        </button>
      </div>
      <div class="setting-item">
        <div>
          <span>强制全量刷新海报</span>
          <span class="setting-desc">⚠️ 清除全部旧海报缓存，从豆瓣等官方源重新抓取，替换所有海报</span>
        </div>
        <button class="setting-btn danger" @click="forceRefreshPosters" :disabled="refreshing">
          {{ refreshing ? '刷新中...' : '强制全量刷新' }}
        </button>
      </div>
      <!-- 海报刷新进度 -->
      <div v-if="posterProgress.total > 0" class="poster-progress">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ posterProgress.current }}/{{ posterProgress.total }} — {{ posterProgress.name }}</span>
      </div>
    </div>

    <div class="settings-group">
      <h3 class="group-title">存储</h3>
      <div class="setting-item">
        <span>清除搜索缓存</span>
        <button class="setting-btn" @click="clearCache">清除</button>
      </div>
      <div class="setting-item">
        <span>清除观看历史</span>
        <button class="setting-btn danger" @click="clearHistory">清除</button>
      </div>
      <div class="setting-item">
        <span>打开下载目录</span>
        <button class="setting-btn" @click="openDownloadDir">打开</button>
      </div>
    </div>

    <!-- P4.5 监控面板 -->
    <div class="settings-group">
      <h3 class="group-title">📊 监控面板</h3>
      <div class="monitor-grid" v-if="dashboard">
        <div class="monitor-card">
          <span class="monitor-label">Provider</span>
          <span class="monitor-value">{{ dashboard.onlineProviders }}/{{ dashboard.totalProviders }} 在线</span>
          <span class="monitor-sub" v-if="dashboard.failedProviders > 0">{{ dashboard.failedProviders }} 个异常</span>
        </div>
        <div class="monitor-card">
          <span class="monitor-label">搜索次数</span>
          <span class="monitor-value">{{ dashboard.search.todaySearches }}</span>
          <span class="monitor-sub">{{ dashboard.search.avgResponseTime.toFixed(0) }}ms 平均</span>
        </div>
        <div class="monitor-card">
          <span class="monitor-label">播放成功率</span>
          <span class="monitor-value">{{ (dashboard.playback.switchSuccessRate * 100).toFixed(1) }}%</span>
          <span class="monitor-sub">换源 {{ dashboard.playback.autoSwitchCount }} 次</span>
        </div>
        <div class="monitor-card">
          <span class="monitor-label">活跃下载</span>
          <span class="monitor-value">{{ dashboard.download.activeTasks }}</span>
          <span class="monitor-sub">{{ dashboard.download.downloadSuccess }} 成功</span>
        </div>
      </div>

      <!-- Provider 排行榜 -->
      <div class="monitor-section" v-if="dashboard && dashboard.providerStats.length > 0">
        <h4 class="monitor-section-title">Provider 排行榜</h4>
        <div class="rank-list">
          <div v-for="(p, i) in (dashboard?.providerStats ?? [])" :key="p.providerId" class="rank-item">
            <span class="rank-num">{{ i + 1 }}</span>
            <span class="rank-name">{{ p.providerName }}</span>
            <span class="rank-rate">{{ (p.successRate * 100).toFixed(0) }}%</span>
            <span class="rank-health" :class="p.health">{{ p.health }}</span>
          </div>
        </div>
      </div>

      <!-- Worker 面板 -->
      <div class="monitor-section" v-if="dashboard && dashboard.workers.length > 0">
        <h4 class="monitor-section-title">Worker 状态</h4>
        <div class="worker-list">
          <div v-for="w in (dashboard?.workers ?? [])" :key="w.providerId" class="worker-item">
            <span class="worker-name">{{ w.providerId }}</span>
            <span class="worker-status" :class="w.status">{{ w.status }}</span>
            <span class="worker-meta">{{ w.totalCalls }} 调用 · 重启 {{ w.restartCount }}</span>
          </div>
        </div>
      </div>

      <div class="setting-item" v-if="dashboard">
        <span>导出监控数据</span>
        <div class="export-btns">
          <button class="setting-btn" @click="exportJSON">JSON</button>
          <button class="setting-btn" @click="exportCSV">CSV</button>
        </div>
      </div>
    </div>

    <!-- P4.3 Provider 管理 -->
    <div class="settings-group">
      <h3 class="group-title">Provider 插件管理</h3>
      <div class="provider-list" v-if="providers.length > 0">
        <div
          v-for="p in providers"
          :key="p.id"
          class="provider-card"
          :class="'state-' + p.state"
        >
          <div class="provider-info">
            <div class="provider-header">
              <span class="provider-name">{{ p.name }}</span>
              <span class="provider-version">v{{ p.version }}</span>
              <span class="provider-state" :class="p.state">{{ stateLabel(p.state) }}</span>
            </div>
            <span class="provider-desc">{{ p.description }}</span>
            <span class="provider-error" v-if="p.error">{{ p.error }}</span>
          </div>
          <div class="provider-actions">
            <button
              v-if="p.state === 'loaded'"
              class="provider-btn"
              @click="disableProvider(p.id)"
            >禁用</button>
            <button
              v-if="p.state === 'disabled'"
              class="provider-btn"
              @click="enableProvider(p.id)"
            >启用</button>
            <button
              class="provider-btn"
              @click="reloadProvider(p.id)"
            >重载</button>
          </div>
        </div>
      </div>
      <div class="setting-item" v-else>
        <span>暂无已安装的 Provider 插件</span>
      </div>
    </div>

    <div class="settings-group">
      <h3 class="group-title">关于</h3>
      <div class="setting-item">
        <span>版本</span>
        <span class="setting-value">2.0.0</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCatalogStore } from '@/stores/catalog'
import { providerSDK, ProviderState } from '@/core/provider-sdk'
import type { InstalledProvider } from '@/core/provider-sdk'
import { monitoring } from '@/core/monitoring'
import type { DashboardData } from '@/core/monitoring'
import { aggregationFacade } from '@/core/aggregation'

const userStore = useUserStore()
const catalogStore = useCatalogStore()

const stats = ref({ favorites: 0, history: 0, positions: 0, fileSize: 0 })
const refreshing = ref(false)
const posterProgress = ref({ current: 0, total: 0, name: '' })
const progressPercent = ref(0)

// ======== P4.5 监控 ========
const dashboard = ref<DashboardData | null>(null)

function refreshDashboard() {
  // 同步 Provider 健康状态
  const snapshots = aggregationFacade.getHealthSnapshots()
  monitoring.syncProviders(
    snapshots.map(s => ({
      id: s.providerId,
      name: s.providerName,
      health: s.status,
      restartCount: 0,
    }))
  )
  dashboard.value = monitoring.getDashboard()
}

// ======== P4.3 Provider 管理 ========
const providers = ref<InstalledProvider[]>([])

function syncProviders() {
  providers.value = providerSDK.getInstalledProviders()
}

function stateLabel(state: ProviderState): string {
  const labels: Record<ProviderState, string> = {
    [ProviderState.LOADED]: '已加载',
    [ProviderState.DISABLED]: '已禁用',
    [ProviderState.FAILED]: '加载失败',
    [ProviderState.LOADING]: '加载中',
  }
  return labels[state] || state
}

async function enableProvider(id: string) {
  providerSDK.enableProvider(id)
  syncProviders()
}

async function disableProvider(id: string) {
  providerSDK.disableProvider(id)
  syncProviders()
}

async function reloadProvider(id: string) {
  await providerSDK.reloadProvider(id)
  syncProviders()
}

let unsubPosterProgress: (() => void) | null = null
let unsubProvider: (() => void) | null = null

onMounted(async () => {
  stats.value = await userStore.getStorageStats()
  syncProviders()
  refreshDashboard()
  unsubProvider = providerSDK.subscribe(syncProviders)
  // 监听海报刷新进度
  unsubPosterProgress = window.app.onPosterProgress((data) => {
    posterProgress.value = data
    progressPercent.value = data.total > 0 ? Math.round((data.current / data.total) * 100) : 0
  })
})

onUnmounted(() => {
  if (unsubPosterProgress) unsubPosterProgress()
  if (unsubProvider) unsubProvider()
})

async function clearCache() {
  try { await window.app.clearSearchCache(); catalogStore.clear() } catch { /* ignore */ }
  alert('缓存已清除')
}

function clearHistory() {
  userStore.clearHistory()
  alert('观看历史已清除')
}

async function openDownloadDir() {
  try { await window.app.openDownloadDir() } catch { /* ignore */ }
}

async function refreshPosters() {
  refreshing.value = true
  posterProgress.value = { current: 0, total: 0, name: '' }
  try {
    const result = await window.app.refreshAllPosters()
    if (result.ok) {
      alert(`海报增量刷新已启动！\n共 ${result.total} 部影视\n需刷新 ${result.toRefresh} 部\n\n后台正在搜索最新海报，下方进度条显示实时进度...`)
    } else {
      alert('刷新失败: ' + (result.error || '未知错误'))
    }
  } catch (e) {
    alert('刷新失败: ' + (e as Error).message)
  } finally {
    refreshing.value = false
  }
}

async function forceRefreshPosters() {
  if (!confirm('⚠️ 确定要清除全部旧海报缓存并重新抓取吗？\n\n这将：\n1. 删除所有本地海报文件\n2. 清除海报缓存记录\n3. 从豆瓣等官方源重新搜索并下载\n\n此操作不可撤销，耗时较长。')) return

  refreshing.value = true
  posterProgress.value = { current: 0, total: 0, name: '' }
  try {
    const result = await window.app.forceRefreshAllPosters()
    if (result.ok) {
      alert(`海报强制全量刷新已启动！\n共 ${result.total} 部影视，全部重新抓取\n\n优先使用豆瓣官方海报，下载到本地保存\n下方进度条显示实时进度...`)
    } else {
      alert('刷新失败: ' + (result.error || '未知错误'))
    }
  } catch (e) {
    alert('刷新失败: ' + (e as Error).message)
  } finally {
    refreshing.value = false
  }
}

async function handleExport() {
  const json = await userStore.exportData()
  if (json) {
    // 触发下载（通过创建 Blob + 点击下载）
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lh-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    alert('数据已导出！')
  } else {
    alert('导出失败，请重试')
  }
}

function exportJSON() {
  const json = monitoring.exportJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lh-monitor-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function exportCSV() {
  const csv = monitoring.exportCSV()
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lh-monitor-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const result = await userStore.importData(text)
      alert(result.message)
      stats.value = await userStore.getStorageStats()
    } catch {
      alert('导入失败：无法读取文件')
    }
  }
  input.click()
}
</script>

<style scoped>
.page-title { font-size: var(--text-2xl); font-weight: var(--weight-bold); margin-bottom: var(--space-xl); }
.settings-group { margin-bottom: var(--space-xl); }
.group-title { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: var(--space-md); padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }
.setting-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; font-size: var(--text-sm); }
.setting-value { color: var(--color-text-tertiary); }
.setting-desc { display: block; font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: 2px; }
.setting-btn { padding: 6px 16px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-primary); font-size: var(--text-xs); cursor: pointer; transition: all var(--duration-fast) var(--ease-out); white-space: nowrap; }
.setting-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.setting-btn.danger:hover { border-color: var(--color-danger); color: var(--color-danger); }
.poster-progress { padding: 8px 0; }
.progress-bar-track { width: 100%; height: 6px; background: var(--color-bg-surface); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.progress-bar-fill { height: 100%; background: var(--color-accent); border-radius: 3px; transition: width 0.3s ease; min-width: 2px; }
.progress-text { font-size: var(--text-xs); color: var(--color-text-tertiary); }

/* P4.3 Provider 管理 */
.provider-list { display: flex; flex-direction: column; gap: 10px; }
.provider-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--color-bg-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out);
}
.provider-card.state-loaded { border-left: 3px solid var(--color-success, #4caf50); }
.provider-card.state-disabled { border-left: 3px solid var(--color-text-tertiary); opacity: 0.7; }
.provider-card.state-failed { border-left: 3px solid var(--color-danger); }
.provider-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.provider-header { display: flex; align-items: center; gap: 8px; }
.provider-name { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.provider-version { font-size: var(--text-xs); color: var(--color-text-tertiary); }
.provider-state { font-size: 10px; padding: 1px 8px; border-radius: var(--radius-full); font-weight: var(--weight-medium); }
.provider-state.loaded { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
.provider-state.disabled { background: var(--color-bg-hover); color: var(--color-text-tertiary); }
.provider-state.failed { background: rgba(244, 67, 54, 0.15); color: #f44336; }
.provider-desc { font-size: var(--text-xs); color: var(--color-text-secondary); }
.provider-error { font-size: var(--text-xs); color: var(--color-danger); }
.provider-actions { display: flex; gap: 6px; flex-shrink: 0; }
.provider-btn {
  padding: 4px 12px; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); background: transparent;
  color: var(--color-text-secondary); font-size: var(--text-xs);
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
  white-space: nowrap;
}
.provider-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

/* P4.5 监控面板 */
.monitor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px; }
.monitor-card {
  padding: 12px; background: var(--color-bg-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  display: flex; flex-direction: column; gap: 2px;
}
.monitor-label { font-size: 11px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
.monitor-value { font-size: var(--text-lg); font-weight: var(--weight-bold); color: var(--color-text-primary); }
.monitor-sub { font-size: var(--text-xs); color: var(--color-text-tertiary); }
.monitor-section { margin-top: 16px; }
.monitor-section-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); margin-bottom: 8px; color: var(--color-text-secondary); }
.rank-list, .worker-list { display: flex; flex-direction: column; gap: 6px; }
.rank-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--color-bg-surface); border-radius: var(--radius-sm); font-size: var(--text-xs); }
.rank-num { width: 20px; color: var(--color-text-tertiary); font-weight: var(--weight-bold); }
.rank-name { flex: 1; color: var(--color-text-primary); }
.rank-rate { color: var(--color-accent); font-weight: var(--weight-medium); }
.rank-health { padding: 1px 8px; border-radius: var(--radius-full); font-size: 10px; }
.rank-health.healthy { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
.rank-health.degraded { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
.rank-health.offline, .rank-health.failed { background: rgba(244, 67, 54, 0.15); color: #f44336; }

.worker-item { display: flex; align-items: center; gap: 10px; padding: 6px 10px; background: var(--color-bg-surface); border-radius: var(--radius-sm); font-size: var(--text-xs); }
.worker-name { flex: 1; color: var(--color-text-primary); }
.worker-status { padding: 1px 8px; border-radius: var(--radius-full); font-size: 10px; }
.worker-status.idle { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
.worker-status.busy { background: rgba(33, 150, 243, 0.15); color: #2196f3; }
.worker-status.terminated { background: rgba(244, 67, 54, 0.15); color: #f44336; }
.worker-meta { color: var(--color-text-tertiary); }
.export-btns { display: flex; gap: 6px; }
</style>
