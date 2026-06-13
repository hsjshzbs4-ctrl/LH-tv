<!-- developer-platform/portal/pages/AnalyticsPage.vue — P5.3 -->
<template>
  <div class="analytics"><h1>Plugin Analytics</h1>
    <div v-if="stats.length===0" class="empty">No analytics data yet.</div>
    <table v-else class="table">
      <thead><tr><th>Plugin</th><th>Downloads</th><th>Installs</th><th>Active Users</th><th>Crash Rate</th></tr></thead>
      <tbody>
        <tr v-for="s in stats" :key="s.pluginId">
          <td>{{ s.pluginId }}</td><td>{{ s.downloads }}</td><td>{{ s.installs }}</td>
          <td>{{ s.activeUsers }}</td><td>{{ s.crashRate }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { pluginAnalyticsService } from '../../analytics/PluginAnalyticsService'
import type { PluginAnalytics } from '../../shared/types'

const stats = ref<PluginAnalytics[]>([])
onMounted(()=>{ stats.value = pluginAnalyticsService.getAll() })
</script>

<style scoped>
.analytics{ padding:24px; max-width:900px; margin:0 auto; }
.table{ width:100%; border-collapse:collapse; margin-top:16px; }
.table th,.table td{ padding:10px; text-align:left; border-bottom:1px solid #eee; font-size:13px; }
.table th{ color:#777; font-weight:600; }
.empty{ text-align:center; color:#999; padding:40px; }
</style>
