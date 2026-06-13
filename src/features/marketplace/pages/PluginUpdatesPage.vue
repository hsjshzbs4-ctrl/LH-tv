<!-- P5.2: PluginUpdatesPage.vue — 插件更新管理 -->
<template>
  <div class="updates-page">
    <h1>Plugin Updates</h1>
    <div v-if="plugins.length === 0" class="empty"><p>No installed plugins.</p></div>
    <div v-else class="updates-list">
      <div v-for="p in plugins" :key="p.id" class="update-item">
        <div class="update-item__info">
          <strong>{{ p.name }}</strong>
          <span class="text-muted">Current: v{{ p.version }}</span>
        </div>
        <div class="update-item__actions">
          <button class="btn btn--sm btn--primary" @click="checkUpdate(p.id)">Check Update</button>
        </div>
      </div>
    </div>
    <div v-if="updateMsg" class="update-msg">{{ updateMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { installedPluginService } from '../services/InstalledPluginService'
import { pluginUpdateManager } from '@/plugin-marketplace'
import type { InstalledPluginMeta } from '@/plugin-marketplace'

const plugins = ref<InstalledPluginMeta[]>([])
const updateMsg = ref('')

async function checkUpdate(pluginId: string) {
  const result = await pluginUpdateManager.checkForUpdates(pluginId)
  updateMsg.value = result.hasUpdate
    ? `Update available: ${result.currentVersion} → ${result.latestVersion}`
    : `Already up to date (${result.currentVersion})`
  setTimeout(() => { updateMsg.value = '' }, 4000)
}

onMounted(() => { plugins.value = installedPluginService.getAll() })
</script>

<style scoped>
.updates-page { padding: 24px; max-width: 800px; margin: 0 auto; }
.updates-page h1 { font-size: 24px; }
.update-item { display: flex; justify-content: space-between; align-items: center; padding: 14px; border: 1px solid #eee; border-radius: 8px; margin: 8px 0; }
.update-item__info { display: flex; flex-direction: column; gap: 4px; }
.empty, .text-muted { text-align: center; color: #999; }
.update-msg { margin-top: 16px; padding: 12px; background: #e3f2fd; border-radius: 8px; font-size: 14px; color: #1565c0; }
.btn { border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn--sm { font-size: 12px; padding: 6px 14px; }
.btn--primary { background: var(--accent, #5c6bc0); color: #fff; }
</style>
