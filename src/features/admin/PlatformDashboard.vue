<!-- PlatformDashboard.vue — PB5 平台管理面板 (只读) -->
<template>
  <div class="platform-dashboard">
    <h1 class="dashboard-title">平台管理面板</h1>
    <p class="dashboard-subtitle">PB5 平台状态 · 只读</p>

    <!-- 指标卡片网格 -->
    <div class="metrics-grid">
      <MetricCard label="今日事件" :value="store.totalEvents" />
      <MetricCard label="活跃用户" :value="store.activeUsers" />
      <MetricCard label="崩溃次数" :value="store.crashCount" />
      <MetricCard
        label="启用插件"
        :value="store.enabledPlugins.length"
      />
      <MetricCard
        label="活跃 Flags"
        :value="store.activeFlags.length"
      />
      <MetricCard
        label="AI 状态"
        :value="store.aiAvailable ? 1 : 0"
        :subtitle="store.aiAvailable ? '可用' : '未启用'"
      />
    </div>

    <!-- 插件列表 -->
    <section class="section">
      <h2>已注册插件</h2>
      <div v-if="store.plugins.length === 0" class="empty">暂无插件</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>类型</th>
            <th>版本</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in store.plugins" :key="p.id">
            <td>{{ p.name }}</td>
            <td>{{ p.type }}</td>
            <td>{{ p.version }}</td>
            <td>
              <span :class="stateClass(p.state as string)">
                {{ p.state }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Feature Flags -->
    <section class="section">
      <h2>Feature Flags</h2>
      <div v-if="store.flags.length === 0" class="empty">暂无 Feature Flags</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>状态</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in store.flags" :key="f.key">
            <td><code>{{ f.key }}</code></td>
            <td>
              <span :class="stateClass(f.state as string)">
                {{ f.state }}
              </span>
            </td>
            <td>{{ f.description }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 同步状态 -->
    <section class="section">
      <h2>同步状态</h2>
      <div class="sync-status">
        <span :class="stateClass(store.syncStatus)">
          {{ store.syncStatus }}
        </span>
      </div>
    </section>

    <!-- 加载/错误 -->
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-if="store.error" class="error">{{ store.error }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlatformStore } from '@/stores/platformStore'
import MetricCard from './components/MetricCard.vue'

const store = usePlatformStore()

onMounted(() => {
  // 仪表盘数据由外部注入 (应用启动时从各 Manager 拉取)
  // 这里仅初始化空状态，实际数据由调用方通过 store.setXxx() 写入
})

function stateClass(state: string): string {
  switch (state) {
    case 'enabled':
    case 'PUBLIC':
    case 'authenticated':
    case 'idle':
      return 'state-ok'
    case 'INSTALLED':
    case 'INTERNAL':
      return 'state-warn'
    case 'DISABLED':
    case 'OFF':
    case 'error':
    case 'conflict':
      return 'state-off'
    default:
      return ''
  }
}
</script>

<style scoped>
.platform-dashboard {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--text-primary, #fff);
}
.dashboard-title {
  font-size: 24px;
  margin-bottom: 4px;
}
.dashboard-subtitle {
  font-size: 14px;
  color: var(--text-secondary, #888);
  margin-bottom: 24px;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.section {
  margin-bottom: 24px;
}
.section h2 {
  font-size: 18px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border, #333);
  padding-bottom: 8px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border, #333);
}
.data-table th {
  font-size: 12px;
  color: var(--text-secondary, #888);
  text-transform: uppercase;
}
.state-ok {
  color: var(--success, #4caf50);
}
.state-warn {
  color: var(--warning, #ff9800);
}
.state-off {
  color: var(--text-secondary, #888);
}
.empty {
  color: var(--text-secondary, #888);
  font-style: italic;
}
.loading {
  text-align: center;
  padding: 20px;
}
.error {
  color: var(--error, #f44336);
  padding: 12px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 8px;
}
code {
  background: var(--bg-tertiary, #2a2a3a);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}
</style>
