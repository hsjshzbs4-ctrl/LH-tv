// src/stores/platformStore.ts — PB5 Platform Dashboard Store
// Read Only: 数据来源 MetricsAggregator / PluginManager / FeatureFlagManager
// 禁止直接修改平台状态

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyMetrics, RealtimeMetrics } from '@platform/data/types/data.types'
import type { PluginManifest } from '@platform/plugins/types/plugin.types'
import type { FeatureFlag } from '@platform/flags/types/flag.types'
import type { UserAccount } from '@platform/account/types/account.types'
import { SyncStatus } from '@platform/cloud/types/cloud.types'

export interface PlatformState {
  dailyMetrics: DailyMetrics | null
  realtimeMetrics: RealtimeMetrics | null
  plugins: PluginManifest[]
  flags: FeatureFlag[]
  accounts: UserAccount[]
  syncStatus: SyncStatus
  aiAvailable: boolean
}

export const usePlatformStore = defineStore('platform', () => {
  // ── 状态 (只读镜像) ──
  const dailyMetrics = ref<DailyMetrics | null>(null)
  const realtimeMetrics = ref<RealtimeMetrics | null>(null)
  const plugins = ref<PluginManifest[]>([])
  const flags = ref<FeatureFlag[]>([])
  const accounts = ref<UserAccount[]>([])
  const syncStatus = ref<SyncStatus>(SyncStatus.IDLE)
  const aiAvailable = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── 计算属性 ──
  const activeFlags = computed(() => flags.value.filter((f) => f.state !== 'OFF'))
  const enabledPlugins = computed(() => plugins.value.filter((p) => p.state === 'enabled'))

  const totalEvents = computed(() => dailyMetrics.value?.totalEvents ?? 0)
  const activeUsers = computed(() => dailyMetrics.value?.activeUsers ?? 0)
  const crashCount = computed(() => dailyMetrics.value?.crashCount ?? 0)

  // ── 操作 (只读刷新) ──
  function setMetrics(daily: DailyMetrics | null, realtime: RealtimeMetrics | null) {
    dailyMetrics.value = daily
    realtimeMetrics.value = realtime
  }

  function setPlugins(list: PluginManifest[]) {
    plugins.value = list
  }

  function setFlags(list: FeatureFlag[]) {
    flags.value = list
  }

  function setAccounts(list: UserAccount[]) {
    accounts.value = list
  }

  function setSyncStatus(status: SyncStatus) {
    syncStatus.value = status
  }

  function setAIAvailable(available: boolean) {
    aiAvailable.value = available
  }

  function setLoading(l: boolean) {
    loading.value = l
  }

  function setError(e: string | null) {
    error.value = e
  }

  function reset() {
    dailyMetrics.value = null
    realtimeMetrics.value = null
    plugins.value = []
    flags.value = []
    accounts.value = []
    syncStatus.value = SyncStatus.IDLE
    aiAvailable.value = false
    loading.value = false
    error.value = null
  }

  return {
    dailyMetrics, realtimeMetrics, plugins, flags, accounts,
    syncStatus, aiAvailable, loading, error,
    activeFlags, enabledPlugins, totalEvents, activeUsers, crashCount,
    setMetrics, setPlugins, setFlags, setAccounts,
    setSyncStatus, setAIAvailable, setLoading, setError, reset,
  }
})
